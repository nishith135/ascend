import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ascend.settings')

app = Celery('ascend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Periodic task beat schedule
app.conf.beat_schedule = {
    'reset-daily-quests-at-midnight': {
        'task': 'gamification.tasks.reset_daily_quests_task',
        'schedule': 86400.0,  # Run daily or configure crontab(hour=0, minute=0)
    },
    'check-daily-streaks': {
        'task': 'gamification.tasks.check_daily_streaks_task',
        'schedule': 86400.0,
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
