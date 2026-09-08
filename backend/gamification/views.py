from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from django.utils import timezone
from django.utils.timezone import make_aware
from datetime import date, datetime, timedelta
import random

from .models import Quest, Achievement, UserAchievement
from .serializers import QuestSerializer, UserAchievementSerializer, AchievementSerializer
from .quest_definitions import DAILY_QUEST_POOL, WEEKLY_QUEST_POOL
from .achievement_checker import check_and_unlock_achievements


# ─── Quests ───────────────────────────────────────────────────────────────────

class TodayQuestsView(APIView):
    """
    GET  /api/gamification/quests/today/
        Returns today's active quests for the user, generating them if needed.
    """

    def get(self, request):
        today = date.today()
        # Expire any stale quests
        Quest.objects.filter(
            user=request.user,
            status='active',
            expires_at__lt=timezone.now()
        ).update(status='expired')

        # Check if today's daily quests already exist
        todays_quests = Quest.objects.filter(
            user=request.user,
            quest_type='daily',
            assigned_date=today,
        )

        if not todays_quests.exists():
            todays_quests = self._generate_daily_quests(request.user, today)

        # Check for weekly quest
        week_start = today - timedelta(days=today.weekday())
        weekly_quest = Quest.objects.filter(
            user=request.user,
            quest_type='weekly',
            assigned_date=week_start,
        ).first()
        if not weekly_quest:
            weekly_quest = self._generate_weekly_quest(request.user, week_start)

        all_quests = list(todays_quests) + ([weekly_quest] if weekly_quest else [])
        return Response(QuestSerializer(all_quests, many=True).data)

    def _generate_daily_quests(self, user, today):
        """Pick 3 random daily quests and create them."""
        pool = random.sample(DAILY_QUEST_POOL, min(3, len(DAILY_QUEST_POOL)))
        tomorrow = datetime.combine(today + timedelta(days=1), datetime.min.time())
        expires_at = make_aware(tomorrow)
        quests = []
        for definition in pool:
            q = Quest.objects.create(
                user=user,
                assigned_date=today,
                expires_at=expires_at,
                quest_type='daily',
                **definition,
            )
            quests.append(q)
        return Quest.objects.filter(user=user, quest_type='daily', assigned_date=today)

    def _generate_weekly_quest(self, user, week_start):
        """Pick 1 random weekly quest."""
        definition = random.choice(WEEKLY_QUEST_POOL)
        week_end = datetime.combine(week_start + timedelta(days=7), datetime.min.time())
        expires_at = make_aware(week_end)
        return Quest.objects.create(
            user=user,
            assigned_date=week_start,
            expires_at=expires_at,
            quest_type='weekly',
            **definition,
        )


class QuestCompleteView(APIView):
    """
    POST /api/gamification/quests/{id}/complete/
        Manually mark a quest as completed (used when goal_type is manual).
        XP is awarded and achievements are checked.
    """

    def post(self, request, pk):
        try:
            quest = Quest.objects.get(pk=pk, user=request.user, status='active')
        except Quest.DoesNotExist:
            return Response({'detail': 'Quest not found or already completed.'}, status=status.HTTP_404_NOT_FOUND)

        quest.goal_current = quest.goal_target
        quest.status = 'completed'
        quest.completed_at = timezone.now()
        quest.save()

        # Award XP
        profile = request.user.profile
        leveled_up = profile.add_xp(quest.xp_reward)

        # Check achievements
        newly_unlocked = check_and_unlock_achievements(request.user)

        return Response({
            'quest': QuestSerializer(quest).data,
            'xp_earned': quest.xp_reward,
            'leveled_up': leveled_up,
            'ranked_up': False,
            'new_achievements': UserAchievementSerializer(newly_unlocked, many=True).data,
        })


# ─── Achievements ─────────────────────────────────────────────────────────────

class UserAchievementsView(generics.ListAPIView):
    """GET /api/gamification/achievements/ — List all achievements with user unlock status."""
    serializer_class = AchievementSerializer

    def list(self, request, *args, **kwargs):
        all_achievements = Achievement.objects.all()
        unlocked_ids = set(
            UserAchievement.objects.filter(user=request.user)
            .values_list('achievement_id', flat=True)
        )
        unlocked_qs = UserAchievement.objects.filter(user=request.user).select_related('achievement')

        unlocked_map = {ua.achievement_id: ua.unlocked_at for ua in unlocked_qs}

        result = []
        for ach in all_achievements:
            result.append({
                'id': ach.id,
                'key': ach.key,
                'title': ach.title,
                'description': ach.description,
                'rarity': ach.rarity,
                'icon': ach.icon,
                'xp_reward': ach.xp_reward,
                'unlocked': ach.id in unlocked_ids,
                'unlocked_at': unlocked_map.get(ach.id),
            })

        return Response(result)
