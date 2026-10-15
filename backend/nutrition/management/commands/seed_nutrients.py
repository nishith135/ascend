from django.core.management.base import BaseCommand, CommandError

from nutrition.models import FoodItem, Nutrient

# (key, label, plain_label, unit, tier, kind, usda_nutrient_id, display_order, description)
NUTRIENTS = [
    # --- Macros ---
    ("calories_kcal", "Calories", "Energy", "kcal", "macro", "goal", 1008, 10,
     "Energy from food."),
    ("protein_g", "Protein", "Muscle building", "g", "macro", "goal", 1003, 20,
     "Helps build and repair muscle and other tissues."),
    ("carbs_g", "Carbohydrates", "Fuel", "g", "macro", "goal", 1005, 30,
     "The body's main source of quick energy."),
    ("fat_g", "Fat", "Long-lasting energy", "g", "macro", "goal", 1004, 40,
     "Provides energy and helps absorb some vitamins."),

    # --- Core ---
    ("iron_mg", "Iron", "Energy & oxygen", "mg", "core", "goal", 1089, 110,
     "Helps carry oxygen around the body. Low iron can show up as tiredness and weaker workouts, and it is a common gap in women and endurance athletes."),
    ("calcium_mg", "Calcium", "Bones & muscle contraction", "mg", "core", "goal", 1087, 120,
     "Builds and maintains bones and helps muscles contract."),
    ("magnesium_mg", "Magnesium", "Recovery & sleep", "mg", "core", "goal", 1090, 130,
     "Supports muscle relaxation, recovery and sleep. Many people fall short."),
    ("potassium_mg", "Potassium", "Hydration & blood pressure", "mg", "core", "goal", 1092, 140,
     "Helps balance fluids and supports healthy blood pressure and muscle function. Most people eat less than recommended."),
    ("zinc_mg", "Zinc", "Immunity & repair", "mg", "core", "goal", 1095, 150,
     "Supports the immune system and the repair of muscle and other tissue."),
    ("vitamin_d_ug", "Vitamin D", "Sunshine vitamin", "mcg", "core", "goal", 1114, 160,
     "Supports bones, muscles and immunity. Sunlight helps your body make it, and many people are low."),
    ("vitamin_b12_ug", "Vitamin B12", "Nerves & energy", "mcg", "core", "goal", 1178, 170,
     "Supports nerves and red blood cells. It is found mainly in animal foods, so vegetarians and vegans should pay attention."),
    ("folate_dfe_ug", "Folate", "Cell building", "mcg", "core", "goal", 1190, 180,
     "Helps build red blood cells and repair DNA."),
    ("vitamin_c_mg", "Vitamin C", "Immunity & iron absorption", "mg", "core", "goal", 1162, 190,
     "Supports immunity and skin, and helps your body absorb iron from plant foods."),
    ("vitamin_a_rae_ug", "Vitamin A", "Vision & immunity", "mcg", "core", "goal", 1106, 200,
     "Supports eyesight, skin and the immune system."),

    # --- Core (bonus): fiber and omega-3 ---
    ("fiber_g", "Fiber", "Digestion & fullness", "g", "core", "goal", 1079, 210,
     "Supports digestion and helps you feel full."),
    ("epa_g", "Omega-3 (EPA)", "Heart health", "g", "core", "goal", 1278, 220,
     "An omega-3 fat found mainly in fish. Supports heart health."),
    ("dha_g", "Omega-3 (DHA)", "Brain & heart", "g", "core", "goal", 1272, 230,
     "An omega-3 fat found mainly in fish. Supports brain and heart health."),
    ("ala_approx_g", "Plant omega-3 (approx.)", "Plant-based omega-3", "g", "core", "goal", 1270, 240,
     "A plant-based omega-3 fat from foods like flaxseed and walnuts. This value is an approximation."),

    # --- Limits ---
    ("sodium_mg", "Sodium", "Salt", "mg", "limit", "limit", 1093, 310,
     "Too much sodium raises blood pressure over time. Aim to stay under your daily limit."),
    ("sugars_g", "Sugars", "Sweet stuff", "g", "limit", "limit", 2000, 320,
     "Total sugars, including those naturally present in fruit and milk as well as added sugar."),
    ("saturated_fat_g", "Saturated fat", "Heart health", "g", "limit", "limit", 1258, 330,
     "Too much can raise LDL (bad) cholesterol. Aim to stay under your daily limit."),
    ("cholesterol_mg", "Cholesterol", "Dietary cholesterol", "mg", "limit", "limit", 1253, 340,
     "Cholesterol found in food. Current guidance focuses more on saturated fat than on dietary cholesterol."),
    ("alcohol_g", "Alcohol", "Best kept low", "g", "limit", "limit", 1018, 350,
     "Alcohol can affect recovery, sleep and hydration."),
    ("caffeine_mg", "Caffeine", "Stimulant", "mg", "limit", "limit", 1057, 360,
     "Boosts alertness but can affect sleep if you have it late in the day."),

    # --- Advanced ---
    ("vitamin_e_mg", "Vitamin E", "Cell protection", "mg", "advanced", "goal", 1109, 410,
     "An antioxidant that helps protect cells."),
    ("vitamin_k_ug", "Vitamin K", "Blood clotting & bones", "mcg", "advanced", "goal", 1185, 420,
     "Needed for normal blood clotting and bone health. This value is phylloquinone, the main dietary form. If you take blood thinners, keep your intake steady and ask your doctor."),
    ("vitamin_b6_mg", "Vitamin B6", "Energy from protein", "mg", "advanced", "goal", 1175, 430,
     "Helps your body use protein and make red blood cells."),
    ("thiamin_mg", "Thiamin (B1)", "Energy from carbs", "mg", "advanced", "goal", 1165, 440,
     "Helps turn carbohydrates into energy."),
    ("riboflavin_mg", "Riboflavin (B2)", "Energy production", "mg", "advanced", "goal", 1166, 450,
     "Helps release energy from food."),
    ("niacin_mg", "Niacin (B3)", "Energy & skin", "mg", "advanced", "goal", 1167, 460,
     "Helps release energy from food and supports skin and nerves."),
    ("pantothenic_acid_mg", "Pantothenic acid (B5)", "Energy from food", "mg", "advanced", "goal", 1170, 470,
     "Helps your body get energy from food."),
    ("choline_mg", "Choline", "Brain & liver", "mg", "advanced", "goal", 1180, 480,
     "Supports brain function and liver health. This value is total choline."),
    ("selenium_ug", "Selenium", "Thyroid & antioxidant", "mcg", "advanced", "goal", 1103, 490,
     "Supports the thyroid and acts as an antioxidant."),
    ("phosphorus_mg", "Phosphorus", "Bones & energy", "mg", "advanced", "goal", 1091, 500,
     "Works with calcium to build bones and helps cells make energy."),
    ("copper_mg", "Copper", "Iron use & connective tissue", "mg", "advanced", "goal", 1098, 510,
     "Helps your body use iron and build connective tissue."),
    ("manganese_mg", "Manganese", "Bone & metabolism", "mg", "advanced", "goal", 1101, 520,
     "Supports bone formation and metabolism."),
]


class Command(BaseCommand):
    help = "Seed or update the Nutrient reference table (safe to re-run)."

    def handle(self, *args, **options):
        # Guard: every key must be a real FoodItem column, or the app would
        # later try to read a column that doesn't exist.
        food_fields = {f.name for f in FoodItem._meta.get_fields()}
        bad_keys = [row[0] for row in NUTRIENTS if row[0] not in food_fields]
        if bad_keys:
            raise CommandError(f"Keys that are not FoodItem fields: {bad_keys}")

        created = 0
        updated = 0
        for (key, label, plain_label, unit, tier, kind,
             usda_nutrient_id, display_order, description) in NUTRIENTS:
            _, was_created = Nutrient.objects.update_or_create(
                key=key,
                defaults={
                    "label": label,
                    "plain_label": plain_label,
                    "description": description,
                    "unit": unit,
                    "tier": tier,
                    "kind": kind,
                    "usda_nutrient_id": usda_nutrient_id,
                    "display_order": display_order,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"Nutrients: {created} created, {updated} updated "
            f"({len(NUTRIENTS)} in list)"
        ))