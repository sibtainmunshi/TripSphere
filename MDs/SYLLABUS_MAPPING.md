# TripSphere — Python Syllabus Coverage (Faculty Demo Notes)

**Purpose:** exact mapping of each Python syllabus unit to real, working code in this repository — for today's demo (final Project Showcase is Aug 1). Every claim below was verified against the actual current codebase, not the original plan document — a few things planned early on were dropped or done differently, and that's called out honestly rather than glossed over.

Stack reminder: `backend/` = Django + Django REST Framework (pure API, no templates), `frontend/` = React. Django Admin is used for real data management. Non-syllabus tools (React, Tailwind, Framer Motion, Zustand, Leaflet, Cloudinary) are the "outside syllabus but allowed" layer — syllabus coverage lives in the Python/Django/ML layers below.

---

## App Workflow — How to Explain It to Faculty

**One-line pitch:** "Planning a group trip today means switching between WhatsApp, Google, a booking site, Maps, Splitwise and a photo album. TripSphere is one collaborative workspace that replaces all of that for a single trip."

The whole app follows a trip's natural lifecycle — **Before → During → After** — and every screen below is real and clickable, not a mockup:

```
BEFORE THE TRIP
  Signup/Login (JWT or Google)
        │
        ▼
  Home
    ├─ First-time user → "Plan with AI" or "Enter Manually"
    └─ Returning user   → dashboard: trip cards, search, status tabs
        │
        ▼
  Trip Creation (either path leads to a real Trip Workspace)
    ├─ AI Planner  → live chat with Gemini, extracts destination/style/
    │                travelers/budget, predicts cost with the trained
    │                regression model, shows a real photo + weather
    └─ Manual Wizard → real place search (OpenStreetMap), add members,
                       preferences, review

DURING THE TRIP  →  Trip Workspace (one URL per trip, persistent sidebar)
    ├─ Overview    — hero, live countdown, weather, progress checklist
    ├─ Expenses    — add expenses, auto money-split/settlement (Splitwise-style)
    ├─ Bookings    — stay/transport/restaurant entries, real nearby places
    ├─ Travel Documents — upload & store real files (tickets, ID proofs)
    ├─ Gallery     — real photo/video upload, day-wise albums
    ├─ Chat        — real per-trip group chat between members
    ├─ Analytics   — live Plotly charts from real expense data
    └─ Settings    — edit trip details, archive, delete

  Collaboration: owner shares a real invite link → invitee joins via
  /join/:token → becomes a real trip member with real access control
  (only the owner can invite/remove members — enforced server-side)

AFTER THE TRIP
  Timeline  — auto-built day-wise recap from real gallery/expense/booking data
  Trip Replay — animated "Spotify Wrapped for travel" recap (stats, photo
                highlights, route) — a signature feature, not a report
```

**Why this matters for the demo:** every arrow in that diagram is a real, working transition — not "this button would eventually do X." Emphasize that one action (e.g. adding an expense) genuinely updates multiple places at once (the split, the budget bar, the analytics chart) — that's the actual product pitch, not just a feature list.

---

## Unit-by-unit breakdown

### Unit 01 — Pandas & EDA

**What's real:** `backend/ml/management/commands/build_destinations_dataset.py` loads a real 110-destination Kaggle CSV (India Travel Destinations by Weather and Budget, CC0 license), computes `per_day_cost` per destination, and derives budget/mid/luxury tier boundaries from the **real tercile quantiles** (`.quantile([0.33, 0.66])`) of that data — not guessed numbers. `backend/analytics/services.py`'s `build_trip_analytics()` does real pandas `groupby` aggregation (by category, by day, by member) over a trip's actual `Expense` rows.

**Honest gap:** there is **no separate Jupyter/EDA notebook** in this repo, and no `dropna`/`duplicates`/correlation-heatmap step — the "EDA" here is expressed as data-pipeline code inside Django management commands and one analytics service function, not a classic notebook walkthrough. If asked "where's the EDA notebook," the honest answer is: the equivalent logic exists as production pandas code, not a notebook.

