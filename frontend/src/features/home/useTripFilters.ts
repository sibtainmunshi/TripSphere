import { useMemo, useState } from 'react'
import type { Trip, TripStatus } from '@/types'
import { getTripStatus } from '@/utils/tripStatus'

export type TabKey = 'all' | TripStatus | 'archived'

export const TRIP_TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Trips' },
  { key: 'planning', label: 'Planning' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
]

function matchesSearch(trip: Trip, query: string) {
  if (!query) return true
  const q = query.toLowerCase()
  if (trip.name.toLowerCase().includes(q) || trip.destination.toLowerCase().includes(q)) return true
  return (trip.members ?? []).some(
    (member) => member.email.toLowerCase().includes(q) || member.name?.toLowerCase().includes(q),
  )
}

export function useTripFilters(trips: Trip[]) {
  const [tab, setTab] = useState<TabKey>('all')
  const [query, setQuery] = useState('')

  const archivedTrips = useMemo(() => trips.filter((trip) => trip.archived), [trips])

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = { all: 0, planning: 0, in_progress: 0, completed: 0, archived: 0 }
    for (const trip of trips) {
      if (trip.archived) {
        counts.archived += 1
        continue
      }
      counts.all += 1
      counts[getTripStatus(trip)] += 1
    }
    return counts
  }, [trips])

  const visibleTrips = useMemo(() => {
    return trips
      .filter((trip) =>
        tab === 'archived' ? trip.archived : !trip.archived && (tab === 'all' || getTripStatus(trip) === tab),
      )
      .filter((trip) => matchesSearch(trip, query))
  }, [trips, tab, query])

  return { tab, setTab, query, setQuery, tabCounts, visibleTrips, archivedTrips }
}
