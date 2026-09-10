# Product Requirements Document
## Project Codename: **ASCEND** — A Solo-Leveling-Themed Fitness Tracker

---

## 1. Vision

A fitness tracking app that turns real-world workouts into an RPG progression system, visually and mechanically inspired by *Solo Leveling*'s "System" interface — dark, glowing-blue holographic UI panels, stat windows, level-up notifications, and quest logs. The user isn't just "logging a workout" — they're a Hunter completing quests, clearing dungeons, and ranking up from E-Rank to S-Rank.

**Core hook:** Every real workout maps to an in-game action. Bench press = STR gain. Running = AGI gain. Consistency = Rank progression. Missed days = a "Penalty Zone" warning (playful, not punishing).

---

## 2. Target User

- Solo gym-goers who respond better to gamification than plain analytics (Strava/MyFitnessPal fatigue)
- Anime-adjacent fitness audience (the "Solo Leveling workout challenge" is already a real internet trend)
- You, as a portfolio piece — this should visually *pop* in a demo video/GIF for recruiters or socials

---

## 3. Design Language — "The System" UI

| Element | Direction |
|---|---|
| **Color palette** | Deep navy/black background (#0A0E1A style), electric blue (#3B82F6 / #60A5FA) and violet accents (#8B5CF6), white text with glow/blur shadows |
| **Typography** | Sharp, futuristic sans-serif (e.g. Orbitron, Rajdhani, or Exo 2 for headers; Inter for body) |
| **Motifs** | Hexagonal panels, angular borders, thin glowing rule lines, particle/scanline background texture |
| **Micro-interactions** | "System" pop-up notifications sliding in from top (`[System] Quest Complete: Leg Day`), animated XP bar fill, stat number "count-up" ticks, screen-flash on Level Up / Rank Up |
| **Sound (stretch)** | Optional low-volume UI "blip" sfx on notifications — toggleable |
| **Layout metaphor** | Dashboard = "Status Window", Workout log = "Quest Log", Progress = "Stat Sheet", Achievements = "Titles" |

Reference feel: think of the anime's blue system panels, the stat allocation screen, and the "You have leveled up" full-screen flash — but rendered as clean modern web UI, not a literal skin.

---

## 4. Core Features (MVP)

### 4.1 Authentication & Onboarding
- Sign up / login (email + Google OAuth via Supabase Auth or Django + JWT)
- Onboarding flow styled as "Hunter Registration" — collects fitness goal, experience level, available equipment
- Initial stat allocation screen (choose starting focus: Strength / Endurance / Flexibility) — cosmetic weighting, not a hard gate

### 4.2 The Status Window (Dashboard/Home)
- Player card: Name, Level, Rank (E → D → C → B → A → S), XP bar to next level
- Six core stats, RPG-styled but mapped to real fitness domains:
  - **STR** (Strength) — lifting volume
  - **VIT** (Vitality) — workout consistency / recovery adherence
  - **AGI** (Agility) — cardio/speed work
  - **END** (Endurance) — session duration, stamina-based workouts
  - **FLX** (Flexibility) — mobility/stretch sessions
  - **PER** (Perception/Discipline) — streak length, logging consistency
- Current streak counter, weekly quest progress ring
- "Daily Quest" panel — auto-generated micro-goals (e.g. "Complete 1 upper body session")

### 4.3 Workout Logging ("Quest Log")
- Exercise library (searchable, filterable by muscle group/equipment) — seed with a standard public dataset
- Log sets/reps/weight/duration per exercise
- Custom workout/routine builder ("Create a Dungeon Run") — save reusable templates
- Rest timer with visual "cooldown" styling
- Quick-log mode for fast entry mid-workout

### 4.4 Progress Tracking ("Stat Sheet")
- Historical charts: volume over time, stat growth over time, bodyweight/measurements log
- Personal records (PRs) tracked and celebrated with a "New Record — Skill Unlocked" style notification
- Calendar heatmap of workout consistency (GitHub-contribution-graph style, reskinned)

### 4.5 Gamification Layer
- XP awarded per completed workout (weighted by intensity/duration)
- Level-up triggers a full-screen "System" animation
- Rank promotions (E→S) at XP milestones, each unlocking a cosmetic title/badge ("Shadow Monarch", "Iron Will", etc. — invent your own non-copyrighted titles)
- "Penalty Quest" — a light, non-punitive nudge after missed streak days (never guilt-heavy — keep it playful per good UX/wellbeing practice)
- Achievements/Titles page — badge collection grid

### 4.6 Nutrition (lightweight MVP)
- Simple daily log: calories + macros
- **Manual entry form** — name, calories, protein/carbs/fats — no external dependency, close this gap before moving past current build
- **Personal food library** — manually-entered foods save to a reusable "My Foods" list for 1-tap re-logging (this, not database search, is what makes day-to-day logging fast)
- Quick-add presets (shake, meal, etc.) remain as fast-path shortcuts on top of the above, not the only entry method
- Water intake tracker styled as a "Mana/Stamina" bar
- **Phase 3 addition:** food database search API (Open Food Facts / Nutritionix / Edamam) and natural-language food logging (reuses the same LLM parsing pattern as NL workout logging)

### 4.7 Social (lightweight MVP)
- Friends list, weekly XP leaderboard ("Guild Ranking")
- Share a workout/level-up card as an image (good for virality/socials)

---

## 5. AI-Powered Features

Pick based on time budget — ordered roughly by effort:

1. **AI Quest Generator** — LLM call that generates the day's quest text/copy based on the user's recent activity and stats (cheap, high visual payoff — this is what makes quests feel alive instead of templated).
2. **Natural-language workout logging** — user types "did 4 sets of squats at 60kg, felt tough" → LLM parses into structured log entries (great showcase of function calling / structured output).
3. **AI Coach ("The System" chat)** — a chat panel styled as the in-universe System, answering fitness questions and referencing the user's actual logged data via tool calls into your Django API (this is the "agent with tool access" pattern — strong portfolio signal).
4. **Adaptive routine suggestions** — given logged history + goal, suggest next week's split (simple rules engine now, LLM-assisted later).
5. **(Stretch) Form-check from video/photo** — pose-estimation feedback; substantial scope, flag as V2/out of MVP.

---

## 6. Tech Stack

| Layer | Choice |
|---|---|
| Backend | Python, Django + Django REST Framework (API-first, since frontend is decoupled) |
| Frontend | React (component logic/state) + HTML/CSS for structure/styling, vanilla JS where React is overkill |
| Database | PostgreSQL (via Supabase, which also gives you Auth + Storage + optional pgvector for later AI features) |
| Auth | Supabase Auth *or* Django + `djangorestframework-simplejwt` (pick one — don't run both) |
| Background jobs (stretch) | Celery + Redis, or Django-Q if you want something lighter, for XP recalculation / daily quest resets / streak checks |
| AI layer | Anthropic or OpenAI API for the Coach/Quest Generator; function/tool calling to hit your own DRF endpoints |
| Animations | Framer Motion (React) for System-style panel transitions |
| Hosting (suggested) | Railway/Render for Django, Vercel for React, Supabase managed Postgres |

---

## 7. Data Model (starter sketch)

- `User` (extends auth) — level, xp, rank, current_streak, stats (STR/VIT/AGI/END/FLX/PER)
- `Exercise` — name, muscle_group, equipment, default_stat_mapping
- `WorkoutTemplate` — user, name, list of exercises + target sets/reps
- `WorkoutSession` — user, date, duration, linked exercises + logged sets
- `SetLog` — session_id, exercise_id, reps, weight, duration
- `Quest` — user, date, description, type (daily/weekly), status, xp_reward
- `Achievement` / `UserAchievement` — badge metadata + unlock timestamp
- `NutritionLog` — user, date, calories, macros, water_ml
- `FriendLink` / `LeaderboardEntry` — social graph + weekly XP snapshot

---

## 8. Non-Functional Requirements

- Mobile-responsive (most gym use is on phone)
- Fast perceived performance on logging actions (optimistic UI updates in React)
- Accessible color contrast despite the dark/glow theme (don't sacrifice readability for aesthetic)
- Data privacy: workout/health data should never be exposed via public leaderboard without opt-in

---

## 9. Suggested Build Phases (for prompting in stages if one-shot gets too large)

1. **Phase 1 — Core loop:** Auth, exercise library, workout logging, basic dashboard with stats/XP/level (no AI yet)
2. **Phase 2 — Gamification polish:** System-style notifications, rank-up animations, quests, achievements
3. **Phase 3 — AI layer:** Natural-language logging, AI Coach chat with tool access, AI-generated quest copy
4. **Phase 4 — Social + nutrition + stretch:** Leaderboards, nutrition tracking, Celery-based automation
5. **Phase 5 — Computer vision (future):** Pose-based rep counting and rule-based form feedback for a small set of core exercises (see Section 11). Reference "correct form" demo videos are cheap enough to fold into the Phase 1 exercise library directly and don't need to wait for this phase.

---

## 11. Future Feature: Computer Vision — Form Check & Rep Counting

Not part of the MVP phases — captured here so the direction is documented without committing current scope to it.

**Three sub-features, deliberately separated by difficulty:**

1. **Reference form demo** (not CV — just content). A looping video/GIF per exercise showing correct execution, shown when an exercise is selected. Cheap enough to fold into the Phase 1 exercise library directly.
2. **Rep counting** (medium difficulty). Client-side pose estimation via MediaPipe Pose Landmarker (WebAssembly, runs in-browser through the webcam via `getUserMedia`). Count reps by tracking a relevant joint angle (e.g. knee angle for squats) through peak-to-valley cycles. Scope to 3–5 core exercises first (squat, pushup, bicep curl, lunge), not the full library.
3. **Form correctness feedback** (hardest). Rule-based angle-range checks per exercise ("knees not past toes," "back angle above X°") for the same small exercise set — not a general-purpose form-AI across the whole library. Accuracy depends heavily on camera angle, lighting, and occlusion; the app should disclose this rather than imply guaranteed correctness.

**Architecture guidance:** Run pose estimation client-side in React (MediaPipe Tasks Vision). Do not stream raw video to the Django backend — it's costly, adds latency, and raises privacy concerns for workout footage. If anything is sent server-side, send only the extracted landmark coordinates, not video.

---

## 12. Success Metrics (portfolio framing)

- Working demo-able loop: sign up → log workout → see stat/XP/level update → get a quest → hit a rank-up animation
- At least one AI feature with visible tool-calling into your own backend (strongest technical talking point in interviews)
- Clean, cohesive visual theme carried across every screen (this is what makes the demo memorable)