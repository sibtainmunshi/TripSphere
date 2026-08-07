# TripSphere — Final Submission & Viva Guide

**One-line pitch:** Planning a group trip today means switching between WhatsApp, Google Maps, a booking site, Splitwise and a photo album. TripSphere is one collaborative workspace that replaces all of that for a single trip — from planning, through the trip, to reliving it afterward.

This document is everything you need for today: the full tech stack and where each piece is actually used, the syllabus-to-code mapping, honest gaps, and exact run instructions.

---

## 1. Tech Stack — what's used, and exactly where

### Frontend
| Tech | Where it's used |
|---|---|
| **React 19 + TypeScript** | Entire `frontend/src` — every page/component |
| **Vite** | Dev server + build tool (`frontend/vite.config.ts`) |
| **Tailwind CSS v4** | All styling, via design tokens in `frontend/src/index.css` (`@theme` block — the "Ocean Luxury" brand palette: navy/ocean/sky/gold/sea/mint/lavender) |
| **Framer Motion** | Page/element animations — splash screen, card entrances, trip replay slideshow |
| **Zustand** | Global state — `store/authStore.ts` (session/user), `store/tripStore.ts` (trips CRUD) |
| **React Router v7** | All routing (`App.tsx`) — auth-gated app shell vs. public auth layout |
| **Axios** | All HTTP calls, centralized in `services/api.ts` (JWT header injection, 401 refresh interceptor) |
| **React Hook Form + Zod** | Login/Signup validation (`features/auth/schemas.ts`) |
| **Lucide React** | All icons, app-wide |
| **react-plotly.js (Plotly)** | Interactive charts — `features/trip/analytics/AnalyticsPage.tsx` |
| **Leaflet** | (Configured for maps; OpenStreetMap tiles — no Google Maps dependency) |

### Backend
| Tech | Where it's used |
|---|---|
| **Python 3 + Django 6 + Django REST Framework** | 11 apps under `backend/`: `authentication`, `api`, `budget`, `chat`, `gallery`, `ml`, `travel`, `workspace`, `analytics`, `notifications`, `config` |
| **djangorestframework-simplejwt** | JWT auth — 60-min access / 7-day refresh with rotation (`config/settings.py` → `SIMPLE_JWT`) |
| **SQLite** (dev) → **PostgreSQL-ready** (`dj-database-url`, `psycopg`) | `config/settings.py` — swaps automatically via `DATABASE_URL` env var for production |
| **Pandas, NumPy, Scikit-Learn, Joblib** | `backend/ml/` — dataset building, model training, live prediction |
| **Google Gemini API** (`gemini-flash-lite-latest`) | `backend/api/views.py` → `ChatPlannerView` — real conversational AI trip planner |
| **OpenStreetMap Overpass API** | `backend/api/views.py` → `NearbyAttractionsView`, `NearbyPlacesView` — real nearby attractions/hotels/restaurants, no Google Maps key needed |
| **Cloudinary** | Media storage config (`django-cloudinary-storage`) — gallery photos/videos, travel documents |
| **google-auth** | Verifies real Google OAuth ID tokens server-side (`GoogleAuthView`) |
| **Resend / SMTP (django-anymail)** | Password-reset emails — falls back to console-print in dev if no key set |

### Frontend-side real external APIs (not Python, but genuinely real — worth mentioning in viva)
- **Open-Meteo** — live weather (`frontend/src/services/weather.ts`)
- **Nominatim (OpenStreetMap)** — geocoding for destination search
- **Wikipedia REST API** — real destination photos/descriptions (`frontend/src/services/wikipedia.ts`)

### Dev tooling
- **oxlint** — linting (`npm run lint`)
- **TypeScript compiler** (`tsc -b`) — type-checking as part of `npm run build`

---

## 2. Architecture

