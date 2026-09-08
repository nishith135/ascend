from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """
    Extends Django's User with RPG-style stats, XP, level, and rank.
    Created automatically via signal when a User is created.
    """

    RANK_CHOICES = [
        ('E', 'E-Rank'),
        ('D', 'D-Rank'),
        ('C', 'C-Rank'),
        ('B', 'B-Rank'),
        ('A', 'A-Rank'),
        ('S', 'S-Rank'),
    ]

    GOAL_CHOICES = [
        ('strength', 'Strength'),
        ('endurance', 'Endurance'),
        ('flexibility', 'Flexibility'),
    ]

    EXPERIENCE_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    # Rank thresholds: E (1-5), D (6-10), C (11-20), B (21-35), A (36-50), S (51+)
    RANK_THRESHOLDS = [
        (1, 'E'),
        (6, 'D'),
        (11, 'C'),
        (21, 'B'),
        (36, 'A'),
        (51, 'S'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    # Progression
    level = models.PositiveIntegerField(default=1)
    xp = models.PositiveIntegerField(default=0)
    rank = models.CharField(max_length=2, choices=RANK_CHOICES, default='E')
    current_streak = models.PositiveIntegerField(default=0)
    last_workout_date = models.DateField(null=True, blank=True)

    # RPG Stats
    stat_str = models.PositiveIntegerField(default=0)  # Strength — lifting volume
    stat_vit = models.PositiveIntegerField(default=0)  # Vitality — consistency / recovery
    stat_agi = models.PositiveIntegerField(default=0)  # Agility — cardio / speed
    stat_end = models.PositiveIntegerField(default=0)  # Endurance — session duration
    stat_flx = models.PositiveIntegerField(default=0)  # Flexibility — mobility / stretch
    stat_per = models.PositiveIntegerField(default=0)  # Perception — streak / discipline

    # Onboarding
    fitness_goal = models.CharField(max_length=20, choices=GOAL_CHOICES, default='strength')
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES, default='beginner')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} — Lv.{self.level} {self.get_rank_display()}"

    @property
    def xp_for_next_level(self):
        """XP required to reach the next level: 100 × current_level."""
        return 100 * self.level

    @property
    def xp_progress(self):
        """XP accumulated toward the current level."""
        # Total XP needed to reach current level from level 1:
        # sum of 100*i for i in 1..(level-1) = 100 * (level-1)*level/2
        total_xp_at_current_level = 100 * (self.level - 1) * self.level // 2
        return self.xp - total_xp_at_current_level

    def add_xp(self, amount):
        """Add XP and handle level-ups and rank promotions."""
        self.xp += amount
        leveled_up = False

        # Check for level-ups (can level up multiple times)
        while self.xp_progress >= self.xp_for_next_level:
            self.level += 1
            leveled_up = True

        # Update rank based on level thresholds
        new_rank = 'E'
        for threshold, rank in self.RANK_THRESHOLDS:
            if self.level >= threshold:
                new_rank = rank
        self.rank = new_rank

        self.save()
        return leveled_up

    def add_stat(self, stat_name, amount):
        """Increment a stat by the given amount. stat_name is one of STR/VIT/AGI/END/FLX/PER."""
        field_map = {
            'STR': 'stat_str',
            'VIT': 'stat_vit',
            'AGI': 'stat_agi',
            'END': 'stat_end',
            'FLX': 'stat_flx',
            'PER': 'stat_per',
        }
        field = field_map.get(stat_name.upper())
        if field:
            current = getattr(self, field)
            setattr(self, field, current + amount)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Auto-create a UserProfile when a new User is created."""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Auto-save the UserProfile when the User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
