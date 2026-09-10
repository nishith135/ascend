from django.urls import path
from .views import (
    LeaderboardView,
    FriendListView,
    FriendRequestView,
    FriendRespondView,
    FriendRemoveView,
    UserSearchView,
)

urlpatterns = [
    path('leaderboard/', LeaderboardView.as_view(), name='social-leaderboard'),
    path('friends/', FriendListView.as_view(), name='social-friends'),
    path('friends/request/', FriendRequestView.as_view(), name='social-friends-request'),
    path('friends/respond/', FriendRespondView.as_view(), name='social-friends-respond'),
    path('friends/<int:user_id>/', FriendRemoveView.as_view(), name='social-friends-remove'),
    path('users/search/', UserSearchView.as_view(), name='social-users-search'),
]
