from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta

from .models import Friendship
from .serializers import (
    FriendUserSerializer,
    FriendshipSerializer,
    LeaderboardEntrySerializer,
    UserSearchSerializer,
)
from workouts.models import WorkoutSession
from gamification.models import Quest


class LeaderboardView(APIView):
    """
    GET /api/social/leaderboard/?scope=global|friends&timeframe=weekly|all_time
    Returns ranked hunters with XP, level, rank badge, streak, and current user indicator.
    """

    def get(self, request):
        scope = request.query_params.get('scope', 'global')
        timeframe = request.query_params.get('timeframe', 'weekly')
        current_user = request.user

        # 1. Base User Queryset
        if scope == 'friends':
            friend_users = Friendship.get_friends_of(current_user)
            users_qs = User.objects.filter(
                Q(id__in=friend_users.values_list('id', flat=True)) | Q(id=current_user.id)
            ).select_related('profile')
        else:
            users_qs = User.objects.filter(is_active=True).select_related('profile')

        user_list = list(users_qs)

        # 2. XP Computation
        leaderboard_data = []

        if timeframe == 'weekly':
            # Count XP earned in the last 7 days
            now = timezone.now()
            week_ago = now - timedelta(days=7)

            # Pre-aggregate session XP per user in that window
            session_xp_by_user = dict(
                WorkoutSession.objects.filter(
                    finished_at__gte=week_ago,
                    finished_at__isnull=False,
                ).values('user_id').annotate(total=Sum('xp_earned')).values_list('user_id', 'total')
            )

            # Pre-aggregate quest XP per user in that window
            quest_xp_by_user = dict(
                Quest.objects.filter(
                    status='completed',
                    completed_at__gte=week_ago,
                ).values('user_id').annotate(total=Sum('xp_reward')).values_list('user_id', 'total')
            )

            for u in user_list:
                prof = getattr(u, 'profile', None)
                s_xp = session_xp_by_user.get(u.id, 0) or 0
                q_xp = quest_xp_by_user.get(u.id, 0) or 0
                period_xp = s_xp + q_xp

                leaderboard_data.append({
                    'user_id': u.id,
                    'username': u.username,
                    'level': prof.level if prof else 1,
                    'rank': prof.rank if prof else 'E',
                    'current_streak': prof.current_streak if prof else 0,
                    'xp': period_xp,
                    'is_self': (u.id == current_user.id),
                })
        else:
            # All-time XP
            for u in user_list:
                prof = getattr(u, 'profile', None)
                total_xp = prof.xp if prof else 0
                leaderboard_data.append({
                    'user_id': u.id,
                    'username': u.username,
                    'level': prof.level if prof else 1,
                    'rank': prof.rank if prof else 'E',
                    'current_streak': prof.current_streak if prof else 0,
                    'xp': total_xp,
                    'is_self': (u.id == current_user.id),
                })

        # 3. Sort by XP descending, tie-break by level then username
        leaderboard_data.sort(key=lambda x: (x['xp'], x['level'], x['username']), reverse=True)

        # 4. Assign rank numbers
        user_rank_entry = None
        for idx, entry in enumerate(leaderboard_data, start=1):
            entry['rank_number'] = idx
            if entry['is_self']:
                user_rank_entry = entry

        serialized_entries = LeaderboardEntrySerializer(leaderboard_data, many=True).data

        return Response({
            'scope': scope,
            'timeframe': timeframe,
            'total_participants': len(leaderboard_data),
            'user_rank': user_rank_entry,
            'entries': serialized_entries,
        })


class FriendListView(APIView):
    """
    GET /api/social/friends/
    Returns:
      - friends: list of accepted friends
      - incoming: pending requests received by current user
      - outgoing: pending requests sent by current user
    """

    def get(self, request):
        user = request.user
        friends = Friendship.get_friends_of(user).select_related('profile')

        incoming = Friendship.objects.filter(to_user=user, status='pending').select_related('from_user__profile')
        outgoing = Friendship.objects.filter(from_user=user, status='pending').select_related('to_user__profile')

        return Response({
            'friends': FriendUserSerializer(friends, many=True).data,
            'incoming': FriendshipSerializer(incoming, many=True).data,
            'outgoing': FriendshipSerializer(outgoing, many=True).data,
        })


class FriendRequestView(APIView):
    """
    POST /api/social/friends/request/
    Body: { "username": "string" }
    Sends a friend request to the designated hunter.
    """

    def post(self, request):
        target_username = request.data.get('username', '').strip()
        if not target_username:
            return Response({'detail': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if target_username.lower() == request.user.username.lower():
            return Response({'detail': 'You cannot send a friend request to yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(username__iexact=target_username)
        except User.DoesNotExist:
            return Response({'detail': f'Hunter "{target_username}" was not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check existing friendship or requests
        existing = Friendship.objects.filter(
            Q(from_user=request.user, to_user=target_user) | Q(from_user=target_user, to_user=request.user)
        ).first()

        if existing:
            if existing.status == 'accepted':
                return Response({'detail': f'You are already friends with {target_user.username}.'}, status=status.HTTP_400_BAD_REQUEST)
            if existing.status == 'pending':
                if existing.from_user == request.user:
                    return Response({'detail': 'Friend request already sent.'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    # Target had already requested friendship with us -> auto accept!
                    existing.status = 'accepted'
                    existing.save()
                    return Response({'detail': f'Accepted friend request from {target_user.username}.', 'friendship': FriendshipSerializer(existing).data}, status=status.HTTP_200_OK)
            # If declined previously, reactivate request
            existing.from_user = request.user
            existing.to_user = target_user
            existing.status = 'pending'
            existing.save()
            return Response({'detail': 'Friend request sent.', 'friendship': FriendshipSerializer(existing).data}, status=status.HTTP_201_CREATED)

        friendship = Friendship.objects.create(
            from_user=request.user,
            to_user=target_user,
            status='pending',
        )
        return Response({'detail': 'Friend request sent.', 'friendship': FriendshipSerializer(friendship).data}, status=status.HTTP_201_CREATED)


class FriendRespondView(APIView):
    """
    POST /api/social/friends/respond/
    Body: { "friendship_id": int, "action": "accept"|"decline" }
    """

    def post(self, request):
        friendship_id = request.data.get('friendship_id')
        action = request.data.get('action')

        if action not in ['accept', 'decline']:
            return Response({'detail': 'Action must be "accept" or "decline".'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            friendship = Friendship.objects.get(id=friendship_id, to_user=request.user, status='pending')
        except Friendship.DoesNotExist:
            return Response({'detail': 'Pending request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'accept':
            friendship.status = 'accepted'
            friendship.save()
            return Response({'detail': 'Friend request accepted.', 'status': 'accepted'})
        else:
            friendship.status = 'declined'
            friendship.save()
            return Response({'detail': 'Friend request declined.', 'status': 'declined'})


class FriendRemoveView(APIView):
    """
    DELETE /api/social/friends/<int:user_id>/
    Removes the friendship with target user.
    """

    def delete(self, request, user_id):
        Friendship.objects.filter(
            (Q(from_user=request.user, to_user_id=user_id) | Q(from_user_id=user_id, to_user=request.user))
        ).delete()
        return Response({'detail': 'Friend removed.'}, status=status.HTTP_200_OK)


class UserSearchView(APIView):
    """
    GET /api/social/users/search/?q=<query>
    Searches for hunters by username.
    """

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])

        users = User.objects.filter(
            username__icontains=query,
            is_active=True,
        ).exclude(id=request.user.id).select_related('profile')[:15]

        serializer = UserSearchSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)
