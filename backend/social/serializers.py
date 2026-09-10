from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Friendship


class FriendUserSerializer(serializers.ModelSerializer):
    level = serializers.IntegerField(source='profile.level', read_only=True)
    rank = serializers.CharField(source='profile.rank', read_only=True)
    current_streak = serializers.IntegerField(source='profile.current_streak', read_only=True)
    xp = serializers.IntegerField(source='profile.xp', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'level', 'rank', 'current_streak', 'xp']


class FriendshipSerializer(serializers.ModelSerializer):
    from_user = FriendUserSerializer(read_only=True)
    to_user = FriendUserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'from_user', 'to_user', 'status', 'created_at']


class LeaderboardEntrySerializer(serializers.Serializer):
    rank_number = serializers.IntegerField()
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    level = serializers.IntegerField()
    rank = serializers.CharField()
    current_streak = serializers.IntegerField()
    xp = serializers.IntegerField()
    is_self = serializers.BooleanField()


class UserSearchSerializer(serializers.ModelSerializer):
    level = serializers.IntegerField(source='profile.level', read_only=True)
    rank = serializers.CharField(source='profile.rank', read_only=True)
    friendship_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'level', 'rank', 'friendship_status']

    def get_friendship_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 'none'
        if obj == request.user:
            return 'self'

        rel = Friendship.objects.filter(
            (models_q(from_user=request.user, to_user=obj) | models_q(from_user=obj, to_user=request.user))
        ).first()

        if not rel:
            return 'none'
        if rel.status == 'accepted':
            return 'friends'
        if rel.from_user == request.user:
            return 'pending_outgoing'
        return 'pending_incoming'


def models_q(**kwargs):
    from django.db.models import Q
    return Q(**kwargs)
