import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ascend.settings')
django.setup()

from django.contrib.auth.models import User
from ai.tools import COACH_TOOLS, execute_tool

user = User.objects.filter(username='core_test_hunter').first()
assert user is not None, "Test user not found"

print("--- Testing Phase 4: AI Tools against Live Backend Models ---")

# 1. get_hunter_profile
res = execute_tool('get_hunter_profile', {}, user)
assert 'level' in res and 'rank' in res
print("[OK] get_hunter_profile:", res)

# 2. get_recent_sessions
res = execute_tool('get_recent_sessions', {'limit': 3}, user)
assert 'sessions' in res
print(f"[OK] get_recent_sessions: {len(res['sessions'])} sessions found")

# 3. get_today_quests
res = execute_tool('get_today_quests', {}, user)
assert 'quests' in res
print(f"[OK] get_today_quests: {len(res['quests'])} quests found")

# 4. get_exercise_library
res = execute_tool('get_exercise_library', {'muscle_group': 'chest'}, user)
assert 'exercises' in res
print(f"[OK] get_exercise_library: {len(res['exercises'])} chest exercises found")

print("\nALL AI COACH TOOLS TESTED & OPERATIONAL AGAINST DJANGO MODELS!")
