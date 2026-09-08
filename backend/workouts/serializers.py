from rest_framework import serializers
from django.utils import timezone
from django.db.models import Sum, F
from collections import Counter

from .models import WorkoutTemplate, TemplateExercise, WorkoutSession, SetLog
from exercises.serializers import ExerciseSerializer


# ─── Template serializers ───────────────────────────────────────────────────

class TemplateExerciseSerializer(serializers.ModelSerializer):
    """Nested serializer for exercises within a template."""
    exercise_detail = ExerciseSerializer(source='exercise', read_only=True)

    class Meta:
        model = TemplateExercise
        fields = ['id', 'exercise', 'exercise_detail', 'target_sets', 'target_reps', 'order']


class WorkoutTemplateListSerializer(serializers.ModelSerializer):
    """Compact template serializer for list views."""
    exercise_count = serializers.IntegerField(source='template_exercises.count', read_only=True)

    class Meta:
        model = WorkoutTemplate
        fields = ['id', 'name', 'exercise_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class WorkoutTemplateDetailSerializer(serializers.ModelSerializer):
    """Full template serializer with nested exercises for detail/create/update."""
    template_exercises = TemplateExerciseSerializer(many=True)

    class Meta:
        model = WorkoutTemplate
        fields = ['id', 'name', 'template_exercises', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        exercises_data = validated_data.pop('template_exercises')
        template = WorkoutTemplate.objects.create(**validated_data)
        for idx, ex_data in enumerate(exercises_data):
            TemplateExercise.objects.create(
                template=template,
                order=ex_data.get('order', idx),
                **{k: v for k, v in ex_data.items() if k != 'order'}
            )
        return template

    def update(self, instance, validated_data):
        exercises_data = validated_data.pop('template_exercises', None)
        instance.name = validated_data.get('name', instance.name)
        instance.save()

        if exercises_data is not None:
            # Replace all exercises (simpler than diffing for MVP)
            instance.template_exercises.all().delete()
            for idx, ex_data in enumerate(exercises_data):
                TemplateExercise.objects.create(
                    template=instance,
                    order=ex_data.get('order', idx),
                    **{k: v for k, v in ex_data.items() if k != 'order'}
                )
        return instance


# ─── Set Log serializers ────────────────────────────────────────────────────

class SetLogSerializer(serializers.ModelSerializer):
    """Serializer for individual set logs."""
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    exercise_stat = serializers.CharField(source='exercise.default_stat', read_only=True)

    class Meta:
        model = SetLog
        fields = [
            'id', 'exercise', 'exercise_name', 'exercise_stat',
            'set_number', 'reps', 'weight_kg', 'duration_seconds', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SetLogCreateSerializer(serializers.ModelSerializer):
    """Write serializer for creating a set log within a session."""

    class Meta:
        model = SetLog
        fields = ['exercise', 'set_number', 'reps', 'weight_kg', 'duration_seconds']


# ─── Session serializers ────────────────────────────────────────────────────

class WorkoutSessionListSerializer(serializers.ModelSerializer):
    """Compact session serializer for list views."""
    set_count = serializers.IntegerField(source='sets.count', read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True, default=None)

    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'name', 'template', 'template_name',
            'started_at', 'finished_at', 'is_active',
            'set_count', 'duration_minutes', 'xp_earned', 'notes',
        ]


class WorkoutSessionDetailSerializer(serializers.ModelSerializer):
    """Full session serializer with nested set logs."""
    sets = SetLogSerializer(many=True, read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True, default=None)

    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'name', 'template', 'template_name',
            'started_at', 'finished_at', 'is_active',
            'sets', 'duration_minutes', 'xp_earned', 'notes',
        ]


class WorkoutSessionCreateSerializer(serializers.ModelSerializer):
    """Write serializer for starting a new session."""

    class Meta:
        model = WorkoutSession
        fields = ['name', 'template', 'notes']

    def validate_template(self, value):
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only use your own templates.")
        return value


class WorkoutSessionFinishSerializer(serializers.Serializer):
    """Serializer for finishing a session (calculates XP, updates stats, checks achievements)."""
    notes = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        if instance.finished_at is not None:
            raise serializers.ValidationError("This session is already finished.")

        instance.finished_at = timezone.now()
        instance.notes = validated_data.get('notes', instance.notes)

        # ── Calculate XP ──
        sets = instance.sets.all()
        num_sets = sets.count()

        # Base XP: 50 per session + 10 per set
        xp = 50 + (num_sets * 10)

        # Volume bonus: +1 XP per 100 kg total volume
        total_volume = sum(s.volume for s in sets)
        xp += int(total_volume / 100)

        # Duration bonus: +1 XP per minute for timed exercises
        total_duration = sets.aggregate(
            total=Sum('duration_seconds')
        )['total'] or 0
        xp += int(total_duration / 60)

        instance.xp_earned = xp
        instance.save()

        # ── Update user stats ──
        profile = instance.user.profile

        # Distribute stat points: +1 per set, grouped by exercise's default_stat
        stat_counts = Counter()
        for s in sets:
            stat_counts[s.exercise.default_stat] += 1

        for stat_name, count in stat_counts.items():
            profile.add_stat(stat_name, count)

        # Update streak
        from datetime import date, timedelta
        today = date.today()
        if profile.last_workout_date is None:
            profile.current_streak = 1
        elif profile.last_workout_date == today:
            pass  # Already worked out today, streak unchanged
        elif profile.last_workout_date == today - timedelta(days=1):
            profile.current_streak += 1
        else:
            profile.current_streak = 1  # Streak broken, restart

        profile.last_workout_date = today

        # +1 PER (Perception/Discipline) for every workout completed
        profile.add_stat('PER', 1)

        # Snapshot rank before XP award
        old_rank = profile.rank

        # Add XP and check for level-up
        leveled_up = profile.add_xp(xp)

        # Did rank change?
        ranked_up = profile.rank != old_rank
        new_rank = profile.rank if ranked_up else None

        # ── Check achievements ──
        from gamification.achievement_checker import check_and_unlock_achievements
        newly_unlocked = check_and_unlock_achievements(instance.user)

        # Update quest progress
        self._update_quest_progress(instance.user, num_sets)

        # Attach flags to the instance for the view to read
        instance._leveled_up = leveled_up
        instance._ranked_up = ranked_up
        instance._new_rank = new_rank
        instance._new_achievements = newly_unlocked
        instance._new_level = profile.level

        return instance

    def _update_quest_progress(self, user, sets_logged):
        """Increment quest progress for active quests related to this session."""
        from django.utils import timezone as tz
        from gamification.models import Quest

        active_quests = Quest.objects.filter(
            user=user, status='active', expires_at__gt=tz.now()
        )
        for quest in active_quests:
            if quest.goal_type == 'complete_workouts':
                quest.goal_current = min(quest.goal_current + 1, quest.goal_target)
            elif quest.goal_type == 'log_sets':
                quest.goal_current = min(quest.goal_current + sets_logged, quest.goal_target)

            if quest.is_complete:
                quest.status = 'completed'
                quest.completed_at = tz.now()
                # Award quest XP
                user.profile.add_xp(quest.xp_reward)

            quest.save()
