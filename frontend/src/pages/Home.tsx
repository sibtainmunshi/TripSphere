import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'
import { FirstTimeHome } from '@/features/home/FirstTimeHome'
import { HomeDashboard } from '@/features/home/HomeDashboard'

export function Home() {
  const user = useAuthStore((state) => state.user)
  const trips = useTripStore((state) => state.trips)
  const hasLoaded = useTripStore((state) => state.hasLoaded)

  // Wait for the real fetch to land before deciding — otherwise a returning
  // user with real trips would flash the "create your first trip" empty
  // state for a moment while trips are still in flight.
  if (!hasLoaded) return null

  if (trips.length === 0) return <FirstTimeHome name={user?.name ?? 'there'} avatarUrl={user?.avatarUrl} />

  return <HomeDashboard />
}
