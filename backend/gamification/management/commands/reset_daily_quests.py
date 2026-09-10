from django.core.management.base import BaseCommand
from gamification.tasks import reset_daily_quests_task


class Command(BaseCommand):
    help = 'Expires past daily quests and generates today quests for active hunters'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Executing quest reset...'))
        result = reset_daily_quests_task()
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully expired {result['expired_quests']} quests and assigned daily quests to {result['users_assigned_quests']} hunters."
            )
        )