```
Claude-python/
├── frontend/        React + TS + Vite SPA
│   └── src/
│       ├── pages/       route-level components
│       ├── features/    feature-scoped components (trip/, home/, auth/)
│       ├── components/  shared reusable UI (Avatar, Sidebar, etc.)
│       ├── layouts/     AppLayout (authed), AuthLayout (public)
│       ├── store/       Zustand stores
│       ├── services/    axios API clients
│       ├── hooks/       custom hooks (useWeather, useDestinationGallery, etc.)
│       └── types/       shared TS types
└── backend/          Django + DRF REST API (no templates — pure JSON API)
    ├── authentication/  custom User model, JWT, Google login, password reset
    ├── workspace/       Trip, TripMember — creation, invites, role-based access
    ├── budget/          Budget, Expense, Settlement (Splitwise-style split)
    ├── travel/          StayBooking, TransportBooking, RestaurantReservation, TravelDocument
    ├── gallery/         Media (photo/video upload)
    ├── chat/            per-trip group Message (polling-based)
    ├── analytics/        pandas-driven trip statistics
    ├── notifications/   per-trip Notification
    ├── ml/               destinations dataset, trained budget model, prediction API
    ├── api/              Gemini chat planner + OSM Overpass proxy endpoints
    └── config/           settings, root urls
```

**Every feature owns its own models/views/serializers/urls** — no shared "god" app. REST APIs only, JWT-authenticated, role-based checks done server-side (e.g. only the trip owner can invite/remove members — returns a real 403 otherwise).

---

## 3. What's actually real (feature tour)

```
BEFORE THE TRIP
  Signup/Login (JWT, or Google OAuth) 
        ↓
  Home → first trip: "Plan with AI" or "Enter Manually"
        ↓
  AI Planner: live Gemini chat extracts destination/style/travelers/budget
     → real ML-predicted budget range, real Wikipedia photo, real weather,
       real nearby attractions (OSM)
  Manual Wizard: destination search (real geocoding) → members → 
     preferences → review

DURING THE TRIP → Trip Workspace (persistent sidebar, one URL per trip)
    ├─ Overview   — hero, live countdown, weather, checklist
    ├─ Expenses   — add expenses → auto money-split/settlement, ML budget estimate
    ├─ Bookings   — stay/transport/restaurant entries, real nearby places (OSM)
    ├─ Documents  — real file upload/storage
    ├─ Gallery    — real photo/video upload, day-wise albums, lightbox
    ├─ Chat       — real per-trip group chat (polling)
    ├─ Analytics  — live Plotly charts from real pandas aggregation
    └─ Settings   — edit trip, manage members/invites, archive, delete

  Collaboration: owner shares a real invite link → invitee joins via
  /join/:token → real access control (403 for non-owners doing owner actions)

AFTER THE TRIP
  Timeline    — auto-built day-wise recap from real gallery/expense/booking data
  Trip Replay — animated "Spotify Wrapped for travel" recap (Framer Motion,
                not a rendered video)
```

One action cascades correctly across the app — e.g. adding an expense updates the split, the budget bar, *and* the analytics chart, from one write.

---

## 4. Python Syllabus Coverage — unit by unit

*(Independently re-verified today against the actual running code — not just asserted.)*

