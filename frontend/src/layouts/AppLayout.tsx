import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useMatch } from 'react-router-dom'
import { Menu } from 'lucide-react'
import logo from '@/assets/logo.png'
import { Sidebar } from '@/components/Sidebar'
import { TripSidebar } from '@/components/TripSidebar'
import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'

export function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const trips = useTripStore((state) => state.trips)
  const hasLoadedTrips = useTripStore((state) => state.hasLoaded)
  const fetchTrips = useTripStore((state) => state.fetchTrips)
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // /trips/new/ai and /trips/new/manual also match :tripId="new" — those are
  // the creation flows, not a real trip, so they keep the normal app sidebar.
  const tripMatch = useMatch('/trips/:tripId/*')
  const insideTripWorkspace = Boolean(tripMatch) && tripMatch?.params.tripId !== 'new'
  // A brand-new account landing on Home with zero trips gets the full-screen
  // "create your first journey" takeover — same idea as Replay: an immersive
  // moment, not another page inside the usual sidebar chrome.
  const isHomeRoute = Boolean(useMatch('/'))
  const isFirstJourneyTakeover = isHomeRoute && hasLoadedTrips && trips.length === 0

  useEffect(() => {
    if (isAuthenticated && !hasLoadedTrips) fetchTrips()
  }, [isAuthenticated, hasLoadedTrips, fetchTrips])

  // Route changes (including in-page tab/module switches) close the mobile
  // drawer automatically as a fallback — the sidebar links already call
  // onClose directly, this just covers any navigation that doesn't.
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  // Wait for hydrate() to confirm whether a stored token is actually still
  // valid before deciding — the splash screen covers this in the common case.
  if (!hasHydrated) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (isFirstJourneyTakeover) {
    return (
      <div className="h-screen overflow-y-auto">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white text-ink">
      {/* Mobile-only top bar — the persistent sidebar rail below only shows
          at lg: and up, so narrow screens need their own way in. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-mist bg-white px-4 lg:hidden">
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-cream"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img src={logo} alt="TripSphere" className="h-7 w-7" />
        <span className="w-9" aria-hidden="true" />
      </div>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {insideTripWorkspace ? (
        <TripSidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      ) : (
        <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      )}

      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
