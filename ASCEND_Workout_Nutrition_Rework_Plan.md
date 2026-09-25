# ASCEND — Workout & Nutrition Rework Plan

## Part 1: Workout Tab

### 1.1 Add exercises to a day's session
Current gap: browsing works, nothing connects to an actual session.

- Each exercise card gets an "Add to Today" action (and a date picker for logging a past/future day)
- Adding an exercise creates/updates a `WorkoutSession` for that date and appends a `SetLog` placeholder the user fills in (reps/weight/duration) — this already matches your existing data model, it's a UI/endpoint gap, not a schema gap
- A running "Today's Session" panel (sticky or a drawer) shows what's been added so far, styled as the Quest Log

### 1.2 Exercise stat mapping — rule-based, not random

Seed the **Free Exercise DB** dataset (https://github.com/yuhonas/free-exercise-db) into your `Exercise` model once — it's public domain (Unlicense), no API key, no rate limit, just a JSON file you import. Each entry gives you:

```json
{
  "force": "push | pull | static",
  "level": "beginner | intermediate | expert",
  "mechanic": "compound | isolation",
  "equipment": "barbell | dumbbell | bodyweight | machine | ...",
  "primaryMuscles": ["chest", "triceps"],
  "category": "strength | cardio | stretching | olympic weightlifting | powerlifting | strongman | plyometrics"
}
```

Turn this into deterministic stat rules instead of random numbers:

| Signal | Rule |
|---|---|
| `category = cardio` | High AGI + END weight, minimal STR |
| `category = stretching` | High FLX weight, minimal everything else |
| `category = strength/powerlifting/olympic weightlifting/strongman` | STR-dominant, some END |
| `mechanic = compound` | Higher total stat points than isolation (recruits more muscle, deserves more weight) |
| `mechanic = isolation` | Lower total stat points, concentrated in the primary muscle's mapped stat |
| `force = static` (planks, holds) | Weighted toward VIT (endurance-under-tension) |
| `primaryMuscles` → stat | e.g. legs/back/chest → STR; core → VIT; full-body/cardio machines → AGI/END |

This gives every exercise a **fixed, explainable** stat payout computed once at seed time (or on exercise creation), not generated per-log — same exercise always gives the same stats, which is what "not random" actually requires.

**Custom/user-added exercises:** since they won't come from the dataset, reuse your existing AI infrastructure (same LLM client already wired for NL workout parsing) to classify a new custom exercise against this same rule table — one small LLM call at creation time, not per log.

### 1.3 Training-type suggestions (hypertrophy / strength / functional / etc.)

Two layers, cheap to build on top of what's already seeded:

- **Rule-based rep-range tagging** — tag each exercise with which training goals it suits well, using existing fields: compound + barbell/dumbbell → strength (3–6 rep suggestion) and hypertrophy (8–12 rep suggestion); bodyweight/unilateral/multi-joint → functional strength; isolation → accessory/hypertrophy only. This alone lets you generate "Suggested Hypertrophy Day" / "Suggested Strength Day" template pulls without any AI call.
- **AI-assisted routine suggestion** (already scoped in PRD §5 item 4) — layer an LLM call on top that picks from the tagged pool based on the user's actual logged history and stated goal, for a more personalized version once the rule-based version works.

Build the rule-based version first — it's deterministic, testable, and free to run; add the AI layer after.

---

## Part 2: Nutrition Tab

### 2.1 Food database — USDA FoodData Central
- Free personal API key: https://fdc.nal.usda.gov/api-key-signup.html (instant, no card) — 1,000 req/hour
- Public domain (CC0), no licensing risk
- Search-as-you-type against the Food Search endpoint; Food Details endpoint returns full nutrient profile (macros **and** micros — vitamins, minerals) per 100g for a selected item

### 2.2 Logging flow
1. User searches a food → selects a result
2. App asks for **amount eaten** (grams, or a serving-size unit if the food record provides one)
3. Backend scales the per-100g nutrient values by the entered amount and stores the computed macro/micro breakdown on the `NutritionLog` entry (store the computed values, not just a reference — so historical logs stay accurate even if USDA's record changes later)
4. Replace the flat "+Meal (550k)" placeholder with this real flow; keep quick-add presets as optional shortcuts for genuinely repeated items (pulls from the personal food library already planned)

### 2.3 Reliability / rate-limit handling
- Cache/store any food a user has actually logged in your own DB (which you're doing anyway via the food library) — repeat lookups for common items hit your DB, not the USDA API
- Handle a 429 (rate-limit) response gracefully: fall back to "search your saved foods" rather than erroring the whole log flow

---

## Suggested build order (same phase-by-phase prompting pattern as before)

1. Workout: session-linking (1.1) — closes the biggest usability gap first
2. Workout: rule-based stat engine (1.2) — deterministic, no external dependency, testable in isolation
3. Nutrition: USDA API integration + logging flow (2.1–2.3)
4. Workout: rule-based training-type tagging (1.3, rule-based half)
5. Workout: AI-assisted routine suggestion (1.3, AI half) — pairs naturally with Stage 4/Phase 4 AI work already in the codebase

Each of these is its own PR-sized prompt to Antigravity, same pattern as the readiness plan: point it at this file, name the numbered section, ask it to propose its approach before writing code.
