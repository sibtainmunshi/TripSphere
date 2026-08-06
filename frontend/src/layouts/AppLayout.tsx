import { useEffect } from 'react'
import { Navigate, Outlet, useMatch } from 'react-router-dom'
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
      {insideTripWorkspace ? <TripSidebar /> : <Sidebar />}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
