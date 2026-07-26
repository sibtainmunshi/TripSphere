import type { Trip, TripStatus } from '@/types'

// Status is always derived from real dates, never stored — a stored value
// would go stale the moment a trip's start/end date passes without anyone
// touching the record.
export function getTripStatus(trip: Trip): TripStatus {
  const today = new Date().toISOString().slice(0, 10)
  if (today < trip.startDate) return 'planning'
  if (today > trip.endDate) return 'completed'
  return 'in_progress'
}

export const STATUS_LABEL: Record<TripStatus, string> = {
  planning: 'Planning',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export const STATUS_BADGE_CLASS: Record<TripStatus, string> = {
  planning: 'bg-gold-dark text-white',
  in_progress: 'bg-ocean text-white',
  completed: 'bg-sea text-white',
}

export function formatDateRange(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const startLabel = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const endLabel = end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startLabel} – ${endLabel}`
}

export function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}
