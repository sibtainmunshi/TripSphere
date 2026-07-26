import { useEffect, useState } from 'react'
import { Bus, Car, LogIn, LogOut, Plane, TrainFront, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { listRestaurants, listStays, listTransport } from '@/services/travelApi'
import type { TransportMode } from '@/types/travel'

export interface BookingEvent {
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

export function formatEventTime(event: BookingEvent) {
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

// Shared by BookingTimeline (Bookings page) and the Overview dashboard's
// "Upcoming" widget — one merge of Stay/Transport/Restaurant data into a
// single chronological list, not two separate implementations.
export function useBookingEvents(tripId: string, refreshKey = 0) {
  const [events, setEvents] = useState<BookingEvent[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([listStays(tripId), listTransport(tripId), listRestaurants(tripId)]).then(
      ([stays, transport, restaurants]) => {
        if (cancelled) return
        const merged: BookingEvent[] = []
        for (const stay of stays) {
          merged.push({
            id: `${stay.id}-in`,
            at: stay.checkIn,
            dateOnly: true,
            icon: LogIn,
            label: `Check in — ${stay.hotelName}`,
            detail: 'Stay',
          })
          merged.push({
            id: `${stay.id}-out`,
            at: stay.checkOut,
            dateOnly: true,
            icon: LogOut,
            label: `Check out — ${stay.hotelName}`,
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
        merged.sort((a, b) => a.at.localeCompare(b.at))
        setEvents(merged)
      },
    )
    return () => {
      cancelled = true
    }
  }, [tripId, refreshKey])

  return events
}
