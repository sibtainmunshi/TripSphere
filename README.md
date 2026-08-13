# TripSphere

A collaborative group-trip planning app — plan a trip with an AI assistant or a manual wizard, then manage it together with your travel group: shared expenses, group chat, bookings, a travel document vault, a photo gallery, a timeline, and spend analytics.

## Features

- **AI Trip Planner** — a Gemini-backed conversational assistant that gathers destination, travel style, group size, and budget, then generates a real itinerary/plan.
- **Manual trip wizard** — a step-by-step form-based alternative to the AI flow.
- **Trip workspace** per trip, with:
  - **Expenses** — shared expense tracking and settlements between members.
  - **Group Chat** — polling-based chat with a WhatsApp-style unread indicator.
  - **Bookings** — flights/trains/buses/cars and stays/restaurants, anchored to real places via OpenStreetMap (Overpass API), not booked for real.
  - **Travel Documents** — a per-trip document vault.
  - **Gallery** — shared trip photos/videos.
  - **Timeline** — a chronological view of trip activity.
  - **Analytics** — spend breakdowns and charts (Plotly).
  - **Trip Replay** — a full-screen slideshow recap of a completed trip.
- Email/Google auth, invite links to join a trip, and in-app notifications.
- Fully responsive — usable on desktop and mobile.

## Tech stack

- **Backend:** Django + Django REST Framework, JWT auth (`djangorestframework-simplejwt`), PostgreSQL in production / SQLite in dev, Cloudinary for media storage, Resend/SMTP for email.
- **Frontend:** React 19 + TypeScript + Vite, Tailwind CSS, Zustand for state, React Router, React Hook Form + Zod, Plotly for charts, Framer Motion/GSAP for animation.
- **AI:** Google Gemini (`gemini-flash-lite-latest`) for the conversational trip planner.

## Project structure

```
backend/            Django project
  api/               Gemini-backed AI planner endpoint, Overpass proxy for real places
  authentication/    Auth (email + Google), JWT
  workspace/         Trips, trip members, invites
  budget/            Expenses & settlements
  chat/              Group chat messages
  travel/            Bookings & travel documents
  gallery/           Trip photo/video gallery
  notifications/     In-app notifications
  analytics/         Spend analytics
  ml/                Trip/budget-related ML models

frontend/            React + Vite app
  src/pages/          Route-level pages (auth, home, trips, trip workspace, ...)
  src/features/       Feature modules, organized by domain (trip/, home/, auth/)
  src/components/     Shared UI components (sidebars, cards, etc.)
  src/store/          Zustand stores
  src/services/       API clients
  src/hooks/          Shared React hooks
```

## Getting started

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
copy .env.example .env         # macOS/Linux: cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Fill in `backend/.env` — see `backend/.env.example` for every variable and what it's for (Cloudinary, Google OAuth, Resend/SMTP, Gemini). Everything has a safe fallback for local dev except `GEMINI_API_KEY`, which is required for the AI planner chat to work (get a free key at [aistudio.google.com](https://aistudio.google.com)).

### Frontend

```bash
cd frontend
npm install
copy .env.example .env         # macOS/Linux: cp .env.example .env
npm run dev
```

The frontend expects the backend at `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api` — see `frontend/.env.example`).

## Deployment

`render.yaml` at the repo root deploys the Django backend + a managed Postgres database to [Render](https://render.com). The frontend is intended to be deployed separately (e.g. Vercel), with `FRONTEND_URL`/`CORS_ALLOWED_ORIGINS` on the backend and `VITE_API_BASE_URL` on the frontend pointed at each other.