**Demo it:** show `build_destinations_dataset.py` (real dataset → real quantile-derived tiers), and the live Analytics tab on any trip with expenses (real groupby output rendered as charts).

### Unit 02 — Visualization

**What's real:** `frontend/src/features/trip/analytics/AnalyticsPage.tsx` renders 3 live Plotly charts (`react-plotly.js`) — a pie chart (category spending split) and two bar charts (budget vs spent, per-member contribution) — fed by the real pandas aggregation from Unit 01, not sample data.

**Honest gap:** no Seaborn box-plots/heatmaps/scatter-matrices anywhere (the plan mentioned these for the EDA notebook, which doesn't exist as a notebook). Visualization is 100% Plotly, and it's interactive and in-app rather than a static notebook figure — arguably a stronger demo than a notebook screenshot, but different from what the syllabus table originally described.

**Demo it:** Trip → Analytics tab, live in the browser.

### Unit 03 — Intro to ML

**What's real:** `backend/ml/management/commands/train_budget_model.py` does a genuine `train_test_split(X, y, test_size=0.2, random_state=42)` on the training data, builds a `ColumnTransformer` + `Pipeline` (feature engineering: `OneHotEncoder` on categorical features, numeric features passed through), and evaluates on a real held-out test set.

**Honest gap:** no explicit k-fold cross-validation (`cross_val_score`/`GridSearchCV`) — just one train/test split. If asked, say: "single hold-out split with a fixed random seed for reproducibility; cross-validation wasn't added on top of that."

### Unit 04 — Regression ✅ (solid)

**What's real:** `RandomForestRegressor(n_estimators=200, max_depth=8)` trained in `train_budget_model.py` to predict total trip budget from `destination_tier`, `travel_style`, `duration_days`, `travelers`. Evaluated with **MAE** and **R²** (`mean_absolute_error`, `r2_score`), printed at training time. The fitted pipeline is saved via `joblib` to `backend/ml/trained_models/budget_model.joblib` and served live through `BudgetPredictionView` (`backend/ml/views.py`) at a real DRF endpoint. `backend/ml/services.py`'s `predict_budget()` also derives an honest uncertainty range from the per-tree spread of the forest (not a fabricated ± number).

**Demo it:** AI Trip Planner → budget gets predicted live from the real trained model, not a hardcoded formula. Can also re-run `python manage.py train_budget_model` live to show the MAE/R² printout.

### Unit 05 — Classification ⚠️ (not actually implemented as ML)

**Honest answer:** there is **no trained classifier** anywhere in this codebase — no `KNeighborsClassifier`, `DecisionTreeClassifier`, `RandomForestClassifier`, or `confusion_matrix`, confirmed by grep across the whole backend. The destination-recommendation feature (`recommend_destinations()` in `backend/ml/services.py`) is a **hand-crafted weighted scoring function** (cost fit × 0.5 + style-tag match × 0.35 + month fit × 0.15), not a trained classification model.

**What to say if asked:** "We implemented regression for budget prediction (Unit 04) but destination matching is a rule-based ranking algorithm, not a trained classifier — classification wasn't built out separately." Don't claim otherwise; this is the one unit with a real gap.

### Unit 06 — Deep Learning (optional in the plan)

**Honest answer:** not implemented. No TensorFlow/Keras dependency anywhere in `requirements.txt`. This was always marked "optional / if time permits" in the original plan, so this is an expected, pre-flagged gap, not a surprise.

### Unit 07 — Web Scraping & APIs ✅ (solid)

**What's real:** `backend/api/views.py` makes genuine `requests.post()` calls to two real external APIs:
- **OpenStreetMap Overpass API** (`NearbyAttractionsView`, `NearbyPlacesView`) — real JSON parsing, a required custom `User-Agent` header (proxied server-side specifically because browsers refuse to let client-side `fetch()` set that header), a retry-with-backoff on transient failures, and Django cache-backed response caching (24h) to respect Overpass's usage policy.
- **Google Gemini API** (`ChatPlannerView`) — real HTTPS POST with a JSON schema-constrained response, timeout handling, and error handling for malformed responses.

Also uses real geocoding/weather via the frontend (Nominatim, Open-Meteo) — those are client-side `fetch()` calls in TypeScript, not Python, so they don't count toward this unit, but they're worth mentioning as "the same real-external-API principle applied on the frontend too."

**Demo it:** open the AI Planner chat (hits Gemini live) and the Bookings/Overview pages (real nearby attractions/hotels from Overpass).

### Unit 08 — Django ✅ (solid)

**What's real:** 11 real Django apps (`authentication`, `api`, `budget`, `chat`, `gallery`, `ml`, `travel`, `workspace`, `analytics`, `notifications`, `config`), each with real `models.py`, migrations, and (where relevant) `admin.py` registrations. Custom `User` model with `email` as `USERNAME_FIELD`. `python manage.py showmigrations` shows all migrations applied cleanly; `python manage.py check` reports zero issues.

**Demo it:** Django Admin (`/admin/`) — show real `Trip`, `User`, `Expense`, `TravelDocument` etc. rows created through actual app usage, not seeded fixtures.

### Unit 09 — Models & Users

**What's real:** custom `User` model (UUID pk, `email` as username field, `avatar_url`, `date_joined`), real registration/login/logout flow, `RegisterSerializer` with Django's own `validate_password` validators, SQLite for local dev (`dj_database_url` swaps to real Postgres in production on Render).

**Honest nuance:** CSRF protection specifically isn't relevant here the way the syllabus usually frames it — this is a token-based (JWT) API, not session/cookie-based Django forms, so Django's CSRF middleware doesn't apply to these endpoints (that's the standard, correct pattern for a JWT API, not an oversight). If asked "where's CSRF," explain that JWT auth is the modern alternative to CSRF-protected session forms.

