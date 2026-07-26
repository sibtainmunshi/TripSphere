import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, UserPlus, type LucideIcon } from 'lucide-react'
import type { Trip } from '@/types'
import { formatRelativeTime } from '@/utils/tripStatus'

interface ActivityEvent {
  id: string
  icon: LucideIcon
  text: ReactNode
  at: string
}

// Only two event kinds exist right now because those are the only things the
// app can genuinely observe — no Gallery/Budget/Travel Hub/real-invite
// subsystems are built yet, so this deliberately does not fabricate the kind
// of activity (photo uploads, expenses, bookings) shown in the reference.
function buildEvents(trips: Trip[]): ActivityEvent[] {
  const events: ActivityEvent[] = []
  for (const trip of trips) {
    events.push({
      id: `${trip.id}-created`,
      icon: PlusCircle,
      text: (
        <>
          You created{' '}
          <Link to={`/trips/${trip.id}`} className="font-medium text-ocean hover:underline">
            {trip.name}
          </Link>
        </>
      ),
      at: trip.createdAt,
    })
    for (const member of trip.members ?? []) {
      events.push({
        id: `${trip.id}-invite-${member.id}`,
        icon: UserPlus,
        text: (
          <>
            You invited <span className="font-medium text-ink">{member.email}</span> to{' '}
            <Link to={`/trips/${trip.id}`} className="font-medium text-ocean hover:underline">
              {trip.name}
            </Link>
          </>
        ),
        at: trip.createdAt,
      })
    }
  }
  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6)
}

interface RecentActivityProps {
  trips: Trip[]
}

export function RecentActivity({ trips }: RecentActivityProps) {
  const events = buildEvents(trips)

  return (
    <div className="rounded-2xl border border-mist p-5">
      <p className="mb-4 text-sm font-semibold text-ink">Recent Activity</p>
      {events.length === 0 ? (
        <p className="text-sm text-slate">Nothing yet — activity shows up here as you create trips and invite people.</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean/10 text-ocean">
                <event.icon className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1 text-ink">
                {event.text}
                <span className="mt-0.5 block text-xs text-slate">{formatRelativeTime(event.at)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
