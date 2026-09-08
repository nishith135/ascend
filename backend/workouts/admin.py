from django.contrib import admin
from .models import WorkoutTemplate, TemplateExercise, WorkoutSession, SetLog


class TemplateExerciseInline(admin.TabularInline):
    model = TemplateExercise
    extra = 1


@admin.register(WorkoutTemplate)
class WorkoutTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'created_at']
    list_filter = ['user']
    inlines = [TemplateExerciseInline]


class SetLogInline(admin.TabularInline):
    model = SetLog
    extra = 0
    readonly_fields = ['created_at']


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'started_at', 'finished_at', 'xp_earned']
    list_filter = ['user', 'finished_at']
    inlines = [SetLogInline]


@admin.register(SetLog)
class SetLogAdmin(admin.ModelAdmin):
    list_display = ['session', 'exercise', 'set_number', 'reps', 'weight_kg', 'duration_seconds']
    list_filter = ['exercise']
