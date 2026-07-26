import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Plus, Search, Sparkles } from 'lucide-react'
import { useTripStore } from '@/store/tripStore'
import { TripCard } from '@/features/home/TripCard'
import { useTripFilters, TRIP_TABS } from '@/features/home/useTripFilters'

export function Trips() {
  const trips = useTripStore((state) => state.trips)
  const { tab, setTab, query, setQuery, tabCounts, visibleTrips } = useTripFilters(trips)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Your Trips</h1>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark"
          >
            <Plus className="h-4 w-4" />
            Create New Trip
          </button>

          {menuOpen && (
            <div className="absolute top-full right-0 z-10 mt-1 w-56 overflow-hidden rounded-lg border border-mist bg-white shadow-lg">
              <Link
                to="/trips/new/ai"
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-cream"
              >
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

      {trips.length === 0 ? (
        <p className="rounded-xl border border-dashed border-mist py-10 text-center text-sm text-slate">
          No trips yet — create your first one to see it here.
        </p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1.5">
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

            <div className="relative w-full max-w-xs sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search trips, destinations..."
                className="w-full rounded-lg border border-mist bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none placeholder:text-slate/60 focus:border-ocean focus:ring-1 focus:ring-ocean"
              />
            </div>
          </div>

          {visibleTrips.length === 0 ? (
            <p className="rounded-xl border border-dashed border-mist py-10 text-center text-sm text-slate">
              {query ? 'No trips match your search.' : 'Nothing here yet.'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {visibleTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
