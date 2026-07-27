import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Heart, IndianRupee, MapPin, Sparkles, Users, X } from 'lucide-react'
import { useTripStore } from '@/store/tripStore'
import { useDestinationImage } from '@/hooks/useDestinationImage'
import { getBudget, listExpenses } from '@/services/budgetApi'
import { listMedia } from '@/services/galleryApi'
import { listRestaurants, listStays, listTransport } from '@/services/travelApi'
import { getDestinationEmoji } from '@/features/trip/destinationEmoji'
import { formatDateRange } from '@/utils/tripStatus'
import { Avatar } from '@/components/Avatar'
import type { Budget, Expense } from '@/types/budget'
import type { MediaItem } from '@/types/gallery'
import { AnimatedNumber } from './AnimatedNumber'

interface Slide {
  key: string
  content: ReactNode
}

export function TripReplayPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useTripStore((state) => (tripId ? state.getTripById(tripId) : undefined))
  const heroImage = useDestinationImage(trip?.destination ?? '')
  const [budget, setBudget] = useState<Budget | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [places, setPlaces] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!tripId) return
    Promise.all([
      getBudget(tripId),
      listExpenses(tripId).catch(() => []),
      listMedia(tripId).catch(() => []),
      listStays(tripId).catch(() => []),
      listTransport(tripId).catch(() => []),
      listRestaurants(tripId).catch(() => []),
    ]).then(([budgetRes, expensesRes, mediaRes, stays, transport, restaurants]) => {
      setBudget(budgetRes)
      setExpenses(expensesRes)
      setMedia(mediaRes)
      const placeNames = [
        ...stays.map((s) => s.hotelName),
        ...restaurants.map((r) => r.restaurantName),
        ...transport.map((t) => `${t.fromLocation} → ${t.toLocation}`),
      ]
      setPlaces(Array.from(new Set(placeNames)))
      setLoading(false)
    })
  }, [tripId])

  if (!tripId || !trip) return null

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const totalDays = Math.max(
    1,
    Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86_400_000) + 1,
  )
  const favorites = media.filter((item) => item.isFavorite)
  const highlightPhotos = (favorites.length > 0 ? favorites : media).slice(0, 6)
  const members = trip.members ?? []

  const slides: Slide[] = [
    {
      key: 'intro',
      content: (
        <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-3xl text-center text-white">
          {heroImage ? (
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-ocean to-navy" />
          )}
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative px-6">
            <p className="text-sm tracking-wide text-white/70 uppercase">Trip Replay</p>
            <h1 className="font-script mt-2 text-6xl font-bold">
              {trip.name} {getDestinationEmoji(trip.destination)}
            </h1>
            <p className="mt-3 text-white/80">
              {formatDateRange(trip.startDate, trip.endDate)} · {trip.destination}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'squad',
      content: (
        <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
          <Users className="h-8 w-8 text-ocean" />
          <p className="text-2xl font-semibold text-ink">
            {members.length <= 1 ? 'A solo adventure' : `${members.length} of you made memories together`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col items-center gap-2">
                <Avatar name={member.name || member.email} className="h-14 w-14 text-base" />
                <p className="max-w-[6rem] truncate text-xs text-slate">{member.name || member.email}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'numbers',
      content: (
        <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
          <Sparkles className="h-8 w-8 text-ocean" />
          <p className="text-2xl font-semibold text-ink">By the numbers</p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-4xl font-bold text-ink">
                <AnimatedNumber value={totalDays} />
              </p>
              <p className="mt-1 text-sm text-slate">Days</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-ink">
                <AnimatedNumber value={media.length} />
              </p>
              <p className="mt-1 text-sm text-slate">Photos &amp; Videos</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-ink">
                <AnimatedNumber value={expenses.length} />
              </p>
              <p className="mt-1 text-sm text-slate">Expenses Logged</p>
            </div>
            <div>
              <p className="flex items-center justify-center text-4xl font-bold text-ink">
                <IndianRupee className="h-6 w-6" />
                <AnimatedNumber value={totalSpent} />
              </p>
              <p className="mt-1 text-sm text-slate">
                {budget ? `of ₹${Number(budget.totalBudget).toLocaleString('en-IN')} budgeted` : 'Total Spent'}
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ]

  if (highlightPhotos.length > 0) {
    slides.push({
      key: 'highlights',
      content: (
        <div className="flex h-full flex-col items-center justify-center gap-6">
          <p className="flex items-center gap-1.5 text-2xl font-semibold text-ink">
            <Heart className="h-5 w-5 text-red-500" />
            Highlights
          </p>
          <div className="grid max-w-md grid-cols-3 gap-2">
            {highlightPhotos.map((item) => (
              <div key={item.id} className="aspect-square overflow-hidden rounded-xl bg-cream">
                {item.mediaType === 'video' ? (
                  <video src={item.file} className="h-full w-full object-cover" />
                ) : (
                  <img src={item.file} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    })
  }

  if (places.length > 0) {
    slides.push({
      key: 'places',
      content: (
        <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
          <MapPin className="h-8 w-8 text-ocean" />
          <p className="text-2xl font-semibold text-ink">Places you touched</p>
          <div className="flex max-w-md flex-wrap items-center justify-center gap-2">
            {places.map((place) => (
              <span key={place} className="rounded-full bg-cream px-3.5 py-1.5 text-sm text-ink">
                {place}
              </span>
            ))}
          </div>
        </div>
      ),
    })
  }

  slides.push({
    key: 'thanks',
    content: (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="font-script text-5xl font-bold text-ink">Thanks for the memories</p>
        <p className="text-sm text-slate">This trip lives on in TripSphere — come back to it anytime.</p>
        <Link
          to="/trips/new/manual"
          className="mt-4 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
        >
          Plan Your Next Trip
        </Link>
      </div>
    ),
  })

  const currentSlide = slides[Math.min(index, slides.length - 1)]

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white">
      <div className="flex items-center gap-1.5 px-5 pt-5">
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.key}
            type="button"
            onClick={() => setIndex(slideIndex)}
            aria-label={`Go to slide ${slideIndex + 1}`}
            className="h-1 flex-1 overflow-hidden rounded-full bg-mist"
          >
            <div className={`h-full rounded-full bg-navy transition-all ${slideIndex <= index ? 'w-full' : 'w-0'}`} />
          </button>
        ))}
        <Link to={`/trips/${tripId}`} aria-label="Close" className="ml-3 text-slate hover:text-ink">
          <X className="h-5 w-5" />
        </Link>
      </div>

      <div className="relative flex-1 px-6 py-6">
        {loading ? (
          <p className="flex h-full items-center justify-center text-sm text-slate">Loading…</p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.key}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {currentSlide.content}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className="flex items-center justify-between px-6 pb-6">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="flex items-center gap-1.5 rounded-full border border-mist px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {index < slides.length - 1 && (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
            className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-dark"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
