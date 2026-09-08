from django.db import models
from django.contrib.auth.models import User


# ─── Quests ──────────────────────────────────────────────────────────────────

class Quest(models.Model):
    """
    A daily or weekly quest assigned to a user.
    Daily quests are auto-generated each day; weekly quests span the week.
    """

    QUEST_TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quests')
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True, default='')
    quest_type = models.CharField(max_length=10, choices=QUEST_TYPE_CHOICES, default='daily')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    xp_reward = models.PositiveIntegerField(default=50)

    # Quantitative goal (e.g. "complete 3 workouts", "log 10 sets")
    goal_type = models.CharField(max_length=40, default='complete_workouts')
    goal_target = models.PositiveIntegerField(default=1)
    goal_current = models.PositiveIntegerField(default=0)

    assigned_date = models.DateField()  # The date this quest was assigned
    expires_at = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-assigned_date', 'quest_type']

    def __str__(self):
        return f"[{self.quest_type.upper()}] {self.title} — {self.user.username} ({self.status})"

    @property
    def progress_pct(self):
        if self.goal_target == 0:
            return 100
        return min(int((self.goal_current / self.goal_target) * 100), 100)

    @property
    def is_complete(self):
        return self.goal_current >= self.goal_target


# ─── Achievements ─────────────────────────────────────────────────────────────

class Achievement(models.Model):
    """
    Defines an achievement/title that can be unlocked.
    Seeded via management command.
    """

    RARITY_CHOICES = [
        ('common', 'Common'),
        ('rare', 'Rare'),
        ('epic', 'Epic'),
        ('legendary', 'Legendary'),
    ]

    key = models.CharField(max_length=60, unique=True)  # e.g. 'first_blood'
    title = models.CharField(max_length=80)             # e.g. 'First Blood'
    description = models.TextField()
    rarity = models.CharField(max_length=12, choices=RARITY_CHOICES, default='common')
    icon = models.CharField(max_length=60, default='military_tech')  # Material Symbol name
    xp_reward = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['rarity', 'title']

    def __str__(self):
        return f"{self.title} ({self.rarity})"


class UserAchievement(models.Model):
    """
    Junction table recording which achievements a user has unlocked and when.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'achievement']
        ordering = ['-unlocked_at']

    def __str__(self):
        return f"{self.user.username} — {self.achievement.title}"
