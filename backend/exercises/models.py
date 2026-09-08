from django.db import models


class Exercise(models.Model):
    """
    Reference exercise in the library. Admin-seeded, read-only for users.
    Each exercise maps to a primary RPG stat.
    """

    MUSCLE_GROUP_CHOICES = [
        ('chest', 'Chest'),
        ('back', 'Back'),
        ('shoulders', 'Shoulders'),
        ('legs', 'Legs'),
        ('arms', 'Arms'),
        ('core', 'Core'),
        ('full_body', 'Full Body'),
        ('cardio', 'Cardio'),
        ('flexibility', 'Flexibility'),
    ]

    EQUIPMENT_CHOICES = [
        ('barbell', 'Barbell'),
        ('dumbbell', 'Dumbbell'),
        ('machine', 'Machine'),
        ('cable', 'Cable'),
        ('bodyweight', 'Bodyweight'),
        ('band', 'Resistance Band'),
        ('cardio_machine', 'Cardio Machine'),
        ('kettlebell', 'Kettlebell'),
        ('none', 'None'),
    ]

    STAT_CHOICES = [
        ('STR', 'Strength'),
        ('VIT', 'Vitality'),
        ('AGI', 'Agility'),
        ('END', 'Endurance'),
        ('FLX', 'Flexibility'),
        ('PER', 'Perception'),
    ]

    name = models.CharField(max_length=100, unique=True)
    muscle_group = models.CharField(max_length=20, choices=MUSCLE_GROUP_CHOICES)
    equipment = models.CharField(max_length=20, choices=EQUIPMENT_CHOICES)
    default_stat = models.CharField(max_length=3, choices=STAT_CHOICES)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.muscle_group} / {self.equipment})"
