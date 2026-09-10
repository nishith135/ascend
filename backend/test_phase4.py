import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ascend.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory, force_authenticate
from nutrition.views import TodayNutritionView, QuickLogView, NutritionHistoryView
from social.views import LeaderboardView, FriendListView, FriendRequestView, UserSearchView

# 1. Create or get test users
u1, _ = User.objects.get_or_create(username='tester_jinwoo', defaults={'email': 'jinwoo@hunter.com'})
u2, _ = User.objects.get_or_create(username='tester_cha', defaults={'email': 'cha@hunter.com'})
u1.set_password('pass123')
u2.set_password('pass123')
u1.save()
u2.save()

from social.models import Friendship
Friendship.objects.filter(from_user__in=[u1, u2], to_user__in=[u1, u2]).delete()

factory = APIRequestFactory()

# Test 1: Today Nutrition GET & PATCH
req = factory.get('/api/nutrition/today/')
force_authenticate(req, user=u1)
res = TodayNutritionView.as_view()(req)
assert res.status_code == 200, f"Nutrition GET failed: {res.data}"
print("[OK] Nutrition GET today passed:", res.data['date'], "water:", res.data['water_ml'])

req = factory.post('/api/nutrition/quick-add/', {'water_ml_delta': 500, 'protein_g_delta': 30}, format='json')
force_authenticate(req, user=u1)
res = QuickLogView.as_view()(req)
assert res.status_code == 200, f"QuickLog failed: {res.data}"
print("[OK] QuickLog passed, new water:", res.data['water_ml'], "protein:", res.data['protein_g'])

req = factory.get('/api/nutrition/history/?days=7')
force_authenticate(req, user=u1)
res = NutritionHistoryView.as_view()(req)
assert res.status_code == 200, f"Nutrition history failed: {res.data}"
assert len(res.data) == 7
print("[OK] Nutrition history 7-day sparkline passed: 7 days returned")

# Test 2: Social Leaderboard
req = factory.get('/api/social/leaderboard/?scope=global&timeframe=all_time')
force_authenticate(req, user=u1)
res = LeaderboardView.as_view()(req)
assert res.status_code == 200, f"Leaderboard failed: {res.data}"
print("[OK] Leaderboard global all-time passed, participants:", res.data['total_participants'])

# Test 3: Friends request & list
req = factory.post('/api/social/friends/request/', {'username': 'tester_cha'}, format='json')
force_authenticate(req, user=u1)
res = FriendRequestView.as_view()(req)
assert res.status_code in [200, 201], f"Friend request failed: {res.data}"
print("[OK] Friend request sent:", res.data['detail'])

req = factory.get('/api/social/friends/')
force_authenticate(req, user=u2)
res = FriendListView.as_view()(req)
assert res.status_code == 200
print("[OK] Recipient incoming friend requests:", len(res.data['incoming']))

req = factory.get('/api/social/users/search/?q=tester')
force_authenticate(req, user=u1)
res = UserSearchView.as_view()(req)
assert res.status_code == 200
print("[OK] User search passed, matches:", len(res.data))

print("\nALL PHASE 4 BACKEND ENDPOINTS VERIFIED SUCCESSFULLY!")
