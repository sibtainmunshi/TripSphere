import { Link } from 'react-router-dom'
import { Calendar, IndianRupee, Users } from 'lucide-react'
import type { Trip } from '@/types'
import { getDestinationImage } from '@/features/trip/destinationImagery'
import { formatDateRange, getTripStatus, STATUS_LABEL } from '@/utils/tripStatus'
import { useWeather } from '@/hooks/useWeather'
import { getWeatherIcon } from '@/services/weather'

function pickContinueTrip(trips: Trip[]): Trip | null {
  const active = trips.filter((trip) => !trip.archived && getTripStatus(trip) !== 'completed')
  if (active.length === 0) return null
  const inProgress = active.filter((trip) => getTripStatus(trip) === 'in_progress')
  const pool = inProgress.length > 0 ? inProgress : active
  return [...pool].sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
}

interface ContinuePlanningCardProps {
  trips: Trip[]
}

export function ContinuePlanningCard({ trips }: ContinuePlanningCardProps) {
  const trip = pickContinueTrip(trips)
  // useWeather must run unconditionally (rules of hooks) — trip may be null
  // depending on what's in `trips`, so it's called before the early return.
  const { data: weather } = useWeather(trip?.lat, trip?.lon)
  if (!trip) return null

  const WeatherIcon = weather ? getWeatherIcon(weather.code) : null
  const image = getDestinationImage(trip.destination)
  const memberCount = (trip.members?.length ?? 0) + 1

  return (
    <div className="relative min-h-[260px] overflow-hidden rounded-2xl">
      {image ? (
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ocean to-navy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />

      <div className="relative flex h-full flex-col justify-between p-5 text-white">
        <div>
          <p className="mb-2 text-xs font-medium text-white/70">Continue Planning</p>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold">{trip.name}</h3>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
              {STATUS_LABEL[getTripStatus(trip)]}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/80">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateRange(trip.startDate, trip.endDate)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {memberCount} member{memberCount === 1 ? '' : 's'}
            </span>
            {trip.budget && (
              <span className="flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" />
                {trip.budget.toLocaleString('en-IN')} planned
              </span>
            )}
            {weather && WeatherIcon && (
              <span className="flex items-center gap-1">
                <WeatherIcon className="h-3.5 w-3.5" />
                {weather.temperatureC}°C · {weather.label}
              </span>
            )}
          </div>
        </div>

        <Link
          to={`/trips/${trip.id}`}
          className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-cream"
        >
          Continue Planning →
        </Link>
      </div>
    </div>
  )
}
