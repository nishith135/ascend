import json
from pathlib import Path
from django.core.management.base import BaseCommand
from exercises.models import Exercise
from exercises.rules import compute_stats


# Mapping primary muscle to legacy muscle_group choice for frontend/filter compatibility
MUSCLE_TO_GROUP = {
    'chest': 'chest',
    'lats': 'back',
    'middle back': 'back',
    'lower back': 'back',
    'traps': 'back',
    'neck': 'back',
    'shoulders': 'shoulders',
    'biceps': 'arms',
    'triceps': 'arms',
    'forearms': 'arms',
    'quadriceps': 'legs',
    'hamstrings': 'legs',
    'glutes': 'legs',
    'calves': 'legs',
    'abductors': 'legs',
    'adductors': 'legs',
    'abdominals': 'core',
}


def resolve_muscle_group(category: str, primary_muscles: list) -> str:
    cat = (category or '').strip().lower()
    if cat == 'cardio':
        return 'cardio'
    if cat == 'stretching':
        return 'flexibility'
    if primary_muscles:
        first = primary_muscles[0].strip().lower()
        if first in MUSCLE_TO_GROUP:
            return MUSCLE_TO_GROUP[first]
    return 'full_body'


class Command(BaseCommand):
    help = 'Seeds or updates the Exercise library from backend/exercises/exercises.json'

    def handle(self, *args, **options):
        # Locate exercises.json relative to the backend app root
        json_path = Path(__file__).resolve().parents[2] / 'exercises.json'
        if not json_path.exists():
            self.stderr.write(self.style.ERROR(f"File not found: {json_path}"))
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            exercises_data = json.load(f)

        created_count = 0
        updated_count = 0

        self.stdout.write(f"Processing {len(exercises_data)} exercises from {json_path.name}...")

        for entry in exercises_data:
            name = (entry.get('name') or '').strip()
            if not name:
                continue

            # NOTE: We explicitly ignore entry.get('images') — exercise images are not used.

            category = entry.get('category') or ''
            force = entry.get('force')
            mechanic = entry.get('mechanic')
            level = entry.get('level')
            equipment = entry.get('equipment') or 'none'
            primary_muscles = entry.get('primaryMuscles') or []
            secondary_muscles = entry.get('secondaryMuscles') or []
            instructions = entry.get('instructions') or []

            description = ' '.join(instructions) if isinstance(instructions, list) else str(instructions or '')

            # Compute RPG stat multipliers using pure rule engine
            stats = compute_stats(entry)

            # Determine dominant default stat for backwards compatibility
            dominant_stat = max(stats, key=stats.get) if any(v > 0 for v in stats.values()) else 'STR'
            muscle_group = resolve_muscle_group(category, primary_muscles)

            defaults = {
                'force': force,
                'mechanic': mechanic,
                'category': category,
                'level': level,
                'equipment': equipment,
                'muscle_group': muscle_group,
                'primary_muscles': primary_muscles,
                'secondary_muscles': secondary_muscles,
                'instructions': instructions,
                'description': description,
                'stat_str': stats.get('STR', 0.0),
                'stat_vit': stats.get('VIT', 0.0),
                'stat_agi': stats.get('AGI', 0.0),
                'stat_end': stats.get('END', 0.0),
                'stat_flx': stats.get('FLX', 0.0),
                'stat_per': stats.get('PER', 0.0),
                'default_stat': dominant_stat,
            }

            _, created = Exercise.objects.update_or_create(
                name=name,
                defaults=defaults,
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeding completed successfully: {created_count} created, "
                f"{updated_count} updated (Total: {created_count + updated_count})."
            )
        )
