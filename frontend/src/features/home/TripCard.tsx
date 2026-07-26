import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, IndianRupee, MoreHorizontal, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import type { Trip } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'
import { Avatar } from '@/components/Avatar'
import { getTripStatus, STATUS_LABEL, STATUS_BADGE_CLASS, formatDateRange } from '@/utils/tripStatus'
import { useWeather } from '@/hooks/useWeather'
import { useDestinationImage } from '@/hooks/useDestinationImage'
import { getWeatherIcon } from '@/services/weather'

const FALLBACK_GRADIENTS = ['from-ocean to-navy', 'from-sea to-forest', 'from-gold to-gold-dark', 'from-lavender to-lavender-dark']

function gradientFor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return FALLBACK_GRADIENTS[Math.abs(hash) % FALLBACK_GRADIENTS.length]
}

interface TripCardProps {
  trip: Trip
}

export function TripCard({ trip }: TripCardProps) {
  const setArchived = useTripStore((state) => state.setArchived)
  const deleteTrip = useTripStore((state) => state.deleteTrip)
  const currentUser = useAuthStore((state) => state.user)
  const [menuOpen, setMenuOpen] = useState(false)

  const status = getTripStatus(trip)
  const image = useDestinationImage(trip.destination)
  const { data: weather } = useWeather(trip.lat, trip.lon)
  const WeatherIcon = weather ? getWeatherIcon(weather.code) : null
  const owner = { id: 'owner', name: currentUser?.name ?? 'You', imageUrl: currentUser?.avatarUrl }
  const members = [
    owner,
    ...(trip.members ?? []).map((m) => ({ id: m.id, name: m.name ?? m.email, imageUrl: undefined })),
  ]
  const visibleMembers = members.slice(0, 3)
  const overflowCount = members.length - visibleMembers.length

  const handleDelete = () => {
    setMenuOpen(false)
    if (window.confirm(`Delete "${trip.name}"? This can't be undone.`)) {
      deleteTrip(trip.id).catch(() => window.alert('Could not delete this trip. Please try again.'))
    }
  }

  const handleToggleArchive = () => {
    setArchived(trip.id, !trip.archived).catch(() =>
      window.alert('Could not update this trip. Please try again.'),
    )
    setMenuOpen(false)
  }

  return (
    <div className="relative w-72 shrink-0 overflow-hidden rounded-2xl border border-mist bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/trips/${trip.id}`} className="block">
        <div className="relative h-32 w-full overflow-hidden">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${gradientFor(trip.id)}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <span
            className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>
          {weather && WeatherIcon && (
            <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-ink">
              <WeatherIcon className="h-3.5 w-3.5 text-gold-dark" />
              {weather.temperatureC}°C
            </span>
          )}
        </div>
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate shadow hover:text-ink"
          aria-label="Trip options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute top-10 right-3 z-10 w-44 overflow-hidden rounded-lg border border-mist bg-white shadow-lg">
            {status === 'completed' && (
              <button
                type="button"
                onClick={handleToggleArchive}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-cream"
              >
                {trip.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                {trip.archived ? 'Unarchive' : 'Archive'}
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      <Link to={`/trips/${trip.id}`} className="block p-4 pt-3">
        <p className="truncate font-semibold text-ink">{trip.name}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate">
          <Calendar className="h-3.5 w-3.5" />
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-2">
            {visibleMembers.map((member) => (
              <Avatar
                key={member.id}
                name={member.name}
                imageUrl={member.imageUrl}
                className="h-7 w-7 border-2 border-white text-xs"
              />
            ))}
            {overflowCount > 0 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-mist text-xs font-semibold text-slate">
                +{overflowCount}
              </div>
            )}
          </div>
          {trip.budget && (
            <span className="flex items-center gap-1 text-xs font-medium text-slate">
              <IndianRupee className="h-3 w-3" />
              {trip.budget.toLocaleString('en-IN')} planned
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
