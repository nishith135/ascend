from celery import shared_task
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.timezone import make_aware
from datetime import date, datetime, timedelta
import random

from .models import Quest
from .quest_definitions import DAILY_QUEST_POOL


@shared_task
def reset_daily_quests_task():
    """
    Periodic task to expire yesterday's daily quests and generate fresh quests
    for all active hunters.
    """
    today = date.today()
    now = timezone.now()

    # 1. Expire stale quests
    expired_count = Quest.objects.filter(
        status='active',
        expires_at__lt=now,
    ).update(status='expired')

    # 2. Generate daily quests for users who don't have today's quests yet
    users = User.objects.filter(is_active=True)
    generated_count = 0
    tomorrow = datetime.combine(today + timedelta(days=1), datetime.min.time())
    expires_at = make_aware(tomorrow)

    for user in users:
        has_quests = Quest.objects.filter(
            user=user,
            quest_type='daily',
            assigned_date=today,
        ).exists()

        if not has_quests and DAILY_QUEST_POOL:
            pool = random.sample(DAILY_QUEST_POOL, min(3, len(DAILY_QUEST_POOL)))
            for definition in pool:
                Quest.objects.create(
                    user=user,
                    assigned_date=today,
                    expires_at=expires_at,
                    quest_type='daily',
                    **definition,
                )
            generated_count += 1

    return {
        'expired_quests': expired_count,
        'users_assigned_quests': generated_count,
    }


@shared_task
def check_daily_streaks_task():
    """
    Periodic task to evaluate hunter streaks.
    If a user has not worked out in > 1 day, reset their active streak to 0.
    """
    today = timezone.localdate()
    yesterday = today - timedelta(days=1)

    users = User.objects.filter(is_active=True).select_related('profile')
    reset_count = 0

    for user in users:
        profile = getattr(user, 'profile', None)
        if not profile:
            continue

        if profile.current_streak > 0:
            # If last workout was before yesterday, streak is broken
            if not profile.last_workout_date or profile.last_workout_date < yesterday:
                profile.current_streak = 0
                profile.save(update_fields=['current_streak'])
                reset_count += 1

    return {'streaks_reset': reset_count}
