from django.db import models
from django.db.models import F, Q
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
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

    QUALITY_CHOICES = [
        ("reference", "Reference dataset (e.g. USDA)"),
        ("label", "From a package label"),
        ("computed", "Computed from ingredients"),
        ("approximate", "Approximate / generic"),
        ("user", "Entered by a user"),
    ]

    brand = models.CharField(max_length=200, blank=True, default="")
    barcode = models.CharField(max_length=32, blank=True, default="", db_index=True)
    data_quality = models.CharField(max_length=12, choices=QUALITY_CHOICES, default="reference")
    # NULL = a shared food visible to everyone; set = a custom food private to that user
    owner = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE,
                              related_name="custom_foods")

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
            # a food is either shared (no owner) or a user's own (source "user" plus an owner)
            models.CheckConstraint(
                check=Q(source="user", owner__isnull=False)
                | (~Q(source="user") & Q(owner__isnull=True)),
                name="fooditem_user_foods_have_owner",
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


class FoodPortion(models.Model):
    """A household measure for a food, e.g. '1 medium banana' = 118 g."""
    food = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name="portions")
    description = models.CharField(max_length=200)   # "1 medium", "1 cup, sliced", "1 serving"
    gram_weight = models.FloatField()
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        constraints = [
            models.UniqueConstraint(fields=["food", "description"],
                                    name="uniq_foodportion_food_description"),
            models.CheckConstraint(check=Q(gram_weight__gt=0),
                                   name="foodportion_grams_positive"),
        ]

    def __str__(self):
        return f"{self.food.name}: {self.description} = {self.gram_weight} g"


class FoodLogEntry(models.Model):
    MEAL_CHOICES = [
        ("breakfast", "Breakfast"),
        ("lunch", "Lunch"),
        ("dinner", "Dinner"),
        ("snack", "Snack"),
    ]
    AMOUNT_METHOD_CHOICES = [
        ("weighed", "Weighed / exact grams"),
        ("portion", "Household portion"),
        ("estimated", "Estimated by eye"),
    ]

    log = models.ForeignKey(NutritionLog, on_delete=models.CASCADE, related_name="entries")
    food = models.ForeignKey(FoodItem, on_delete=models.PROTECT, related_name="log_entries")
    meal = models.CharField(max_length=10, choices=MEAL_CHOICES, blank=True, default="")
    portion = models.ForeignKey(FoodPortion, null=True, blank=True,
                                on_delete=models.SET_NULL, related_name="log_entries")
    quantity = models.FloatField(null=True, blank=True)   # how many of the portion, e.g. 2 bananas
    grams = models.FloatField()                            # always filled; the amount the math uses
    amount_method = models.CharField(max_length=10, choices=AMOUNT_METHOD_CHOICES, default="weighed")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.CheckConstraint(check=Q(grams__gt=0), name="foodlogentry_grams_positive"),
            models.CheckConstraint(
                check=Q(portion__isnull=True) | Q(quantity__isnull=False),
                name="foodlogentry_portion_needs_quantity",
            ),
        ]

    def __str__(self):
        return f"{self.log.user.username} {self.log.date}: {self.grams} g {self.food.name}"


class FoodSearchMiss(models.Model):
    """Searches that found nothing, aggregated and not tied to any user."""
    query = models.CharField(max_length=200)   # normalized: lowercased, trimmed
    times_searched = models.PositiveIntegerField(default=1)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-times_searched"]
        constraints = [
            models.UniqueConstraint(fields=["query"], name="uniq_foodsearchmiss_query"),
        ]

    def __str__(self):
        return f"{self.query} ({self.times_searched})"


class NutrientTarget(models.Model):
    SEX_CHOICES = [("any", "Any"), ("female", "Female"), ("male", "Male")]

    nutrient = models.ForeignKey(Nutrient, on_delete=models.CASCADE, related_name="targets")
    sex = models.CharField(max_length=6, choices=SEX_CHOICES, default="any")
    age_min = models.PositiveSmallIntegerField(default=18)
    age_max = models.PositiveSmallIntegerField(default=120)
    amount = models.FloatField()   # in the nutrient's own unit: a goal, or a cap for "limit" nutrients
    source = models.CharField(max_length=300)   # citation: which table and year this came from
    note = models.CharField(max_length=300, blank=True, default="")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["nutrient", "sex", "age_min", "age_max"],
                                    name="uniq_nutrienttarget_group"),
            models.CheckConstraint(check=Q(amount__gt=0), name="nutrienttarget_amount_positive"),
            models.CheckConstraint(check=Q(age_min__lte=F("age_max")),
                                   name="nutrienttarget_age_range_valid"),
        ]

    def __str__(self):
        return f"{self.nutrient.label}: {self.amount} {self.nutrient.unit} ({self.sex}, {self.age_min}-{self.age_max})"