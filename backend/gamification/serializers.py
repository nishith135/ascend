from rest_framework import serializers
from .models import Quest, Achievement, UserAchievement


class QuestSerializer(serializers.ModelSerializer):
    progress_pct = serializers.IntegerField(read_only=True)
    is_complete = serializers.BooleanField(read_only=True)

    class Meta:
        model = Quest
        fields = [
            'id', 'title', 'description', 'quest_type', 'status',
            'xp_reward', 'goal_type', 'goal_target', 'goal_current',
            'progress_pct', 'is_complete',
            'assigned_date', 'expires_at', 'completed_at',
        ]
        read_only_fields = ['id', 'assigned_date', 'expires_at', 'completed_at']


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'key', 'title', 'description', 'rarity', 'icon', 'xp_reward']


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = ['id', 'achievement', 'unlocked_at']
