"""
Pure stat computation rules for exercises.
Standalone: does not import Django models or touch any database.
"""


def compute_stats(exercise_dict: dict) -> dict:
    """
    Computes RPG stat multipliers (STR, VIT, AGI, END, FLX, PER)
    from an exercise definition dict (Free Exercise DB shape).

    Input: plain dict with keys like 'category', 'force', 'mechanic',
           'equipment', 'primaryMuscles', etc.
    Output: dict of stat_name -> float multiplier (rounded to 2 decimals).
    """
    stats = {
        'STR': 0.0,
        'VIT': 0.0,
        'AGI': 0.0,
        'END': 0.0,
        'FLX': 0.0,
        'PER': 0.0,
    }

    category = (exercise_dict.get('category') or '').strip().lower()
    force = (exercise_dict.get('force') or '').strip().lower()
    mechanic = (exercise_dict.get('mechanic') or '').strip().lower()
    equipment = (exercise_dict.get('equipment') or '').strip().lower()
    primary = [m.strip().lower() for m in (exercise_dict.get('primaryMuscles') or [])]

    # 1. Base weights by category
    if category == 'cardio':
        # Cardio: AGI + END weighted, minimal STR
        stats['AGI'] = 1.2
        stats['END'] = 1.0
        stats['STR'] = 0.1
    elif category == 'stretching':
        # Stretching: FLX weighted, minimal else
        stats['FLX'] = 1.5
    elif category in ('strength', 'powerlifting', 'olympic weightlifting', 'strongman'):
        # Heavy strength: STR-dominant, some END
        stats['STR'] = 1.0
        stats['END'] = 0.2
        if category in ('olympic weightlifting', 'strongman'):
            stats['PER'] = 0.2
    elif category == 'plyometrics':
        # Explosive: agility + strength + endurance
        stats['AGI'] = 0.9
        stats['STR'] = 0.5
        stats['END'] = 0.4
    else:
        stats['STR'] = 0.5
        stats['END'] = 0.2

    # 2. Primary muscles mapping
    lifting_muscles = {
        'chest', 'lats', 'middle back', 'lower back', 'quadriceps',
        'hamstrings', 'glutes', 'calves', 'biceps', 'triceps', 'shoulders',
        'traps', 'forearms', 'neck', 'abductors', 'adductors',
    }
    core_muscles = {'abdominals'}

    for muscle in primary:
        if category == 'stretching':
            # Stretching maintains FLX focus regardless of targeted muscle
            pass
        elif category == 'cardio':
            if muscle in ('quadriceps', 'calves', 'hamstrings', 'glutes'):
                stats['END'] += 0.2
        else:
            if muscle in lifting_muscles:
                stats['STR'] += 0.4
            elif muscle in core_muscles:
                stats['VIT'] += 0.6
                stats['STR'] = max(0.1, stats['STR'] - 0.4)

    # 3. Force 'static' (isometric holds, planks) -> weight toward VIT
    if force == 'static':
        stats['VIT'] += 0.8
        stats['STR'] = max(0.1, stats['STR'] - 0.4)
        stats['END'] += 0.2

    # 4. Cardio & functional equipment modulation
    cardio_equipment = {
        'elliptical', 'stationary bike', 'treadmill', 'rowing machine',
        'cardio machine',
    }
    if equipment in cardio_equipment:
        stats['AGI'] += 0.3
        stats['END'] += 0.4
    elif equipment in ('exercise ball', 'medicine ball'):
        stats['VIT'] += 0.2

    # 5. Mechanic: compound vs isolation
    if mechanic == 'compound':
        # Compound lifts recruit more muscle groups -> higher overall multiplier
        for stat in stats:
            stats[stat] *= 1.2
    elif mechanic == 'isolation':
        # Isolation concentrates on primary stat, dampening secondary stats
        max_stat_val = max(stats.values()) if stats else 0
        for stat in stats:
            if stats[stat] >= max_stat_val - 0.01:
                stats[stat] *= 1.0
            else:
                stats[stat] *= 0.5

    return {stat: round(val, 2) for stat, val in stats.items()}
