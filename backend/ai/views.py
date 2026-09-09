"""
ai/views.py

Three AI-powered endpoints:
  POST /api/ai/parse-workout/    — Natural-language → structured set logs
  POST /api/ai/quest-generate/   — Generate personalized quest flavour text
  POST /api/ai/coach/            — Stateful AI Coach chat with tool access
"""

import json
import anthropic

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .tools import COACH_TOOLS, execute_tool


def _get_client():
    """Return a configured Anthropic client, raising clearly if key is missing."""
    api_key = getattr(settings, "ANTHROPIC_API_KEY", "")
    if not api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY is not set. Add it to your environment or backend/.env file."
        )
    return anthropic.Anthropic(api_key=api_key)


# ─── Natural-Language Workout Parser ──────────────────────────────────────────

class ParseWorkoutView(APIView):
    """
    POST /api/ai/parse-workout/

    Body: { "text": "3 sets of bench press at 80kg, 10 reps each. Also did 4 sets of squats 100kg 8 reps" }
    Returns: { "exercises": [ { "exercise_name": "...", "sets": [...] } ] }

    Uses Claude to parse free-text workout descriptions into structured data
    that the frontend can use to auto-fill the active workout logging rows.
    """

    def post(self, request):
        text = request.data.get("text", "").strip()
        if not text:
            return Response(
                {"detail": "No workout text provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        system_prompt = (
            "You are a fitness data parser. The user will describe a workout they did in natural language. "
            "Your job is to extract structured exercise data from their description.\n\n"
            "Return ONLY a valid JSON object with this exact structure:\n"
            "{\n"
            '  "exercises": [\n'
            "    {\n"
            '      "exercise_name": "string — exact exercise name as the user described",\n'
            '      "sets": [\n'
            "        {\n"
            '          "reps": number or null,\n'
            '          "weight_kg": number or null,\n'
            '          "duration_seconds": number or null\n'
            "        }\n"
            "      ]\n"
            "    }\n"
            "  ]\n"
            "}\n\n"
            "Rules:\n"
            "- If the user says '3 sets of X at 80kg 10 reps', create 3 identical set objects.\n"
            "- If weight is in lbs, convert to kg (divide by 2.205).\n"
            "- If no weight mentioned, set weight_kg to null.\n"
            "- If it's a timed exercise (plank, run, etc.), use duration_seconds instead of reps.\n"
            "- Return ONLY the JSON — no markdown, no explanation."
        )

        try:
            client = _get_client()
            message = client.messages.create(
                model="claude-haiku-4-5",
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": text}],
            )

            raw = message.content[0].text.strip()
            # Strip markdown code fences if Claude wraps the JSON
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()

            parsed = json.loads(raw)
            return Response(parsed)

        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except json.JSONDecodeError:
            return Response(
                {"detail": "AI returned unparseable data. Try rephrasing your workout."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        except Exception as exc:
            return Response(
                {"detail": f"AI service error: {str(exc)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


# ─── AI Quest Generator ────────────────────────────────────────────────────────

class QuestGenerateView(APIView):
    """
    POST /api/ai/quest-generate/

    No body required — uses the authenticated user's profile and recent history.
    Returns: { "quests": [ { "title": "...", "description": "...", "flavor": "..." }, ... ] }

    Generates Solo Leveling-flavoured quest copy personalised to the user's stats.
    The generated text enriches existing quest titles — it doesn't create DB records.
    """

    def post(self, request):
        user = request.user
        profile = user.profile

        # Build compact user context to keep the prompt short
        context = (
            f"Hunter: {user.username}\n"
            f"Level {profile.level} | Rank {profile.rank} | Streak: {profile.current_streak} days\n"
            f"Stats — STR:{profile.stat_str} VIT:{profile.stat_vit} AGI:{profile.stat_agi} "
            f"END:{profile.stat_end} FLX:{profile.stat_flx} PER:{profile.stat_per}\n"
            f"Goal: {profile.fitness_goal} | Experience: {profile.experience_level}"
        )

        system_prompt = (
            "You are 'The System' — the all-knowing AI interface from the Solo Leveling universe. "
            "You speak in short, dramatic, second-person commands. You know the Hunter's stats and "
            "tailor quests specifically to their current weaknesses and goals.\n\n"
            "Generate exactly 3 daily quests for this Hunter. Return ONLY valid JSON:\n"
            "{\n"
            '  "quests": [\n'
            "    {\n"
            '      "title": "short quest name (≤8 words)",\n'
            '      "description": "one sentence describing what to do — specific, actionable",\n'
            '      "flavor": "one dramatic System-voice sentence (e.g. \'Your vitality wanes, Hunter. Restore it.\')",\n'
            '      "xp_reward": number between 40 and 150\n'
            "    }\n"
            "  ]\n"
            "}\n\n"
            "Make quests relevant to their weakest stat. No markdown. Return only JSON."
        )

        try:
            client = _get_client()
            message = client.messages.create(
                model="claude-haiku-4-5",
                max_tokens=800,
                system=system_prompt,
                messages=[{"role": "user", "content": context}],
            )

            raw = message.content[0].text.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()

            parsed = json.loads(raw)
            return Response(parsed)

        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except json.JSONDecodeError:
            return Response(
                {"detail": "AI returned unparseable data."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        except Exception as exc:
            return Response(
                {"detail": f"AI service error: {str(exc)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


# ─── AI Coach Chat ─────────────────────────────────────────────────────────────

class CoachView(APIView):
    """
    POST /api/ai/coach/

    Body: {
        "messages": [
            { "role": "user", "content": "How should I improve my strength?" },
            { "role": "assistant", "content": "..." },
            ...
        ]
    }

    Returns: { "reply": "...", "tools_used": ["get_hunter_profile", ...] }

    Runs an agentic loop: Claude can call tools (get_hunter_profile, get_recent_sessions,
    get_today_quests, get_exercise_library) and we execute them server-side before
    returning the final text reply. The frontend maintains message history in state.
    """

    SYSTEM_PROMPT = (
        "You are The System — the omniscient AI interface from a Solo Leveling-inspired fitness app called ASCEND. "
        "You speak in first person as 'The System', using dramatic, slightly formal language with military precision. "
        "You address the user as 'Hunter' and refer to workouts as 'dungeon runs', exercises as 'combat skills', "
        "rest days as 'recovery periods', and progress as 'levelling up'.\n\n"
        "You have access to the Hunter's real data through your tools. ALWAYS call get_hunter_profile first "
        "when the user asks anything about their stats, progress, or what to work on — reference their actual numbers.\n\n"
        "Your answers are concise, confident, and practical. You give real fitness advice grounded in exercise science, "
        "not just flavour text. After the dramatic framing, always include actionable, specific guidance.\n\n"
        "Keep responses under 300 words. Use line breaks for readability. Never break character."
    )

    def post(self, request):
        messages = request.data.get("messages", [])
        if not messages:
            return Response(
                {"detail": "No messages provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate message structure
        for msg in messages:
            if msg.get("role") not in ("user", "assistant"):
                return Response(
                    {"detail": "Invalid message role. Must be 'user' or 'assistant'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            client = _get_client()
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        tools_used = []

        try:
            # Agentic loop: keep calling Claude until it stops requesting tool calls
            current_messages = list(messages)

            while True:
                response = client.messages.create(
                    model="claude-haiku-4-5",
                    max_tokens=1024,
                    system=self.SYSTEM_PROMPT,
                    tools=COACH_TOOLS,
                    messages=current_messages,
                )

                # If Claude wants to use tools, execute them and continue
                if response.stop_reason == "tool_use":
                    # Append Claude's response (which contains tool_use blocks) to messages
                    current_messages.append({
                        "role": "assistant",
                        "content": response.content,
                    })

                    # Process each tool call and build tool_result blocks
                    tool_results = []
                    for block in response.content:
                        if block.type == "tool_use":
                            tools_used.append(block.name)
                            result = execute_tool(block.name, block.input, request.user)
                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": json.dumps(result),
                            })

                    # Feed tool results back to Claude
                    current_messages.append({
                        "role": "user",
                        "content": tool_results,
                    })
                    # Loop continues — Claude will now formulate its final reply

                else:
                    # Claude is done (stop_reason == "end_turn" or similar)
                    # Extract the text reply
                    reply_text = ""
                    for block in response.content:
                        if hasattr(block, "text"):
                            reply_text += block.text

                    return Response({
                        "reply": reply_text.strip(),
                        "tools_used": list(set(tools_used)),
                    })

        except Exception as exc:
            return Response(
                {"detail": f"AI service error: {str(exc)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
