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

class FoodItem(models.Model):
    # Identity: which dataset a row came from, plus that dataset's own id for it.
    # (source, source_id) is unique, so any new dataset can be loaded with an upsert.
    source = models.CharField(max_length=50)      # "usda_sr_legacy", "recipe", "curated", ...
    source_id = models.CharField(max_length=50)   # e.g. "173944" for a USDA fdc_id
    name = models.CharField(max_length=500)

    # All nutrient values are per 100g. NULL means "no recorded value", never 0.

    # Macros
    calories_kcal = models.FloatField(null=True, blank=True)
    protein_g = models.FloatField(null=True, blank=True)
    fat_g = models.FloatField(null=True, blank=True)
    carbs_g = models.FloatField(null=True, blank=True)

    # Core micronutrients
    iron_mg = models.FloatField(null=True, blank=True)
    calcium_mg = models.FloatField(null=True, blank=True)
    magnesium_mg = models.FloatField(null=True, blank=True)
    potassium_mg = models.FloatField(null=True, blank=True)
    zinc_mg = models.FloatField(null=True, blank=True)
    vitamin_d_ug = models.FloatField(null=True, blank=True)
    vitamin_b12_ug = models.FloatField(null=True, blank=True)
    folate_dfe_ug = models.FloatField(null=True, blank=True)
    vitamin_c_mg = models.FloatField(null=True, blank=True)
    vitamin_a_rae_ug = models.FloatField(null=True, blank=True)

    # Fiber and omega-3
    fiber_g = models.FloatField(null=True, blank=True)
    epa_g = models.FloatField(null=True, blank=True)
    dha_g = models.FloatField(null=True, blank=True)
    ala_approx_g = models.FloatField(null=True, blank=True)  # from undifferentiated PUFA 18:3 (id 1270)

    # Limit nutrients
    sodium_mg = models.FloatField(null=True, blank=True)
    sugars_g = models.FloatField(null=True, blank=True)
    saturated_fat_g = models.FloatField(null=True, blank=True)
    cholesterol_mg = models.FloatField(null=True, blank=True)
    alcohol_g = models.FloatField(null=True, blank=True)
    caffeine_mg = models.FloatField(null=True, blank=True)

    # Advanced
    vitamin_e_mg = models.FloatField(null=True, blank=True)
    vitamin_k_ug = models.FloatField(null=True, blank=True)   # phylloquinone
    vitamin_b6_mg = models.FloatField(null=True, blank=True)
    thiamin_mg = models.FloatField(null=True, blank=True)
    riboflavin_mg = models.FloatField(null=True, blank=True)
    niacin_mg = models.FloatField(null=True, blank=True)
    pantothenic_acid_mg = models.FloatField(null=True, blank=True)
    choline_mg = models.FloatField(null=True, blank=True)     # total
    selenium_ug = models.FloatField(null=True, blank=True)
    phosphorus_mg = models.FloatField(null=True, blank=True)
    copper_mg = models.FloatField(null=True, blank=True)
    manganese_mg = models.FloatField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["source", "source_id"],
                name="uniq_fooditem_source_source_id",
            ),
        ]

    def __str__(self):
        return self.name

class Nutrient(models.Model):
    TIER_CHOICES = [
        ("macro", "Macro"),
        ("core", "Core"),
        ("limit", "Limit"),
        ("advanced", "Advanced"),
    ]
    KIND_CHOICES = [
        ("goal", "Aim to reach"),
        ("limit", "Stay under"),
    ]

    key = models.CharField(max_length=50, unique=True)   # matches the FoodItem column, e.g. "iron_mg"
    label = models.CharField(max_length=100)             # "Iron"
    plain_label = models.CharField(max_length=100)       # "Energy & oxygen"
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=10)               # "mg", "µg", "g", "kcal"
    tier = models.CharField(max_length=10, choices=TIER_CHOICES)
    kind = models.CharField(max_length=10, choices=KIND_CHOICES)
    usda_nutrient_id = models.IntegerField(null=True, blank=True)  # traceability back to USDA
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return self.label