| Unit | Status | What's real |
|---|---|---|
| **01 — Pandas & EDA** | ✅ | `ml/management/commands/build_destinations_dataset.py` loads a real 110-row Kaggle CSV ("India Travel Destinations by Weather and Budget", CC0), computes `per_day_cost`, derives budget/mid/luxury tiers from **real tercile quantiles** (`.quantile([0.33, 0.66])` → independently recomputed today: 2398 / 3000, matches the hardcoded constants exactly). `analytics/services.py` does real pandas `groupby` over a trip's actual expenses. |
| **02 — Visualization** | ✅ | `AnalyticsPage.tsx` — 3 live Plotly charts (category pie, budget-vs-spent bar, per-member bar), fed by real pandas output, not sample data. |
| **03 — Intro to ML** | ✅ (partial) | `train_budget_model.py` does a genuine `train_test_split(test_size=0.2, random_state=42)`, a `ColumnTransformer` + `Pipeline` (OneHotEncoder + numeric passthrough). **Gap:** no k-fold cross-validation — single hold-out split only. |
| **04 — Regression** | ✅ solid | `RandomForestRegressor(n_estimators=200, max_depth=8)` predicts total budget from destination tier/style/duration/travelers. Evaluated with **MAE** and **R²**. Fitted pipeline saved via `joblib` → `ml/trained_models/budget_model.joblib` (confirmed on disk, 3.85MB, real). Served live at `/api/ml/predict-budget/`. Uncertainty range derived from real per-tree spread of the forest, not a fabricated ±. |
| **05 — Classification** | ⚠️ gap | **No trained classifier exists anywhere** (confirmed by grep — no `KNeighborsClassifier`/`DecisionTreeClassifier`/`RandomForestClassifier`). Destination recommendation (`ml/services.py::recommend_destinations()`) is a hand-written weighted scoring function (cost fit ×0.5 + style match ×0.35 + month fit ×0.15), not a trained model. **Say this if asked: "Regression was built for Unit 04; destination matching is a rule-based ranking algorithm, not a trained classifier — classification wasn't built out separately."** |
| **06 — Deep Learning** | Not built | Pre-flagged as optional in the original plan. No TensorFlow/Keras anywhere. |
| **07 — Web Scraping & APIs** | ✅ solid | Real `requests.post()` calls: **OSM Overpass API** (nearby attractions/hotels/restaurants, custom User-Agent, retry-with-backoff, 24h Django-cache), **Google Gemini API** (JSON-schema-constrained chat). Frontend also does real Nominatim/Open-Meteo/Wikipedia calls (TypeScript, doesn't count toward the Python unit but reinforces the same principle). |
| **08 — Django** | ✅ solid | 11 real Django apps, each with real models + migrations. `manage.py check` → 0 issues. `manage.py showmigrations` → every migration applied, nothing pending. Django Admin now shows every model (`User`, `Trip`, `TripMember`, `Budget`, `Expense`, `Settlement`, `Message`, `Media`, `Notification`, `StayBooking`, `TransportBooking`, `RestaurantReservation`, `TravelDocument`) — registered today. |
| **09 — Models & Users** | ✅ | Custom `User` model (UUID pk, `email` as `USERNAME_FIELD`, `avatar_url`), real register/login/logout, `validate_password` validators. JWT auth means Django's session-CSRF middleware correctly doesn't apply here (token auth is the modern equivalent). |
| **10 — DRF & Backend Services** | ✅ (minor gaps) | Real `ModelSerializer`/`ModelViewSet` throughout, JWT via `simplejwt`, genuine server-side role checks (`trip.owner_id != request.user.id` → real 403). **Gaps:** no `/api/v1/` versioning prefix, no committed Postman collection (endpoints were tested with `curl` during dev). |

### Quick honesty cheat-sheet (if faculty pushes on a gap)
| Asked about... | Say this |
|---|---|
| EDA notebook | "EDA logic exists as pandas code in Django management commands, not a separate notebook." |
| Seaborn charts | "Visualization is Plotly, live in the app, not static Seaborn plots." |
| Cross-validation | "Single train/test split with a fixed seed, no k-fold." |
| Classification model | "Not built as a trained classifier — destination matching is a rule-based scoring function." |
| Deep Learning | "Marked optional in the plan from the start; not built." |
| Postman collection | "Endpoints were tested with curl during development; no committed Postman file." |
| API versioning | "Not versioned (`/api/...` only) — a real gap." |

### What to click through live, in order
1. **Signup/Login** (JWT) → Django Admin (`/admin/`) showing the new real `User` row, plus `Trip`/`Expense`/etc. from earlier usage.
2. **AI Trip Planner chat** → real Gemini call live, plus real nearby-attraction data.
3. **Create a trip → add expenses → Analytics tab** → real pandas groupby → real Plotly charts.
4. **Budget prediction** — trigger it from the Budget tab's ML estimate (`/api/ml/predict-budget/`) → real trained RandomForest, can re-run `train_budget_model` live to show MAE/R² print.
5. **Invite a second member, try removing them as a non-owner** → real 403, role-based access.
6. **Bookings/Overview** → real nearby hotels/restaurants from OSM Overpass.

---

## 5. Known gaps (say these honestly if asked — don't get caught off guard)

- **AI Trip Planner's shown budget/duration is currently rule-based bucketing**, not the trained ML model — the ML model is real and live elsewhere (Budget tab estimate, destination recommendations), just not yet wired into the AI chat's own plan card. Worth mentioning proactively if asked "does the AI planner use your ML model?" — honest answer: "the trained model is live and used in the Budget module; the AI chat's initial estimate is currently a simpler rule, that's the next integration step."
- **No hotel/restaurant/flight-price dataset or model** — only the destinations-tier dataset exists. Hotels/restaurants currently come from live OpenStreetMap lookups (real place names, no pricing data attached).
- A few UI dead-ends exist but don't affect grading: "Continue with Apple" (button renders, not wired — Apple login was never in the product spec), "Save as Draft" on trip-creation screens (no handler yet).
- App-level `/settings` page is a stub (per-trip Settings inside a workspace is fully built and real).
- No automated test suite (`tests.py` files are the default Django stub in every app).

None of these affect the core, real, working demo path above.

---

## 6. How to Run

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ 
- The `backend/venv` virtual environment already exists in this repo with all dependencies installed

### Backend (Django API — port 8000)
```bash
cd backend
./venv/Scripts/python.exe manage.py migrate      # applies any pending migrations
./venv/Scripts/python.exe manage.py runserver 8000
```
Required `backend/.env` (copy from `backend/.env.example` if missing):
```
SECRET_KEY=<any string for dev>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
GOOGLE_CLIENT_ID=<from Google Cloud Console, for Google login>
GEMINI_API_KEY=<from aistudio.google.com — required for the AI planner to respond; without it the chat endpoint returns a 501 instead of faking a reply>
RESEND_API_KEY=<optional — password-reset emails print to console if blank>
```
Cloudinary keys are optional for local dev (falls back to local media storage).

**To re-train the ML model live (for the viva demo):**
```bash
./venv/Scripts/python.exe manage.py train_budget_model
```
Prints the real MAE/R² evaluation to the console.

**To rebuild the destinations dataset from a fresh Kaggle CSV:**
```bash
./venv/Scripts/python.exe manage.py build_destinations_dataset <path-to-kaggle-csv>
```

### Frontend (React — port 5173 by default)
```bash
cd frontend
npm install
npm run dev
```
Required `frontend/.env` (copy from `frontend/.env.example` if missing):
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=<same Google OAuth client ID as backend>
```

**Important — port conflict:** if port `5173` is already in use by another project, Vite may pick a different port, or you can force one: `npm run dev -- --port 5180`. If you do this, the backend's `CORS_ALLOWED_ORIGINS` in `.env` must include that exact origin (e.g. add `http://localhost:5180`) or all API requests will be silently blocked by the browser (you'll see the preflight `OPTIONS` succeed in the Django log but the real request never arrives — that's the tell-tale sign).

### Quick smoke test both are up
```bash
curl http://localhost:8000/api/          # expect 401 (unauthenticated) — server is alive
curl http://localhost:5173/              # expect 200 — Vite is serving
```

### Django Admin (for the demo)
```
http://localhost:8000/admin/
```
Create a superuser first if one doesn't exist: `./venv/Scripts/python.exe manage.py createsuperuser`

---

## 7. Verified today (before submission)

- `manage.py check` → **0 issues**
- `manage.py showmigrations` → **all applied, nothing pending**
- Frontend `tsc -b --noEmit` → **0 type errors**
- Frontend `oxlint` → **0 lint errors**
- Frontend `vite build` → **succeeds** (production bundle builds cleanly)
- Manual trip creation: fixed backend validation gaps (rejecting inverted date ranges, negative budgets, duplicate member emails) — confirmed via direct serializer tests today, both valid and invalid payloads behave correctly
- Django Admin now registers every model, not just `User`
