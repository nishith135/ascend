"""
ai/views.py

Three AI-powered endpoints:
  POST /api/ai/parse-workout/    — Natural-language → structured set logs
  POST /api/ai/quest-generate/   — Generate personalized quest flavour text
  POST /api/ai/coach/            — Stateful AI Coach chat with tool access

All endpoints route through ai/client.py, supporting Anthropic, Groq, OpenAI,
or any OpenAI-compatible provider seamlessly.
"""

import json
import logging

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .tools import COACH_TOOLS, execute_tool
from .client import simple_chat, run_agentic_loop

logger = logging.getLogger(__name__)


def _clean_json_response(raw: str):
    """Strip markdown code blocks if the model outputs them, then parse JSON."""
    raw = raw.strip()
    if raw.startswith("```"):
        # Split on triple backticks and get the inner content
        parts = raw.split("```")
        if len(parts) >= 2:
            raw = parts[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
    return json.loads(raw)


import re

def _fallback_parse_workout(text: str) -> dict:
    """
    Intelligent heuristic regex parser that extracts exercises, sets, reps, and weights
    when the external AI model is unreachable or unconfigured.
    """
    exercises = []
    # Split on semicolons, newlines, "and also", "and", commas
    chunks = re.split(r'[\n;,]|\band\s+also\b|\band\b', text, flags=re.IGNORECASE)

    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk or len(chunk) < 3:
            continue

        # Pattern 1: e.g. "3 sets of bench press at 80kg 10 reps" or "4x squats 100kg 8 reps"
        # Pattern 2: e.g. "bench press 3x10 80kg" or "pullups 3 sets 10 reps"
        m1 = re.search(
            r'(?:did\s+)?(\d+)\s*(?:sets?|x)\s*(?:of\s*)?([a-zA-Z\s]+?)(?:\s*(?:at|@)\s*(\d+(?:\.\d+)?)\s*(?:kg|lbs)?)?(?:\s*(?:for|,|\s)\s*(\d+)\s*reps?)?$',
            chunk, re.IGNORECASE
        )
        m2 = re.search(
            r'([a-zA-Z\s]+?)\s*(\d+)\s*(?:sets?|x)\s*(\d+)\s*(?:reps?)?(?:\s*(?:at|@)\s*(\d+(?:\.\d+)?)\s*(?:kg|lbs)?)?',
            chunk, re.IGNORECASE
        )

        name = None
        num_sets = 3
        reps = 10
        weight_kg = None

        if m1 and m1.group(2).strip():
            num_sets = int(m1.group(1))
            name = m1.group(2).strip()
            if m1.group(3):
                weight_kg = float(m1.group(3))
            if m1.group(4):
                reps = int(m1.group(4))
        elif m2 and m2.group(1).strip():
            name = m2.group(1).strip()
            num_sets = int(m2.group(2))
            reps = int(m2.group(3))
            if m2.group(4):
                weight_kg = float(m2.group(4))
        else:
            # Fallback simple extractor: find first sequence of words as name
            name_match = re.search(r'([a-zA-Z\s]{4,})', chunk)
            if name_match:
                name = name_match.group(1).strip()
                reps_match = re.search(r'(\d+)\s*reps?', chunk)
                if reps_match:
                    reps = int(reps_match.group(1))
                weight_match = re.search(r'(\d+(?:\.\d+)?)\s*kg', chunk)
                if weight_match:
                    weight_kg = float(weight_match.group(1))

        if name:
            # Clean up common filler words
            clean_name = re.sub(r'^(did|completed|finished|hit|logged)\s+', '', name, flags=re.IGNORECASE).strip()
            if len(clean_name) >= 3:
                exercises.append({
                    "exercise_name": clean_name.title(),
                    "sets": [
                        {
                            "reps": reps,
                            "weight_kg": weight_kg,
                            "duration_seconds": None,
                        }
                        for _ in range(max(1, min(num_sets, 10)))
                    ]
                })

    return {"exercises": exercises}


def _fallback_generate_quests(user) -> dict:
    """
    Template-based quest generator delivering Solo Leveling flavor text
    tailored to the user's lowest stat when LLM API is unavailable.
    """
    profile = user.profile
    stats_dict = {
        'STR': profile.stat_str,
        'VIT': profile.stat_vit,
        'AGI': profile.stat_agi,
        'END': profile.stat_end,
        'FLX': profile.stat_flx,
        'PER': profile.stat_per,
    }
    lowest_stat = min(stats_dict, key=stats_dict.get)

    lore_quests = {
        'STR': [
            {
                "title": "Gate of Destruction: Iron Trial",
                "description": "Log at least 3 sets of compound heavy lifts.",
                "flavor": f"[System Warning] Your STR stat ({profile.stat_str}) is vulnerable. Overcome gravity to forge unbreakable might.",
                "xp_reward": 85,
            },
            {
                "title": "Shadow Monarch's Grip",
                "description": "Achieve a total lifting volume of over 500kg today.",
                "flavor": "[System Notice] Prove you possess the strength to command the shadows.",
                "xp_reward": 100,
            },
            {
                "title": "Physical Awakening",
                "description": "Perform 4 sets targeting your chest or back.",
                "flavor": "[System Directive] Muscle fibers must tear and reconstruct. Arise stronger.",
                "xp_reward": 75,
            },
        ],
        'AGI': [
            {
                "title": "Swift Shadow Movement",
                "description": "Log 15 minutes of cardio or high-speed intervals.",
                "flavor": f"[System Notice] Your Agility ({profile.stat_agi}) lags behind the beasts of the dungeon.",
                "xp_reward": 80,
            },
            {
                "title": "Evasion Calibration",
                "description": "Complete 3 rapid sets with minimal rest intervals.",
                "flavor": "[System Directive] Speed is the boundary between victory and annihilation.",
                "xp_reward": 90,
            },
            {
                "title": "Shadow Step Training",
                "description": "Log high-intensity bodyweight sets.",
                "flavor": "[System Notice] Move like darkness across the floor.",
                "xp_reward": 70,
            },
        ],
        'VIT': [
            {
                "title": "Mana Restoration & Hydration",
                "description": "Log at least 2,000ml of water in your Supply Depot today.",
                "flavor": f"[System Alert] Vitality depleted. Without water and fuel, your body will face Penalty Zone consequences.",
                "xp_reward": 60,
            },
            {
                "title": "Hunter's Sustenance",
                "description": "Hit your target protein requirement today.",
                "flavor": "[System Directive] Consume sufficient nutrients to accelerate recovery cells.",
                "xp_reward": 75,
            },
            {
                "title": "Cellular Regeneration",
                "description": "Complete a light recovery session and log hydration.",
                "flavor": "[System Notice] Even an S-Rank Hunter must rebuild energy reserves.",
                "xp_reward": 65,
            },
        ],
    }

    selected = lore_quests.get(lowest_stat, lore_quests['STR'])
    return {"quests": selected}


def _fallback_coach_chat(user, messages: list) -> tuple:
    """
    Offline System Coach response that looks up real Hunter stats and history.
    """
    last_msg = messages[-1].get("content", "").lower() if messages else ""
    profile_data = execute_tool("get_hunter_profile", {}, user)
    sessions_data = execute_tool("get_recent_sessions", {"limit": 3}, user)
    
    rank = profile_data.get('rank', 'E')
    lvl = profile_data.get('level', 1)
    xp = profile_data.get('xp', 0)
    streak = profile_data.get('current_streak', 0)
    stats = profile_data.get('stats', {})
    recent = sessions_data.get('sessions', [])
    recent_names = ", ".join([s['name'] for s in recent]) if recent else "None yet"

    if any(k in last_msg for k in ['status', 'stat', 'profile', 'level', 'rank', 'xp']):
        reply = (
            f"[SYSTEM INTERFACE OPENED]\n\n"
            f"Hunter {user.username}, I have scanned your Hunter Status:\n"
            f"• Classification: {rank}-Rank Hunter (Level {lvl})\n"
            f"• Total XP: {xp} points | Streak: {streak} days\n"
            f"• Attributes: STR {stats.get('STR', 0)} | VIT {stats.get('VIT', 0)} | AGI {stats.get('AGI', 0)} | END {stats.get('END', 0)} | FLX {stats.get('FLX', 0)} | PER {stats.get('PER', 0)}\n\n"
            f"Recommendation: Allocate additional training volume to your lagging attributes to prepare for your next Rank Evaluation."
        )
    elif any(k in last_msg for k in ['workout', 'routine', 'exercise', 'train', 'plan']):
        reply = (
            f"[TACTICAL SYSTEM DIRECTIVE]\n\n"
            f"Recent dungeon excursions: {recent_names}.\n\n"
            f"For your current {rank}-Rank capacity, prioritize compound movements:\n"
            f"1. Heavy Pressing (Barbell Bench Press or Overhead Press) — 3 sets of 8-10 reps.\n"
            f"2. Core Stability & Lower Chain (Squats / Deadlifts) — 3 sets of 6-8 reps.\n"
            f"3. Recovery Hydration — replenish 500ml water immediately post-clear.\n\n"
            f"Execute the sets with strict form, Hunter. Do not disappoint The System."
        )
    else:
        reply = (
            f"[SYSTEM BROADCAST]\n\n"
            f"Greetings, Hunter {user.username}. I am The System, monitoring your ascension from {rank}-Rank.\n\n"
            f"Your current status registers at Level {lvl} with {streak} consecutive days of discipline. "
            f"Every set logged in the Dungeon increases your combat power. "
            f"State your training inquiry or ask for an analysis of your stats."
        )

    return reply, ["get_hunter_profile", "get_recent_sessions"]


# ─── Natural-Language Workout Parser ──────────────────────────────────────────

class ParseWorkoutView(APIView):
    """
    POST /api/ai/parse-workout/
    Body: { "text": "3 sets of bench press at 80kg, 10 reps each." }
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
            "- Return ONLY the JSON — no markdown, no explanation."
        )

        try:
            raw_text = simple_chat(
                messages=[{"role": "user", "content": text}],
                system=system_prompt,
                max_tokens=1024,
            )
            parsed = _clean_json_response(raw_text)
            return Response(parsed)

        except Exception:
            logger.exception("AI parse-workout failed; using fallback parser")
            # Fallback to local regex heuristic parser
            fallback_parsed = _fallback_parse_workout(text)
            if fallback_parsed.get("exercises"):
                return Response(fallback_parsed)
            return Response(
                {"detail": "Could not parse workout text. Please describe exercises with sets and reps."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )


# ─── AI Quest Generator ────────────────────────────────────────────────────────

class QuestGenerateView(APIView):
    """
    POST /api/ai/quest-generate/
    """

    def post(self, request):
        user = request.user
        profile = user.profile

        context = (
            f"Hunter: {user.username}\n"
            f"Level {profile.level} | Rank {profile.rank} | Streak: {profile.current_streak} days\n"
            f"Stats — STR:{profile.stat_str} VIT:{profile.stat_vit} AGI:{profile.stat_agi} "
            f"END:{profile.stat_end} FLX:{profile.stat_flx} PER:{profile.stat_per}\n"
            f"Goal: {profile.fitness_goal} | Experience: {profile.experience_level}"
        )

        system_prompt = (
            "You are 'The System' from Solo Leveling. Generate exactly 3 daily quests. Return ONLY JSON:\n"
            "{\n"
            '  "quests": [\n'
            "    {\n"
            '      "title": "short quest name",\n'
            '      "description": "one sentence describing what to do",\n'
            '      "flavor": "one dramatic sentence in System voice",\n'
            '      "xp_reward": number between 40 and 150\n'
            "    }\n"
            "  ]\n"
            "}\n"
            "No markdown. Return only JSON."
        )

        try:
            raw_text = simple_chat(
                messages=[{"role": "user", "content": context}],
                system=system_prompt,
                max_tokens=800,
            )
            parsed = _clean_json_response(raw_text)
            return Response(parsed)

        except Exception:
            logger.exception("AI quest-generate failed; using fallback generator")
            # Fallback to rich Solo Leveling lore generator
            return Response(_fallback_generate_quests(user))


# ─── AI Coach Chat ─────────────────────────────────────────────────────────────

class CoachView(APIView):
    """
    POST /api/ai/coach/
    """

    SYSTEM_PROMPT = (
        "You are The System — the omniscient AI interface from Solo Leveling. "
        "Address the user as 'Hunter'. Reference their actual stats via tools. "
        "Concise, practical, and dramatic."
    )

    def post(self, request):
        messages = request.data.get("messages", [])
        if not messages:
            return Response(
                {"detail": "No messages provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for msg in messages:
            if msg.get("role") not in ("user", "assistant"):
                return Response(
                    {"detail": "Invalid message role. Must be 'user' or 'assistant'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            reply_text, tools_used = run_agentic_loop(
                messages=messages,
                system=self.SYSTEM_PROMPT,
                tools=COACH_TOOLS,
                tool_executor=lambda name, inp: execute_tool(name, inp, request.user),
                max_tokens=1024,
            )
            return Response({
                "reply": reply_text.strip(),
                "tools_used": tools_used,
            })

        except Exception:
            logger.exception("AI coach failed; using fallback coach")
            reply_text, tools_used = _fallback_coach_chat(request.user, messages)
            return Response({
                "reply": reply_text,
                "tools_used": tools_used,
            })
