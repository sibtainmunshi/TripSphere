import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, MapPin, Plus, Search, Sparkles } from 'lucide-react'
import heroImage from '@/assets/login-bg.jpg'
import { useTripStore } from '@/store/tripStore'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/Avatar'
import { TripCard } from './TripCard'
import { RecentActivity } from './RecentActivity'
import { ContinuePlanningCard } from './ContinuePlanningCard'
import { useTripFilters, TRIP_TABS } from './useTripFilters'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function HomeDashboard() {
  const trips = useTripStore((state) => state.trips)
  const user = useAuthStore((state) => state.user)
  const { tab, setTab, query, setQuery, tabCounts, visibleTrips, archivedTrips } = useTripFilters(trips)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <div className="min-h-full bg-white">
      <div className="relative overflow-hidden">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/75 via-navy/45 to-navy/85" />

        <div className="relative px-6 pt-8 pb-10 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="text-white">
              <h1 className="text-2xl font-bold drop-shadow-sm sm:text-3xl">
                {getGreeting()}, {user?.name ?? 'there'} 👋
              </h1>
              <p className="mt-1 text-white/80">Ready for your next adventure?</p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/trips/new/ai"
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy shadow transition-colors hover:bg-cream"
              >
                <Sparkles className="h-4 w-4 text-ocean" />
                AI Planner
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((open) => !open)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
                  aria-label="Notifications"
                >
                  <Bell className="h-4.5 w-4.5" />
                </button>
                {notificationsOpen && (
                  <div className="absolute top-full right-0 z-20 mt-2 w-64 rounded-lg border border-mist bg-white p-4 text-sm text-slate shadow-lg">
                    You&rsquo;re all caught up — no notifications yet.
                  </div>
                )}
              </div>

              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full bg-white/15 py-1.5 pr-3.5 pl-1.5 text-white backdrop-blur transition-colors hover:bg-white/25"
              >
                <Avatar name={user?.name ?? 'You'} imageUrl={user?.avatarUrl} className="h-7 w-7 text-xs" />
                <span className="text-sm font-medium">{user?.name ?? 'You'}</span>
              </Link>
            </div>
          </div>

          <div className="relative mt-8 max-w-xl">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search trips, destinations, members..."
              className="w-full rounded-xl border-none bg-white/95 py-3 pr-4 pl-11 text-sm text-ink outline-none placeholder:text-slate/70 focus:ring-2 focus:ring-white"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Your Trips</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TRIP_TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    tab === item.key ? 'bg-navy text-white' : 'text-slate hover:bg-cream'
                  }`}
                >
                  {item.label} <span className="opacity-70">({tabCounts[item.key]})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setCreateMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark"
            >
              <Plus className="h-4 w-4" />
              Create New Trip
            </button>
            {createMenuOpen && (
              <div className="absolute top-full right-0 z-10 mt-1 w-56 overflow-hidden rounded-lg border border-mist bg-white shadow-lg">
                <Link to="/trips/new/ai" className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-cream">
                  <Sparkles className="h-4 w-4 text-ocean" />
                  Plan with AI
                </Link>
                <Link
                  to="/trips/new/manual"
                  className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-cream"
                >
                  <MapPin className="h-4 w-4 text-sea" />
                  Enter Manually
                </Link>
              </div>
            )}
          </div>
        </div>

        {visibleTrips.length === 0 ? (
          <p className="rounded-xl border border-dashed border-mist py-10 text-center text-sm text-slate">
            {query ? 'No trips match your search.' : 'Nothing here yet.'}
          </p>
        ) : (
          <div className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
            {visibleTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <RecentActivity trips={trips} />
          <ContinuePlanningCard trips={trips} />
        </div>

        {archivedTrips.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Archived Memories</h2>
              <button
                type="button"
                onClick={() => setTab('archived')}
                className="text-sm font-medium text-ocean hover:underline"
              >
                View all archived trips →
              </button>
            </div>
            <div className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
              {archivedTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
