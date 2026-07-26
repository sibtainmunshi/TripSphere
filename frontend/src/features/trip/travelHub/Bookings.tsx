import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BookingTimeline } from './BookingTimeline'
import { StaySection } from './StaySection'
import { TransportSection } from './TransportSection'
import { RestaurantSection } from './RestaurantSection'

export function Bookings() {
  const { tripId } = useParams<{ tripId: string }>()
  const [refreshKey, setRefreshKey] = useState(0)

  if (!tripId) return null

  const bumpRefresh = () => setRefreshKey((key) => key + 1)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-8">
      <div>
        <p className="text-sm font-semibold text-ink">Bookings</p>
        <p className="mt-1 text-xs text-slate">
          Organize bookings made elsewhere — not a booking engine, just one place to keep track of everything.
        </p>
      </div>

      <BookingTimeline tripId={tripId} refreshKey={refreshKey} />
      <StaySection tripId={tripId} onChange={bumpRefresh} />
      <TransportSection tripId={tripId} onChange={bumpRefresh} />
      <RestaurantSection tripId={tripId} onChange={bumpRefresh} />
    </div>
  )
}
