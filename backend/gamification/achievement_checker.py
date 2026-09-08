"""
Achievement checker — called after a session is finished or a quest is completed.
Checks all defined achievement conditions and unlocks any not yet earned by the user.
Returns a list of newly created UserAchievement instances.
"""

from django.utils import timezone
from .models import Achievement, UserAchievement


def check_and_unlock_achievements(user):
    """
    Check all achievement unlock conditions for `user`.
    Returns a list of newly created UserAchievement objects.
    """
    newly_unlocked = []
    already_unlocked = set(
        UserAchievement.objects.filter(user=user).values_list('achievement__key', flat=True)
    )

    profile = user.profile
    session_qs = user.sessions.filter(finished_at__isnull=False)
    total_sessions = session_qs.count()
    total_xp = profile.xp
    streak = profile.current_streak

    # Import here to avoid circular imports
    from workouts.models import SetLog
    total_sets = SetLog.objects.filter(session__user=user, session__finished_at__isnull=False).count()

    checkers = [
        # (achievement_key, condition_bool)
        ('first_blood', total_sessions >= 1),
        ('iron_will', total_sessions >= 10),
        ('shadow_monarch_10', total_sessions >= 25),
        ('centurion', total_sessions >= 100),
        ('xp_100', total_xp >= 100),
        ('xp_500', total_xp >= 500),
        ('xp_1000', total_xp >= 1000),
        ('xp_5000', total_xp >= 5000),
        ('streak_3', streak >= 3),
        ('streak_7', streak >= 7),
        ('streak_30', streak >= 30),
        ('set_king_50', total_sets >= 50),
        ('set_king_500', total_sets >= 500),
        ('e_rank', profile.rank in ['E', 'D', 'C', 'B', 'A', 'S']),
        ('d_rank', profile.rank in ['D', 'C', 'B', 'A', 'S']),
        ('c_rank', profile.rank in ['C', 'B', 'A', 'S']),
        ('b_rank', profile.rank in ['B', 'A', 'S']),
        ('a_rank', profile.rank in ['A', 'S']),
        ('s_rank', profile.rank == 'S'),
    ]

    for key, condition in checkers:
        if condition and key not in already_unlocked:
            try:
                achievement = Achievement.objects.get(key=key)
                ua = UserAchievement.objects.create(user=user, achievement=achievement)
                newly_unlocked.append(ua)
                # Award bonus XP for achievement
                if achievement.xp_reward > 0:
                    profile.add_xp(achievement.xp_reward)
            except Achievement.DoesNotExist:
                pass  # Achievement not seeded yet, skip

    return newly_unlocked
