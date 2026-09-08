from django.contrib import admin
from .models import Quest, Achievement, UserAchievement


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['key', 'title', 'rarity', 'xp_reward']
    list_filter = ['rarity']
    search_fields = ['key', 'title']
    ordering = ['rarity', 'title']


@admin.register(Quest)
class QuestAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'quest_type', 'status', 'assigned_date', 'xp_reward']
    list_filter = ['quest_type', 'status']
    search_fields = ['title', 'user__username']
    ordering = ['-assigned_date']


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ['user', 'achievement', 'unlocked_at']
    list_filter = ['achievement__rarity']
    search_fields = ['user__username', 'achievement__title']
    ordering = ['-unlocked_at']
