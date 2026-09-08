from django.db import models
from django.contrib.auth.models import User
from exercises.models import Exercise


class WorkoutTemplate(models.Model):
    """
    A reusable workout template ("Dungeon Run") that defines
    a named set of exercises with target sets/reps.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='templates')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'name']

    def __str__(self):
        return f"{self.name} — {self.user.username}"


class TemplateExercise(models.Model):
    """
    Through model linking a WorkoutTemplate to Exercises
    with target sets, reps, and ordering.
    """
    template = models.ForeignKey(
        WorkoutTemplate, on_delete=models.CASCADE, related_name='template_exercises'
    )
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    target_sets = models.PositiveIntegerField(default=3)
    target_reps = models.PositiveIntegerField(null=True, blank=True)  # null for timed exercises
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = ['template', 'exercise']

    def __str__(self):
        return f"{self.template.name} — {self.exercise.name} ({self.target_sets}×{self.target_reps})"


class WorkoutSession(models.Model):
    """
    A single workout session. Can be linked to a template or be a free session.
    XP is calculated and stored when the session is marked as finished.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    template = models.ForeignKey(
        WorkoutTemplate, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sessions'
    )
    name = models.CharField(max_length=100, default='Workout')
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    xp_earned = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        status = 'Active' if self.finished_at is None else 'Completed'
        return f"{self.name} — {self.user.username} ({status})"

    @property
    def is_active(self):
        return self.finished_at is None

    @property
    def duration_minutes(self):
        if self.finished_at and self.started_at:
            delta = self.finished_at - self.started_at
            return int(delta.total_seconds() / 60)
        return None


class SetLog(models.Model):
    """
    A single logged set within a workout session.
    Tracks reps/weight for strength exercises and duration for timed exercises.
    """
    session = models.ForeignKey(
        WorkoutSession, on_delete=models.CASCADE, related_name='sets'
    )
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    set_number = models.PositiveIntegerField()
    reps = models.PositiveIntegerField(null=True, blank=True)
    weight_kg = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True
    )
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)  # For cardio/timed
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['exercise', 'set_number']

    def __str__(self):
        if self.reps and self.weight_kg:
            return f"Set {self.set_number}: {self.exercise.name} — {self.reps}×{self.weight_kg}kg"
        elif self.duration_seconds:
            return f"Set {self.set_number}: {self.exercise.name} — {self.duration_seconds}s"
        return f"Set {self.set_number}: {self.exercise.name}"

    @property
    def volume(self):
        """Total volume (weight × reps) for this set. Returns 0 for bodyweight/timed."""
        if self.reps and self.weight_kg:
            return float(self.weight_kg) * self.reps
        return 0
