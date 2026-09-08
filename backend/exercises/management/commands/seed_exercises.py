"""
Management command to seed the exercise library with ~80 common exercises.
Run with: python manage.py seed_exercises
"""

from django.core.management.base import BaseCommand
from exercises.models import Exercise


EXERCISES = [
    # ── CHEST (STR) ──
    {"name": "Barbell Bench Press", "muscle_group": "chest", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Incline Barbell Bench Press", "muscle_group": "chest", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Decline Barbell Bench Press", "muscle_group": "chest", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Dumbbell Bench Press", "muscle_group": "chest", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Incline Dumbbell Press", "muscle_group": "chest", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Dumbbell Fly", "muscle_group": "chest", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Cable Crossover", "muscle_group": "chest", "equipment": "cable", "default_stat": "STR"},
    {"name": "Push-Up", "muscle_group": "chest", "equipment": "bodyweight", "default_stat": "STR"},
    {"name": "Chest Dip", "muscle_group": "chest", "equipment": "bodyweight", "default_stat": "STR"},
    {"name": "Machine Chest Press", "muscle_group": "chest", "equipment": "machine", "default_stat": "STR"},

    # ── BACK (STR) ──
    {"name": "Barbell Deadlift", "muscle_group": "back", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Barbell Row", "muscle_group": "back", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Pull-Up", "muscle_group": "back", "equipment": "bodyweight", "default_stat": "STR"},
    {"name": "Chin-Up", "muscle_group": "back", "equipment": "bodyweight", "default_stat": "STR"},
    {"name": "Lat Pulldown", "muscle_group": "back", "equipment": "cable", "default_stat": "STR"},
    {"name": "Seated Cable Row", "muscle_group": "back", "equipment": "cable", "default_stat": "STR"},
    {"name": "Dumbbell Row", "muscle_group": "back", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "T-Bar Row", "muscle_group": "back", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Face Pull", "muscle_group": "back", "equipment": "cable", "default_stat": "STR"},

    # ── SHOULDERS (STR) ──
    {"name": "Overhead Press", "muscle_group": "shoulders", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Dumbbell Shoulder Press", "muscle_group": "shoulders", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Arnold Press", "muscle_group": "shoulders", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Lateral Raise", "muscle_group": "shoulders", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Front Raise", "muscle_group": "shoulders", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Rear Delt Fly", "muscle_group": "shoulders", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Upright Row", "muscle_group": "shoulders", "equipment": "barbell", "default_stat": "STR"},

    # ── LEGS (STR) ──
    {"name": "Barbell Squat", "muscle_group": "legs", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Front Squat", "muscle_group": "legs", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Leg Press", "muscle_group": "legs", "equipment": "machine", "default_stat": "STR"},
    {"name": "Romanian Deadlift", "muscle_group": "legs", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Bulgarian Split Squat", "muscle_group": "legs", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Leg Extension", "muscle_group": "legs", "equipment": "machine", "default_stat": "STR"},
    {"name": "Leg Curl", "muscle_group": "legs", "equipment": "machine", "default_stat": "STR"},
    {"name": "Calf Raise", "muscle_group": "legs", "equipment": "machine", "default_stat": "STR"},
    {"name": "Goblet Squat", "muscle_group": "legs", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Hip Thrust", "muscle_group": "legs", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Walking Lunge", "muscle_group": "legs", "equipment": "dumbbell", "default_stat": "STR"},

    # ── ARMS (STR) ──
    {"name": "Barbell Curl", "muscle_group": "arms", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Dumbbell Curl", "muscle_group": "arms", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Hammer Curl", "muscle_group": "arms", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Preacher Curl", "muscle_group": "arms", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Cable Curl", "muscle_group": "arms", "equipment": "cable", "default_stat": "STR"},
    {"name": "Tricep Pushdown", "muscle_group": "arms", "equipment": "cable", "default_stat": "STR"},
    {"name": "Skull Crusher", "muscle_group": "arms", "equipment": "barbell", "default_stat": "STR"},
    {"name": "Overhead Tricep Extension", "muscle_group": "arms", "equipment": "dumbbell", "default_stat": "STR"},
    {"name": "Tricep Dip", "muscle_group": "arms", "equipment": "bodyweight", "default_stat": "STR"},
    {"name": "Concentration Curl", "muscle_group": "arms", "equipment": "dumbbell", "default_stat": "STR"},

    # ── CORE (END) ──
    {"name": "Plank", "muscle_group": "core", "equipment": "bodyweight", "default_stat": "END"},
    {"name": "Crunch", "muscle_group": "core", "equipment": "bodyweight", "default_stat": "END"},
    {"name": "Hanging Leg Raise", "muscle_group": "core", "equipment": "bodyweight", "default_stat": "END"},
    {"name": "Russian Twist", "muscle_group": "core", "equipment": "bodyweight", "default_stat": "END"},
    {"name": "Ab Rollout", "muscle_group": "core", "equipment": "bodyweight", "default_stat": "END"},
    {"name": "Cable Woodchop", "muscle_group": "core", "equipment": "cable", "default_stat": "END"},
    {"name": "Mountain Climber", "muscle_group": "core", "equipment": "bodyweight", "default_stat": "END"},
    {"name": "Dead Bug", "muscle_group": "core", "equipment": "bodyweight", "default_stat": "END"},

    # ── FULL BODY (VIT) ──
    {"name": "Burpee", "muscle_group": "full_body", "equipment": "bodyweight", "default_stat": "VIT"},
    {"name": "Clean and Press", "muscle_group": "full_body", "equipment": "barbell", "default_stat": "VIT"},
    {"name": "Kettlebell Swing", "muscle_group": "full_body", "equipment": "kettlebell", "default_stat": "VIT"},
    {"name": "Thruster", "muscle_group": "full_body", "equipment": "barbell", "default_stat": "VIT"},
    {"name": "Man Maker", "muscle_group": "full_body", "equipment": "dumbbell", "default_stat": "VIT"},
    {"name": "Turkish Get-Up", "muscle_group": "full_body", "equipment": "kettlebell", "default_stat": "VIT"},
    {"name": "Battle Ropes", "muscle_group": "full_body", "equipment": "none", "default_stat": "VIT"},

    # ── CARDIO (AGI) ──
    {"name": "Treadmill Running", "muscle_group": "cardio", "equipment": "cardio_machine", "default_stat": "AGI"},
    {"name": "Outdoor Running", "muscle_group": "cardio", "equipment": "none", "default_stat": "AGI"},
    {"name": "Cycling", "muscle_group": "cardio", "equipment": "cardio_machine", "default_stat": "AGI"},
    {"name": "Rowing Machine", "muscle_group": "cardio", "equipment": "cardio_machine", "default_stat": "END"},
    {"name": "Elliptical", "muscle_group": "cardio", "equipment": "cardio_machine", "default_stat": "AGI"},
    {"name": "Jump Rope", "muscle_group": "cardio", "equipment": "none", "default_stat": "AGI"},
    {"name": "Stair Climber", "muscle_group": "cardio", "equipment": "cardio_machine", "default_stat": "END"},
    {"name": "Swimming", "muscle_group": "cardio", "equipment": "none", "default_stat": "END"},
    {"name": "Sprints", "muscle_group": "cardio", "equipment": "none", "default_stat": "AGI"},
    {"name": "Box Jump", "muscle_group": "cardio", "equipment": "bodyweight", "default_stat": "AGI"},

    # ── FLEXIBILITY (FLX) ──
    {"name": "Standing Hamstring Stretch", "muscle_group": "flexibility", "equipment": "none", "default_stat": "FLX"},
    {"name": "Pigeon Pose", "muscle_group": "flexibility", "equipment": "none", "default_stat": "FLX"},
    {"name": "Cat-Cow Stretch", "muscle_group": "flexibility", "equipment": "none", "default_stat": "FLX"},
    {"name": "Downward Dog", "muscle_group": "flexibility", "equipment": "none", "default_stat": "FLX"},
    {"name": "Foam Rolling", "muscle_group": "flexibility", "equipment": "none", "default_stat": "FLX"},
    {"name": "Hip Flexor Stretch", "muscle_group": "flexibility", "equipment": "none", "default_stat": "FLX"},
    {"name": "Shoulder Stretch", "muscle_group": "flexibility", "equipment": "none", "default_stat": "FLX"},
    {"name": "Yoga Flow", "muscle_group": "flexibility", "equipment": "none", "default_stat": "FLX"},
    {"name": "Child's Pose", "muscle_group": "flexibility", "equipment": "none", "default_stat": "FLX"},
]


class Command(BaseCommand):
    help = 'Seeds the database with ~80 common exercises.'

    def handle(self, *args, **options):
        created_count = 0
        skipped_count = 0

        for ex_data in EXERCISES:
            _, created = Exercise.objects.get_or_create(
                name=ex_data['name'],
                defaults={
                    'muscle_group': ex_data['muscle_group'],
                    'equipment': ex_data['equipment'],
                    'default_stat': ex_data['default_stat'],
                }
            )
            if created:
                created_count += 1
            else:
                skipped_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seeded {created_count} exercises ({skipped_count} already existed). '
            f'Total: {Exercise.objects.count()}'
        ))
