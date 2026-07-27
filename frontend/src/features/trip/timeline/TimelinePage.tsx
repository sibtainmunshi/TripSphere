import { useParams } from 'react-router-dom'
import { History } from 'lucide-react'
import { useTripStore } from '@/store/tripStore'
import { groupByTripDay } from '../tripDay'
import { formatEventTime, useTimelineEvents } from './useTimelineEvents'

export function TimelinePage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useTripStore((state) => (tripId ? state.getTripById(tripId) : undefined))
  const events = useTimelineEvents(tripId ?? '')

  if (!tripId || !trip) return null

  const dayGroups =
    events === null ? null : groupByTripDay(events, (event) => event.at, trip.startDate).slice().reverse()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-sm font-semibold text-ink">Timeline</p>
        <p className="mt-1 text-xs text-slate">
          Automatically built from bookings, expenses and photos — nothing here is added by hand.
        </p>
      </div>

      {dayGroups === null ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : dayGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-mist p-10 text-center">
          <History className="mx-auto mb-2 h-6 w-6 text-slate" />
          <p className="text-sm text-slate">Nothing to show yet — add a booking, expense or photo.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {dayGroups.map((group) => (
            <div key={group.key}>
              <p className="mb-4 text-xs font-semibold tracking-wide text-slate uppercase">{group.label}</p>
              <div className="flex flex-col gap-5 border-l-2 border-mist pl-5">
                {group.items.map((event) => {
                  const Icon = event.icon
                  return (
                    <div key={event.id} className="relative">
                      <span className="absolute top-0.5 -left-[27px] flex h-6 w-6 items-center justify-center rounded-full bg-cream ring-4 ring-white">
                        <Icon className="h-3.5 w-3.5 text-ocean" />
                      </span>
                      <p className="text-sm font-medium text-ink">{event.label}</p>
                      <p className="mt-0.5 text-xs text-slate">
                        {formatEventTime(event)}
                        {event.detail ? ` · ${event.detail}` : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
