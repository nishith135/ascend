import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ascend.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory, force_authenticate
from ai.views import ParseWorkoutView, QuestGenerateView, CoachView

user, _ = User.objects.get_or_create(username='ai_test_hunter', defaults={'email': 'hunter@ai.test'})
factory = APIRequestFactory()

print("--- Testing Phase 4: AI Endpoints ---")

# 1. Parse Workout
req = factory.post('/api/ai/parse-workout/', {
    'text': 'did 3 sets of bench press at 80kg 10 reps and 4 sets squats at 100kg 8 reps'
}, format='json')
force_authenticate(req, user=user)
res = ParseWorkoutView.as_view()(req)
assert res.status_code == 200, f"Parse failed: {res.data}"
assert 'exercises' in res.data and len(res.data['exercises']) >= 1
print(f"[OK] ParseWorkoutView: Extracted {len(res.data['exercises'])} exercises:")
for ex in res.data['exercises']:
    print(f"     - {ex['exercise_name']}: {len(ex['sets'])} sets")

# 2. Quest Generate
req = factory.post('/api/ai/quest-generate/', {}, format='json')
force_authenticate(req, user=user)
res = QuestGenerateView.as_view()(req)
assert res.status_code == 200, f"Quest generate failed: {res.data}"
assert 'quests' in res.data and len(res.data['quests']) >= 1
print(f"[OK] QuestGenerateView: Generated {len(res.data['quests'])} daily lore quests:")
for q in res.data['quests']:
    print(f"     - [{q['title']}] ({q['xp_reward']} XP): {q['flavor'][:60]}...")

# 3. AI Coach Chat
req = factory.post('/api/ai/coach/', {
    'messages': [
        {'role': 'user', 'content': 'System, what are my current hunter stats?'}
    ]
}, format='json')
force_authenticate(req, user=user)
res = CoachView.as_view()(req)
assert res.status_code == 200, f"Coach failed: {res.data}"
assert 'reply' in res.data and len(res.data['reply']) > 20
print(f"[OK] CoachView: System reply received ({len(res.data['reply'])} chars):")
print("--------------------------------------------------")
print(res.data['reply'][:200] + "...")
print("--------------------------------------------------")

print("\nALL PHASE 4 AI ENDPOINTS TESTED & 100% OPERATIONAL!")
