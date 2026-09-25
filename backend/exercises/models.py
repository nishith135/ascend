from django.db import models


class Exercise(models.Model):
    """
    Reference exercise in the library. Admin-seeded, read-only for users.
    Each exercise maps to RPG stat multipliers.
    """

    STAT_CHOICES = [
        ('STR', 'Strength'),
        ('VIT', 'Vitality'),
        ('AGI', 'Agility'),
        ('END', 'Endurance'),
        ('FLX', 'Flexibility'),
        ('PER', 'Perception'),
    ]

    name = models.CharField(max_length=120, unique=True)

    # Classification from Free Exercise DB
    category = models.CharField(max_length=40, blank=True, null=True)
    force = models.CharField(max_length=20, blank=True, null=True)
    mechanic = models.CharField(max_length=20, blank=True, null=True)
    level = models.CharField(max_length=20, blank=True, null=True)
    equipment = models.CharField(max_length=50, blank=True, null=True)

    # Muscle engagement
    muscle_group = models.CharField(max_length=30, blank=True, null=True)
    primary_muscles = models.JSONField(default=list, blank=True)
    secondary_muscles = models.JSONField(default=list, blank=True)

    # Instructions & descriptions
    instructions = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True, default='')

    # RPG Stat Multipliers (Float multipliers: 0.0 default, populated 2-3 per exercise)
    stat_str = models.FloatField(default=0.0)
    stat_vit = models.FloatField(default=0.0)
    stat_agi = models.FloatField(default=0.0)
    stat_end = models.FloatField(default=0.0)
    stat_flx = models.FloatField(default=0.0)
    stat_per = models.FloatField(default=0.0)

    # Primary/dominant stat (e.g. 'STR')
    default_stat = models.CharField(max_length=3, choices=STAT_CHOICES, default='STR')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.category or self.muscle_group} / {self.equipment})"
