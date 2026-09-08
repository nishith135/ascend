from django.core.management.base import BaseCommand
from gamification.models import Achievement

ACHIEVEMENTS = [
    # ── Milestone: First steps ──
    {
        'key': 'first_blood',
        'title': 'First Blood',
        'description': 'Complete your very first workout session.',
        'rarity': 'common',
        'icon': 'fitness_center',
        'xp_reward': 50,
    },
    # ── Session milestones ──
    {
        'key': 'iron_will',
        'title': 'Iron Will',
        'description': 'Complete 10 workout sessions.',
        'rarity': 'common',
        'icon': 'bolt',
        'xp_reward': 100,
    },
    {
        'key': 'shadow_monarch_10',
        'title': 'Shadow Sovereign',
        'description': 'Complete 25 workout sessions.',
        'rarity': 'rare',
        'icon': 'shield',
        'xp_reward': 200,
    },
    {
        'key': 'centurion',
        'title': 'Centurion',
        'description': 'Complete 100 workout sessions.',
        'rarity': 'legendary',
        'icon': 'military_tech',
        'xp_reward': 500,
    },
    # ── XP milestones ──
    {
        'key': 'xp_100',
        'title': 'Awakened',
        'description': 'Earn your first 100 XP.',
        'rarity': 'common',
        'icon': 'star',
        'xp_reward': 0,
    },
    {
        'key': 'xp_500',
        'title': 'Gate Survivor',
        'description': 'Accumulate 500 total XP.',
        'rarity': 'common',
        'icon': 'star_half',
        'xp_reward': 0,
    },
    {
        'key': 'xp_1000',
        'title': 'Dungeon Master',
        'description': 'Accumulate 1,000 total XP.',
        'rarity': 'rare',
        'icon': 'workspace_premium',
        'xp_reward': 0,
    },
    {
        'key': 'xp_5000',
        'title': 'Monarch\'s Chosen',
        'description': 'Accumulate 5,000 total XP.',
        'rarity': 'epic',
        'icon': 'crown',
        'xp_reward': 0,
    },
    # ── Streak milestones ──
    {
        'key': 'streak_3',
        'title': 'Three-Day Hunter',
        'description': 'Maintain a 3-day workout streak.',
        'rarity': 'common',
        'icon': 'local_fire_department',
        'xp_reward': 30,
    },
    {
        'key': 'streak_7',
        'title': 'Week of Steel',
        'description': 'Maintain a 7-day workout streak.',
        'rarity': 'rare',
        'icon': 'whatshot',
        'xp_reward': 100,
    },
    {
        'key': 'streak_30',
        'title': 'Eternal Flame',
        'description': 'Maintain a 30-day workout streak.',
        'rarity': 'legendary',
        'icon': 'flare',
        'xp_reward': 500,
    },
    # ── Set milestones ──
    {
        'key': 'set_king_50',
        'title': 'Set Samurai',
        'description': 'Log 50 total sets across all sessions.',
        'rarity': 'common',
        'icon': 'repeat',
        'xp_reward': 50,
    },
    {
        'key': 'set_king_500',
        'title': 'Iron Monk',
        'description': 'Log 500 total sets across all sessions.',
        'rarity': 'epic',
        'icon': 'sports_martial_arts',
        'xp_reward': 300,
    },
    # ── Rank milestones ──
    {
        'key': 'e_rank',
        'title': 'E-Rank Hunter',
        'description': 'Begin your journey as an E-Rank Hunter.',
        'rarity': 'common',
        'icon': 'person',
        'xp_reward': 0,
    },
    {
        'key': 'd_rank',
        'title': 'D-Rank Hunter',
        'description': 'Rank up to D-Rank.',
        'rarity': 'common',
        'icon': 'trending_up',
        'xp_reward': 0,
    },
    {
        'key': 'c_rank',
        'title': 'C-Rank Hunter',
        'description': 'Rank up to C-Rank. The real training begins.',
        'rarity': 'rare',
        'icon': 'emoji_events',
        'xp_reward': 0,
    },
    {
        'key': 'b_rank',
        'title': 'B-Rank Hunter',
        'description': 'Rank up to B-Rank. Elite territory.',
        'rarity': 'rare',
        'icon': 'diamond',
        'xp_reward': 0,
    },
    {
        'key': 'a_rank',
        'title': 'A-Rank Hunter',
        'description': 'Rank up to A-Rank. You are among the best.',
        'rarity': 'epic',
        'icon': 'grade',
        'xp_reward': 0,
    },
    {
        'key': 's_rank',
        'title': 'Shadow Monarch',
        'description': 'Reach S-Rank. You stand above all others.',
        'rarity': 'legendary',
        'icon': 'auto_awesome',
        'xp_reward': 1000,
    },
]


class Command(BaseCommand):
    help = 'Seed the Achievement table with all achievement definitions.'

    def handle(self, *args, **options):
        created_count = 0
        for data in ACHIEVEMENTS:
            _, created = Achievement.objects.update_or_create(
                key=data['key'],
                defaults=data,
            )
            if created:
                created_count += 1
                self.stdout.write(f"  Created: {data['title']}")
            else:
                self.stdout.write(f"  Updated: {data['title']}")

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {created_count} new achievements created, {len(ACHIEVEMENTS) - created_count} updated.'
        ))
