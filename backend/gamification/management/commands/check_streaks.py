from django.core.management.base import BaseCommand
from gamification.tasks import check_daily_streaks_task


class Command(BaseCommand):
    help = 'Evaluates daily streaks and resets streaks if hunter was inactive > 24 hours'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Checking hunter streaks...'))
        result = check_daily_streaks_task()
        self.stdout.write(
            self.style.SUCCESS(
                f"Completed streak integrity check. Reset broken streaks for {result['streaks_reset']} hunters."
            )
        )