### Unit 10 — DRF & Backend Services

**What's real:** real DRF `serializers.ModelSerializer` and `viewsets.ModelViewSet` usage throughout (e.g. `workspace/views.py`'s `TripViewSet`), JWT via `djangorestframework_simplejwt` (`SIMPLE_JWT` config in `settings.py`: 60-min access token, 7-day refresh, rotation enabled), and genuine **role-based access** — `workspace/views.py` explicitly checks `trip.owner_id != request.user.id` before allowing invite/remove-member actions, returning real 403s for non-owners.

**Honest gaps:** no API versioning prefix (routes are `/api/...`, not `/api/v1/...`), and **no committed Postman collection** in the repo — endpoint testing during development was done with `curl` directly (see commit history), not a checked-in Postman file. If a Postman collection is expected as a deliverable, that would need to be created before Aug 1.

---

## Quick honesty cheat-sheet (say this if a faculty member pushes on gaps)

| If asked about... | Say this |
| --- | --- |
| EDA notebook | "EDA logic exists as pandas code in Django management commands, not a separate notebook." |
| Seaborn charts | "Visualization is Plotly, live in the app, not static Seaborn plots." |
| Cross-validation | "Single train/test split with a fixed seed, no k-fold." |
| Classification model | "Not built as a trained classifier — destination matching is a rule-based scoring function." |
| Deep Learning | "Marked optional in our plan from the start; not built." |
| Postman collection | "Endpoints were tested with curl during development; no committed Postman file yet." |
| API versioning | "Not versioned (`/api/...` only) — a real gap against the original plan." |

## What to actually click through live, in order

1. **Signup/Login** (JWT) → Django Admin showing the new real `User` row (Units 08, 09).
2. **AI Trip Planner chat** → real Gemini call live (Unit 07), destination recommendation (honest: rule-based, Unit 05 gap).
3. **Create a trip, add expenses** → **Analytics tab** → real pandas groupby → real Plotly charts (Units 01, 02).
4. **Budget prediction** in the planner → real RandomForest regression, trained model (Units 03, 04).
5. **Invite a second (test) member, try removing them as a non-owner** → real 403, role-based access (Unit 10).
6. **Bookings/Overview** → real nearby places from OpenStreetMap Overpass (Unit 07 again, different API).
