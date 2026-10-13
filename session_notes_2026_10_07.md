# Dev Log — Session: Oct 7, 2026

**Project:** ASCEND (Solo Leveling Fitness Tracker)  
**Status:** Backend running, AI endpoints live, Frontend stable, Pushed to GitHub  
**Branch:** `main` (clean, in sync with `origin/main`)

---

## 1. Summary of Accomplishments

- Fixed frontend API connection timeout preventing login.
- Hardened database and secret credentials (removed hardcoded passwords from repo).
- Completely migrated AI service to Google Gemini using official `google-genai` SDK, dropping deprecated wrappers.
- Fixed an infinite React re-render loop that flooded the backend with API calls on the Dashboard.
- Resolved git branch divergence and pushed all updates to GitHub.

---

## 2. Issues Diagnosed & Solutions

### A. Login `ERR_CONNECTION_TIMED_OUT`
- **Root Cause:** `frontend/.env.local` pointed to a hardcoded local WiFi IP (`192.168.29.132:8000`) instead of `localhost:8000`. When the network IP changed or when running on localhost, the browser could not reach the server.
- **Fix:** Switched `REACT_APP_API_URL` to `http://localhost:8000/api` in `frontend/.env.local` (kept commented instructions for future mobile LAN testing).

### B. Security & Credentials Exposure
- **Root Cause:** PostgreSQL database password was hardcoded in `backend/ascend/settings.py` and had been committed to git history.
- **Fix:**
  - Altered the PostgreSQL user password inside `psql` to a new secret password.
  - Created a local, gitignored `backend/.env` to store `DB_PASSWORD` and `GEMINI_API_KEY`.
  - Refactored `backend/ascend/settings.py` to read `DB_PASSWORD` strictly from environment variables without default fallback.
  - Sanitized `backend/.env.example` with generic placeholders.

### C. AI Fallback & Timeout Issues (Migration to `google-genai`)
- **Root Cause:**
  - Deprecated model `gemini-1.5-flash` caused Google API 404 errors.
  - The legacy `openai` wrapper had no request timeout, causing requests to hang indefinitely.
  - AI views caught all exceptions and silently returned fallback data without logging errors.
- **Fix:**
  - Migrated backend from `openai`/`anthropic` wrappers to the native Google SDK: `google-genai>=2.28.0`.
  - Uninstalled `openai` and `anthropic` from virtual environment.
  - Set `DEFAULT_MODEL = 'gemini-flash-lite-latest'` in `backend/ai/client.py` (tested latency: < 2 seconds).
  - Added a 30-second fail-fast timeout and 5-round execution cap on tool calls.
  - Added `logger.exception` in `backend/ai/views.py` across all endpoints (`/api/ai/parse-workout/`, `/api/ai/quest-generate/`, `/api/ai/coach/`) so issues are visible in server logs.

### D. Infinite API Request Flood on Dashboard
- **Root Cause:** In `frontend/src/context/AuthContext.js`, `refreshProfile` was defined as an unmemoized inline function. `DashboardPage.js` had `refreshProfile` in its `useCallback` dependency array. Every time profile state updated, a new function reference triggered `useEffect` again, creating an infinite request storm (> 100 req/sec) to `/api/workouts/dashboard/`, `/api/gamification/quests/today/`, and `/api/auth/me/`.
- **Fix:** Wrapped all exported functions in `AuthContext.js` (`login`, `register`, `logout`, `refreshProfile`) with `useCallback` to ensure permanent reference stability.

### E. Git Sync & Push
- **Root Cause:** Remote had an independent commit (`3683ea0`) deleting the PRD file while local had restructured documentation updates.
- **Fix:** Merged remote changes preserving local PRD documentation, verified clean diff, and pushed commits to `origin/main`.

---

## 3. Files Modified

| File | Changes Made |
| :--- | :--- |
| `backend/ascend/settings.py` | Removed hardcoded credentials; simplified AI settings to Gemini only. |
| `backend/ai/client.py` | Rewritten to use `google-genai`; added timeout, tool-loop safety, and fast model default. |
| `backend/ai/views.py` | Added explicit error logging to fallback exception handlers. |
| `backend/requirements.txt` | Swapped `openai`/`anthropic` for `google-genai>=2.28.0`. |
| `backend/.env` | Created (gitignored) storing `DB_PASSWORD` and `GEMINI_API_KEY`. |
| `backend/.env.example` | Sanitized placeholders for DB and Gemini credentials. |
| `frontend/.env.local` | Set `REACT_APP_API_URL` to `http://localhost:8000/api`. |
| `frontend/src/context/AuthContext.js` | Memoized action functions using `useCallback` to eliminate render loops. |

---

## 4. Next Steps / Pending Tasks

- [ ] Continue feature development or testing across workout, quest, and social pages.
- [ ] Before production deployment: externalize `SECRET_KEY` and set `DEBUG = False`.
- [ ] Optional: Run `git filter-repo` to scrub old commit `d42b7e1` from git history if repository is ever made public.
