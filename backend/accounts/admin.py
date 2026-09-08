from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'level', 'xp', 'rank', 'current_streak']
    list_filter = ['rank', 'fitness_goal', 'experience_level']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at']
