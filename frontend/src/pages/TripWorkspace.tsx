import { useEffect } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, CloudSun, Users } from 'lucide-react'
import { useTripStore } from '@/store/tripStore'
import { getTripStatus, STATUS_LABEL } from '@/utils/tripStatus'
import { useWeather } from '@/hooks/useWeather'
import { useDestinationImage } from '@/hooks/useDestinationImage'
import { getWeatherIcon } from '@/services/weather'

export function TripWorkspace() {
  const navigate = useNavigate()
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useTripStore((state) => (tripId ? state.getTripById(tripId) : state.currentTrip))
  const hasLoadedTrips = useTripStore((state) => state.hasLoaded)
  const { data: weather } = useWeather(trip?.lat, trip?.lon)
  const heroImage = useDestinationImage(trip?.destination ?? '')

  useEffect(() => {
    // Don't bounce home just because the trip isn't in the store yet — on a
    // hard reload, trips are still being fetched from the backend at this
    // point. Only redirect once the fetch has actually finished and the
    // trip genuinely isn't there.
    if (!trip && hasLoadedTrips) navigate('/', { replace: true })
  }, [trip, hasLoadedTrips, navigate])

  if (!trip) return null
  const WeatherIcon = weather ? getWeatherIcon(weather.code) : CloudSun

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-64 overflow-hidden sm:h-72">
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-6 pb-6 text-white"
        >
          <span className="inline-flex w-fit items-center rounded-full bg-ocean px-3 py-1 text-xs font-medium text-white">
            {STATUS_LABEL[getTripStatus(trip)]}
          </span>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight drop-shadow-sm">{trip.destination}</h1>
          <p className="mt-1 text-white/70">{trip.name}</p>

          <div className="mt-4 flex flex-wrap gap-5 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {trip.memberCount} traveler{trip.memberCount === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1.5">
              <WeatherIcon className="h-4 w-4" />
              {weather ? `${weather.temperatureC}°C · ${weather.label}` : 'Weather unavailable'}
            </span>
          </div>
        </motion.div>
      </div>

      <Outlet />
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
