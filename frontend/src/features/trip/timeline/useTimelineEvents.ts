import { useEffect, useState } from 'react'
import {
  Bus,
  Camera,
  Car,
  LogIn,
  LogOut,
  Plane,
  TrainFront,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { listRestaurants, listStays, listTransport } from '@/services/travelApi'
import { listExpenses } from '@/services/budgetApi'
import { listMedia } from '@/services/galleryApi'
import type { TransportMode } from '@/types/travel'

export interface TimelineEvent {
  id: string
  at: string
  dateOnly: boolean
  icon: LucideIcon
  label: string
  detail: string
}

const TRANSPORT_ICONS: Record<TransportMode, LucideIcon> = {
  flight: Plane,
  train: TrainFront,
  bus: Bus,
  car: Car,
}

export function formatEventTime(event: TimelineEvent) {
  const date = new Date(event.at)
  if (event.dateOnly) {
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// The Memory Timeline — a real, automatically generated activity feed, never
// manually created (per the PRD). Merges Bookings, Expenses and Gallery
// uploads into one chronological list, the same "merge several real sources"
// approach as travelHub/useBookingEvents, just with a wider set of sources.
export function useTimelineEvents(tripId: string, refreshKey = 0) {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      listStays(tripId),
      listTransport(tripId),
      listRestaurants(tripId),
      listExpenses(tripId),
      listMedia(tripId),
    ]).then(([stays, transport, restaurants, expenses, media]) => {
      if (cancelled) return
      const merged: TimelineEvent[] = []

      for (const stay of stays) {
        merged.push({
          id: `${stay.id}-in`,
          at: stay.checkIn,
          dateOnly: true,
          icon: LogIn,
          label: `Checked in — ${stay.hotelName}`,
          detail: 'Stay',
        })
        merged.push({
          id: `${stay.id}-out`,
          at: stay.checkOut,
          dateOnly: true,
          icon: LogOut,
          label: `Checked out — ${stay.hotelName}`,
          detail: 'Stay',
        })
      }
      for (const booking of transport) {
        merged.push({
          id: booking.id,
          at: booking.departureAt,
          dateOnly: false,
          icon: TRANSPORT_ICONS[booking.mode],
          label: `${booking.fromLocation} → ${booking.toLocation}`,
          detail: booking.operator || booking.mode,
        })
      }
      for (const reservation of restaurants) {
        merged.push({
          id: reservation.id,
          at: reservation.reservationAt,
          dateOnly: false,
          icon: UtensilsCrossed,
          label: reservation.restaurantName,
          detail: 'Dinner reservation',
        })
      }
      for (const expense of expenses) {
        merged.push({
          id: expense.id,
          at: expense.date,
          dateOnly: true,
          icon: Wallet,
          label: expense.description || expense.category,
          detail: `₹${Number(expense.amount).toLocaleString('en-IN')} · paid by ${expense.paidByName}`,
        })
      }
      for (const item of media) {
        merged.push({
          id: item.id,
          at: item.createdAt,
          dateOnly: false,
          icon: Camera,
          label: `${item.uploaderName} added a ${item.mediaType}`,
          detail: item.caption || '',
        })
      }

      merged.sort((a, b) => a.at.localeCompare(b.at))
      setEvents(merged)
    })
    return () => {
      cancelled = true
    }
  }, [tripId, refreshKey])

  return events
}
