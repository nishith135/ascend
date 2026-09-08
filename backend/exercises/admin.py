from django.contrib import admin
from .models import Exercise


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ['name', 'muscle_group', 'equipment', 'default_stat']
    list_filter = ['muscle_group', 'equipment', 'default_stat']
    search_fields = ['name']
