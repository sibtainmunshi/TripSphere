import { Calendar } from 'lucide-react'
import { formatEventTime, useBookingEvents } from './useBookingEvents'

interface BookingTimelineProps {
  tripId: string
  refreshKey: number
}

export function BookingTimeline({ tripId, refreshKey }: BookingTimelineProps) {
  const events = useBookingEvents(tripId, refreshKey)

  if (events === null) return null

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-mist p-6 text-center text-sm text-slate">
        Add a stay, transport booking or reservation to see your trip timeline here.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-mist p-5">
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
        <Calendar className="h-4 w-4 text-ocean" />
        Booking Timeline
      </p>
      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean/10 text-ocean">
              <event.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{event.label}</p>
              <p className="text-xs text-slate">
                {formatEventTime(event)} · {event.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
