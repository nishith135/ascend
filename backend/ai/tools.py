"""
ai/tools.py

Defines the tool schemas that Claude uses during AI Coach conversations,
and the Python handler functions that execute when Claude calls a tool.
Each tool fetches data from the existing Django models — no new DB schema needed.
"""

from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, F


# ─── Tool Schemas (sent to Claude in every Coach request) ─────────────────────

COACH_TOOLS = [
    {
        "name": "get_hunter_profile",
        "description": (
            "Retrieves the Hunter's (user's) current RPG stats: level, XP, rank, streak, "
            "and all six stats (STR, VIT, AGI, END, FLX, PER). Use this to personalise "
            "advice or answer questions about the user's current standing."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_recent_sessions",
        "description": (
            "Retrieves the user's last N completed workout sessions (default 5). "
            "Each session includes name, date, duration, XP earned, and a list of exercises. "
            "Use this to reference recent training history and give specific feedback."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "How many recent sessions to return (1–10). Defaults to 5.",
                    "default": 5,
                }
            },
            "required": [],
        },
    },
    {
        "name": "get_today_quests",
        "description": (
            "Returns the user's active quests for today (daily + weekly), including "
            "progress toward each quest goal and XP rewards. Use this to remind the "
            "user of pending quests or assess how close they are to completing them."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_exercise_library",
        "description": (
            "Returns a list of exercises in the library, optionally filtered by muscle group. "
            "Use this to recommend specific exercises relevant to the user's query."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "muscle_group": {
                    "type": "string",
                    "description": (
                        "Filter by muscle group. One of: chest, back, shoulders, legs, "
                        "arms, core, full_body, cardio, flexibility. Omit to get all."
                    ),
                }
            },
            "required": [],
        },
    },
]


# ─── Tool Handler ─────────────────────────────────────────────────────────────

def execute_tool(tool_name: str, tool_input: dict, user) -> dict:
    """
    Dispatch a tool call from Claude to the appropriate Python function.
    Returns a dict that will be serialised and sent back to Claude as a tool result.
    """
    handlers = {
        "get_hunter_profile": _get_hunter_profile,
        "get_recent_sessions": _get_recent_sessions,
        "get_today_quests": _get_today_quests,
        "get_exercise_library": _get_exercise_library,
    }

    handler = handlers.get(tool_name)
    if not handler:
        return {"error": f"Unknown tool: {tool_name}"}

    try:
        return handler(tool_input, user)
    except Exception as exc:
        return {"error": str(exc)}


# ─── Individual Tool Implementations ──────────────────────────────────────────

def _get_hunter_profile(tool_input: dict, user) -> dict:
    profile = user.profile
    return {
        "username": user.username,
        "level": profile.level,
        "xp": profile.xp,
        "xp_for_next_level": profile.xp_for_next_level,
        "rank": profile.rank,
        "current_streak": profile.current_streak,
        "stats": {
            "STR": profile.stat_str,
            "VIT": profile.stat_vit,
            "AGI": profile.stat_agi,
            "END": profile.stat_end,
            "FLX": profile.stat_flx,
            "PER": profile.stat_per,
        },
        "fitness_goal": profile.fitness_goal,
        "experience_level": profile.experience_level,
    }


def _get_recent_sessions(tool_input: dict, user) -> dict:
    from workouts.models import WorkoutSession, SetLog

    limit = min(int(tool_input.get("limit", 5)), 10)
    sessions = WorkoutSession.objects.filter(
        user=user,
        finished_at__isnull=False,
    ).prefetch_related("sets__exercise")[:limit]

    result = []
    for s in sessions:
        # Aggregate exercises logged in this session
        exercise_names = list(
            s.sets.values_list("exercise__name", flat=True).distinct()
        )
        total_volume = sum(
            (float(sl.weight_kg or 0) * (sl.reps or 0)) for sl in s.sets.all()
        )
        result.append({
            "id": s.id,
            "name": s.name,
            "date": s.started_at.date().isoformat(),
            "duration_minutes": s.duration_minutes,
            "xp_earned": s.xp_earned,
            "exercises": exercise_names,
            "total_sets": s.sets.count(),
            "total_volume_kg": round(total_volume, 1),
        })

    return {"sessions": result, "count": len(result)}


def _get_today_quests(tool_input: dict, user) -> dict:
    from gamification.models import Quest
    from datetime import date

    today = date.today()
    quests = Quest.objects.filter(
        user=user,
        status="active",
        assigned_date__gte=today - timedelta(days=7),
    )

    result = []
    for q in quests:
        result.append({
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "type": q.quest_type,
            "status": q.status,
            "goal_current": q.goal_current,
            "goal_target": q.goal_target,
            "progress_pct": q.progress_pct,
            "xp_reward": q.xp_reward,
            "expires_at": q.expires_at.isoformat(),
        })

    return {"quests": result, "count": len(result)}


def _get_exercise_library(tool_input: dict, user) -> dict:
    from exercises.models import Exercise

    qs = Exercise.objects.all()
    muscle_group = tool_input.get("muscle_group")
    if muscle_group:
        qs = qs.filter(muscle_group=muscle_group)

    exercises = [
        {
            "name": ex.name,
            "muscle_group": ex.get_muscle_group_display(),
            "equipment": ex.get_equipment_display(),
            "primary_stat": ex.default_stat,
        }
        for ex in qs[:50]  # cap at 50 to keep context manageable
    ]
    return {"exercises": exercises, "count": len(exercises)}
