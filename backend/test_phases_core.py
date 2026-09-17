import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ascend.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.models import UserProfile
from exercises.models import Exercise
from workouts.models import WorkoutSession, SetLog, WorkoutTemplate
from gamification.models import Quest, Achievement, UserAchievement
from gamification.achievement_checker import check_and_unlock_achievements
from workouts.views import (
    SessionListCreateView,
    SessionFinishView,
    SetLogCreateView,
    DashboardStatsView,
)
from gamification.views import TodayQuestsView, QuestCompleteView
from accounts.views import MeView

factory = APIRequestFactory()

print("--- Testing Phase 1: Core Loop ---")
# 1. User & Profile
user, _ = User.objects.get_or_create(username='core_test_hunter', defaults={'email': 'hunter@core.test'})
profile, _ = UserProfile.objects.get_or_create(
    user=user,
    defaults={
        'level': 1,
        'xp': 0,
        'rank': 'E',
        'stat_points': 5,
        'strength': 10,
        'vitality': 10,
        'agility': 10,
        'endurance': 10,
        'flexibility': 10,
        'discipline': 10,
    }
)
req = factory.get('/api/auth/me/')
force_authenticate(req, user=user)
res = MeView.as_view()(req)
assert res.status_code == 200
print(f"[OK] Profile retrieved: Rank {res.data['rank']}, Level {res.data['level']}, STR {res.data['stat_str']}")

# 2. Workout Session & Set Logging
bench = Exercise.objects.filter(muscle_group='chest').first() or Exercise.objects.first()
req = factory.post('/api/workouts/sessions/', {'name': 'Dungeon Trial: Chest'}, format='json')
force_authenticate(req, user=user)
res = SessionListCreateView.as_view()(req)
assert res.status_code == 201
session_id = res.data['id']
print(f"[OK] Started Workout Session id={session_id}")

# Add Set
req = factory.post(f'/api/workouts/sessions/{session_id}/sets/', {
    'exercise': bench.id,
    'set_number': 1,
    'reps': 10,
    'weight_kg': 80.0,
}, format='json')
force_authenticate(req, user=user)
res = SetLogCreateView.as_view()(req, session_id=session_id)
assert res.status_code == 201, f"Set log failed: {res.data}"
print(f"[OK] Set logged: {bench.name} 10 reps @ 80kg")

# Finish Session & Award XP
req = factory.patch(f'/api/workouts/sessions/{session_id}/finish/', {
    'notes': 'Cleared dungeon gate successfully.'
}, format='json')
force_authenticate(req, user=user)
res = SessionFinishView.as_view()(req, pk=session_id)
assert res.status_code == 200, f"Session finish failed: {res.data}"
xp_awarded = res.data['xp_earned']
print(f"[OK] Finished session! XP Awarded: {xp_awarded}, New Level: {res.data['new_level']}")

# 3. Workout Dashboard Stats
req = factory.get('/api/workouts/dashboard/')
force_authenticate(req, user=user)
res = DashboardStatsView.as_view()(req)
assert res.status_code == 200
print(f"[OK] Summary retrieved: Total workouts={res.data['total_sessions']}, Total Volume={res.data['total_volume_kg']}kg")

print("\n--- Testing Phase 2: Gamification Engine ---")
# 4. Quests
req = factory.get('/api/gamification/quests/today/')
force_authenticate(req, user=user)
res = TodayQuestsView.as_view()(req)
assert res.status_code == 200
assert len(res.data) > 0
active_quest = res.data[0]
print(f"[OK] Quests retrieved: {len(res.data)} daily/weekly quests. First: {active_quest['title']}")

# Complete Quest
req = factory.post(f"/api/gamification/quests/{active_quest['id']}/complete/")
force_authenticate(req, user=user)
res = QuestCompleteView.as_view()(req, pk=active_quest['id'])
assert res.status_code == 200
print(f"[OK] Quest completed! XP earned: {res.data['xp_earned']}, Leveled up: {res.data['leveled_up']}")

# 5. Achievements
awarded = check_and_unlock_achievements(user)
print(f"[OK] Achievement check executed. Newly unlocked: {len(awarded)}")

print("\nALL PHASE 1 & 2 CORE/GAMIFICATION TESTS PASSED CLEANLY!")
