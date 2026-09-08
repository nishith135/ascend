"""
Quest pool definitions — template dicts used to instantiate Quest objects.
Each entry maps directly to Quest model fields (minus user/dates).
"""

DAILY_QUEST_POOL = [
    {
        'title': 'Shadow Step',
        'description': 'Complete 1 workout session today.',
        'goal_type': 'complete_workouts',
        'goal_target': 1,
        'xp_reward': 60,
    },
    {
        'title': 'Iron Resolve',
        'description': 'Log at least 10 sets in a single session.',
        'goal_type': 'log_sets',
        'goal_target': 10,
        'xp_reward': 80,
    },
    {
        'title': 'Monarch\'s Discipline',
        'description': 'Complete a workout before noon.',
        'goal_type': 'complete_workouts',
        'goal_target': 1,
        'xp_reward': 70,
    },
    {
        'title': 'Gate Breaker',
        'description': 'Log a strength exercise with at least 5 sets.',
        'goal_type': 'log_sets',
        'goal_target': 5,
        'xp_reward': 50,
    },
    {
        'title': 'Arise',
        'description': 'Log any workout today and rise from the ashes.',
        'goal_type': 'complete_workouts',
        'goal_target': 1,
        'xp_reward': 55,
    },
    {
        'title': 'Dungeon Dive',
        'description': 'Start and complete a dungeon run (use a saved template).',
        'goal_type': 'complete_workouts',
        'goal_target': 1,
        'xp_reward': 90,
    },
    {
        'title': 'Mana Surge',
        'description': 'Log 15 or more total sets today.',
        'goal_type': 'log_sets',
        'goal_target': 15,
        'xp_reward': 100,
    },
    {
        'title': 'Shadow Soldier',
        'description': 'Complete 2 separate workout sessions today.',
        'goal_type': 'complete_workouts',
        'goal_target': 2,
        'xp_reward': 120,
    },
]

WEEKLY_QUEST_POOL = [
    {
        'title': 'S-Class Hunter\'s Week',
        'description': 'Complete 5 workout sessions this week.',
        'goal_type': 'complete_workouts',
        'goal_target': 5,
        'xp_reward': 300,
    },
    {
        'title': 'Iron Curtain',
        'description': 'Log at least 50 total sets this week.',
        'goal_type': 'log_sets',
        'goal_target': 50,
        'xp_reward': 350,
    },
    {
        'title': 'Dungeon Conqueror',
        'description': 'Clear 4 dungeons (workouts) this week.',
        'goal_type': 'complete_workouts',
        'goal_target': 4,
        'xp_reward': 250,
    },
    {
        'title': 'Shadow Monarch\'s Trial',
        'description': 'Log 6 sessions and prove your dominance.',
        'goal_type': 'complete_workouts',
        'goal_target': 6,
        'xp_reward': 400,
    },
    {
        'title': 'Sovereign\'s Grind',
        'description': 'Log 80 total sets across all sessions this week.',
        'goal_type': 'log_sets',
        'goal_target': 80,
        'xp_reward': 450,
    },
]
