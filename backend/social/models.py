from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q


class Friendship(models.Model):
    """
    Manages connections between hunters.
    Status can be 'pending', 'accepted', or 'declined'.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]

    from_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='sent_friend_requests'
    )
    to_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='received_friend_requests'
    )
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['from_user', 'to_user']

    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username} ({self.status})"

    @classmethod
    def get_friends_of(cls, user):
        """Returns a QuerySet of Users who are accepted friends with the given user."""
        accepted = cls.objects.filter(
            Q(from_user=user) | Q(to_user=user),
            status='accepted'
        )
        friend_ids = []
        for rel in accepted:
            if rel.from_user_id == user.id:
                friend_ids.append(rel.to_user_id)
            else:
                friend_ids.append(rel.from_user_id)
        return User.objects.filter(id__in=friend_ids)
