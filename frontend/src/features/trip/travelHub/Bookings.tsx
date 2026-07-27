import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTripStore } from '@/store/tripStore'
import { BookingTimeline } from './BookingTimeline'
import { StaySection } from './StaySection'
import { TransportSection } from './TransportSection'
import { RestaurantSection } from './RestaurantSection'

export function Bookings() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useTripStore((state) => (tripId ? state.getTripById(tripId) : undefined))
  const [refreshKey, setRefreshKey] = useState(0)

  if (!tripId) return null

  const bumpRefresh = () => setRefreshKey((key) => key + 1)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-8">
      <div>
        <p className="text-sm font-semibold text-ink">Bookings</p>
        <p className="mt-1 text-xs text-slate">
          Pick real hotels and restaurants near your destination, or add your own — tracked here, not booked for
          real.
        </p>
      </div>

      <BookingTimeline tripId={tripId} refreshKey={refreshKey} />
      <StaySection tripId={tripId} lat={trip?.lat} lon={trip?.lon} onChange={bumpRefresh} />
      <TransportSection tripId={tripId} destination={trip?.destination} onChange={bumpRefresh} />
      <RestaurantSection tripId={tripId} lat={trip?.lat} lon={trip?.lon} onChange={bumpRefresh} />
    </div>
  )
}
