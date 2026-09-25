# ASCEND — Production Readiness & DevOps Plan

> Sequence: close gaps → harden auth → clean code → test → Dockerize → CI/CD.
> Each stage assumes the previous one is done — don't containerize code you haven't verified, and don't wire CI/CD around a security hole.

---

## Stage 1 — Close the Functional Gaps

Quick decisions to make now, since they affect what Docker/CI config you'll need:

| Gap | Recommendation |
|---|---|
| Progress charts (volume/stat over time) | Build with `recharts` (already in your planned stack) — small, high demo value |
| Calendar heatmap | Nice-to-have; do it if time allows, don't block Docker/CI on it |
| Google OAuth | Explicitly decide: skip for now (email+JWT is fine for a portfolio demo) unless a specific reason needs it |
| Sound effects | Confirmed stretch — skip |
| Hosting target | Pick now: e.g. Render/Railway (backend) + Vercel (frontend) — this decision shapes your Docker and CI/CD setup below |

---

## Stage 2 — Authentication & Authorization Hardening

This is the highest-value stage. Auth bugs don't show up in normal testing — they show up when someone deliberately probes for them.

### 2.1 Token lifecycle
In `settings.py`, make sure `SIMPLE_JWT` isn't left at defaults:
```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
```
Requires `rest_framework_simplejwt.token_blacklist` in `INSTALLED_APPS`. Without rotation+blacklist, a leaked refresh token stays valid for its full lifetime with no way to revoke it.

### 2.2 The most important check: object-level ownership
The single most common bug in apps like this: an endpoint that returns/updates a resource by ID without checking it belongs to the requesting user (horizontal privilege escalation — User A can read/edit User B's workouts, nutrition logs, quests, etc. just by guessing or incrementing an ID).

**Audit every viewset/view in `workouts/`, `nutrition/`, `gamification/`, `social/`, and `ai/`:**
- Does `get_queryset()` filter by `user=self.request.user`? (Not just "any object exists with this ID.")
- For update/delete, is there an object-level permission check, not just an authenticated check?
- For the AI Coach tools specifically (`get_hunter_profile`, `get_recent_sessions`, etc.) — do they derive the user from the authenticated request, or could a `user_id` be passed in and trusted? It must always come from `request.user`, never from client input.

This is worth a dedicated pass, not a skim — write one explicit test per app that asserts User A gets a 403/404 when requesting User B's resource by ID.

### 2.3 Global permission default
In `settings.py`, set the default so nothing is accidentally public:
```python
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}
```
Then only explicitly override to `AllowAny` on login/register.

### 2.4 Other checks
- `AUTH_PASSWORD_VALIDATORS` enabled (not left empty)
- `DEBUG = False`, `ALLOWED_HOSTS` set explicitly for production settings
- `CORS_ALLOWED_ORIGINS` locked to your actual frontend domain(s) — never `CORS_ALLOW_ALL_ORIGINS = True` in prod
- Rate limiting/throttling on `/login/` and `/register/` (DRF `AnonRateThrottle`) to blunt brute-force attempts
- All secrets (`SECRET_KEY`, DB credentials, LLM API keys) come from environment variables, never hardcoded; confirm `.env` is in `.gitignore` and was never committed
- Token storage note: if the JWT lives in `localStorage` on the frontend, it's readable by any injected script (XSS risk). Acceptable for a portfolio project, but worth a one-line comment in the README acknowledging the tradeoff vs. an httpOnly-cookie refresh pattern.

---

## Stage 3 — Code Cleanup

- Run formatters/linters: `black` + `isort` + `flake8` (backend), `eslint` + `prettier` (frontend) — fix what they flag
- Grep for `console.log`, stray `print()`, `# TODO`, and commented-out blocks; remove or resolve
- **Audit every numeric input across the app** for the same "0 won't clear" bug found in the nutrition form — same root cause (coercing to Number on every keystroke) is very likely repeated wherever the shared input component was copy-pasted rather than reused
- Remove any unused components, dead API endpoints, or leftover scaffold code from earlier phases
- Confirm the offline AI fallbacks are intentional, documented behavior — not a silent failure mode

---

## Stage 4 — Test & QA Pass

- Run the full existing suite (`test_phases_core.py`, `test_phase4.py`, `test_ai_endpoints.py`, `test_ai_tools.py`) and fix any red tests before moving on
- Add the cross-user ownership tests from Stage 2.2 if they don't already exist
- Manual pass through all 11 pages against the PRD's feature list — confirm each does what Section 4 describes
- Test both AI code paths: with a real API key, and with it unset (offline fallback)
- Manually trigger both Celery beat tasks once (`reset_daily_quests_task`, `check_daily_streaks_task`) to confirm they actually fire, not just that they're scheduled

---

## Stage 5 — Dockerize

- **Backend Dockerfile** — multi-stage, final stage runs via `gunicorn`, not `runserver`
- **Frontend Dockerfile** — multi-stage: Node build stage → static files served by `nginx` (small final image)
- **`docker-compose.yml` (dev)** — services: `postgres`, `redis` (Celery broker), `backend`, `celery-worker`, `celery-beat`, `frontend`
- **`docker-compose.prod.yml`** — adds an `nginx` reverse proxy in front of backend+frontend, restart policies (`unless-stopped`), and pulls secrets from an env file that's never committed
- **`.dockerignore`** — exclude `node_modules`, `__pycache__`, `.env`, `.git`

---

## Stage 6 — CI/CD

- **`ci.yml`** (GitHub Actions, runs on PR/push): install deps → lint → run backend tests → run frontend tests (if any) → build both Docker images to confirm they build cleanly
- **`cd.yml`** (runs on merge to `main`): build + push images to a registry → deploy to your Stage-1 hosting choice (Render/Railway support Git-triggered deploys directly; otherwise `docker-compose pull && up -d` on your host)
- Store all secrets (DB URL, `SECRET_KEY`, LLM API keys) as GitHub Actions secrets, never in the workflow file
- Optional but worthwhile: pre-commit hooks running `black`/`isort`/`eslint` so Stage 3's cleanup doesn't regress
