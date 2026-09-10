from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class NutritionLog(models.Model):
    """
    Tracks daily calories, macronutrients, and water (Mana) intake for a hunter.
    One record per user per day.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nutrition_logs')
    date = models.DateField(default=timezone.now)

    # Core intake metrics
    calories = models.PositiveIntegerField(default=0)
    protein_g = models.PositiveIntegerField(default=0)
    carbs_g = models.PositiveIntegerField(default=0)
    fat_g = models.PositiveIntegerField(default=0)
    water_ml = models.PositiveIntegerField(default=0)  # Mana reservoir

    # Daily targets
    calorie_target = models.PositiveIntegerField(default=2200)
    protein_target_g = models.PositiveIntegerField(default=160)
    carbs_target_g = models.PositiveIntegerField(default=220)
    fat_target_g = models.PositiveIntegerField(default=70)
    water_target_ml = models.PositiveIntegerField(default=3000)

    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['user', 'date']

    def __str__(self):
        return f"{self.user.username} - {self.date}: {self.calories} kcal, {self.water_ml}ml water"

    @property
    def water_percent(self):
        if not self.water_target_ml:
            return 0
        return min(int((self.water_ml / self.water_target_ml) * 100), 100)

    @property
    def calorie_percent(self):
        if not self.calorie_target:
            return 0
        return min(int((self.calories / self.calorie_target) * 100), 100)
