import { useState } from 'react'
import { Outlet, Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Archive, ArchiveRestore, Bell, CloudSun, MoreHorizontal, Plus, Settings, Share2, Users } from 'lucide-react'
import { useTripStore } from '@/store/tripStore'
import { getTripStatus, STATUS_LABEL, STATUS_BADGE_CLASS, formatDateRange } from '@/utils/tripStatus'
import { useWeather } from '@/hooks/useWeather'
import { useDestinationImage } from '@/hooks/useDestinationImage'
import { getWeatherIcon } from '@/services/weather'
import { getDestinationEmoji } from '@/features/trip/destinationEmoji'
import { Avatar } from '@/components/Avatar'

export function TripWorkspace() {
  const navigate = useNavigate()
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useTripStore((state) => (tripId ? state.getTripById(tripId) : state.currentTrip))
  const hasLoadedTrips = useTripStore((state) => state.hasLoaded)
  const setArchived = useTripStore((state) => state.setArchived)
  const { data: weather } = useWeather(trip?.lat, trip?.lon)
  const heroImage = useDestinationImage(trip?.destination ?? '')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  if (!trip) {
    if (hasLoadedTrips) navigate('/', { replace: true })
    return null
  }

  const WeatherIcon = weather ? getWeatherIcon(weather.code) : CloudSun
  const status = getTripStatus(trip)
  const members = trip.members ?? []
  const visibleMembers = members.slice(0, 4)
  const extraMemberCount = Math.max(0, members.length - visibleMembers.length)
  const isCompleted = status === 'completed'

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-72 overflow-hidden sm:h-80">
        {heroImage ? (
          <motion.img
            src={heroImage}
            alt=""
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ocean to-navy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        <div className="absolute top-5 right-5 flex items-center gap-2">
          <Link
            to={`/trips/${trip.id}/settings`}
            title="Invite people to this trip"
            className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-white"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((open) => !open)
                setMoreOpen(false)
              }}
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink transition-colors hover:bg-white"
            >
              <Bell className="h-4 w-4" />
            </button>
            {notificationsOpen && (
              <div className="absolute top-full right-0 z-20 mt-2 w-64 rounded-xl border border-mist bg-white p-4 text-sm text-slate shadow-lg">
                You&rsquo;re all caught up — no notifications yet.
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMoreOpen((open) => !open)
                setNotificationsOpen(false)
              }}
              aria-label="More options"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink transition-colors hover:bg-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {moreOpen && (
              <div className="absolute top-full right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-mist bg-white shadow-lg">
                <Link
                  to={`/trips/${trip.id}/settings`}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-cream"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Trip Settings
                </Link>
                {isCompleted && (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false)
                      setArchived(trip.id, !trip.archived)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-cream"
                  >
                    {trip.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    {trip.archived ? 'Unarchive trip' : 'Archive trip'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {weather && (
          <div className="absolute top-16 right-5 rounded-xl bg-white/90 px-4 py-3 text-right">
            <p className="flex items-center justify-end gap-1 text-2xl font-bold text-ink">
              <WeatherIcon className="h-5 w-5 text-gold-dark" />
              {weather.temperatureC}°C
            </p>
            <p className="text-xs text-slate">{weather.label}</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-6 pb-6 text-white sm:px-8"
        >
          <h1 className="font-script text-5xl leading-tight font-bold drop-shadow-sm sm:text-6xl">
            {trip.name} {getDestinationEmoji(trip.destination)}
          </h1>
          <p className="mt-1 text-sm text-white/80">
            {formatDateRange(trip.startDate, trip.endDate)} · {trip.destination}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              {visibleMembers.map((member, index) => (
                <div key={member.id} className={index > 0 ? '-ml-2' : ''} style={{ zIndex: visibleMembers.length - index }}>
                  <Avatar name={member.name || member.email} className="h-8 w-8 border-2 border-white text-xs" />
                </div>
              ))}
              {extraMemberCount > 0 && (
                <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-mist text-xs font-semibold text-ink">
                  +{extraMemberCount}
                </div>
              )}
              <Link
                to={`/trips/${trip.id}/settings`}
                title="Invite someone"
                className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white/20 text-white transition-colors hover:bg-white/30"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
              <span className="ml-3 flex items-center gap-1 text-sm text-white/80">
                <Users className="h-3.5 w-3.5" />
                {members.length} member{members.length === 1 ? '' : 's'}
              </span>
            </div>

            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[status]}`}>
              {STATUS_LABEL[status]}
            </span>
          </div>
        </motion.div>
      </div>

      <Outlet />
    </div>
  )
}
