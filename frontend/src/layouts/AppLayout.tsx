import { useEffect } from 'react'
import { Navigate, Outlet, useMatch } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { TripSidebar } from '@/components/TripSidebar'
import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'

export function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const hasLoadedTrips = useTripStore((state) => state.hasLoaded)
  const fetchTrips = useTripStore((state) => state.fetchTrips)
  // /trips/new/ai and /trips/new/manual also match :tripId="new" — those are
  // the creation flows, not a real trip, so they keep the normal app sidebar.
  const tripMatch = useMatch('/trips/:tripId/*')
  const insideTripWorkspace = Boolean(tripMatch) && tripMatch?.params.tripId !== 'new'

  useEffect(() => {
    if (isAuthenticated && !hasLoadedTrips) fetchTrips()
  }, [isAuthenticated, hasLoadedTrips, fetchTrips])

  // Wait for hydrate() to confirm whether a stored token is actually still
  // valid before deciding — the splash screen covers this in the common case.
  if (!hasHydrated) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-white text-ink">
      {insideTripWorkspace ? <TripSidebar /> : <Sidebar />}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
