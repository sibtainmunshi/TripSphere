import { useEffect, useMemo, useState } from 'react'
import {
  Backpack,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudSun,
  Palette,
  RefreshCw,
  Receipt,
  Sparkles,
  Wallet,
  ArrowRight,
  Loader2,
  MapPin,
  ClipboardList,
} from 'lucide-react'
import type { TripPlanData } from './tripPlanMock'
import { useWeather } from '@/hooks/useWeather'
import { getWeatherIcon } from '@/services/weather'
import { useDestinationGallery } from '@/hooks/useDestinationGallery'
import { NearbyAttractions } from './NearbyAttractions'

interface TripPlanPreviewProps {
  plan: TripPlanData
  onRegenerate: () => void
  onContinue: () => void
  creating?: boolean
  createError?: string | null
}

const HIGHLIGHTS = (plan: TripPlanData) => [
  {
    icon: Wallet,
    label: 'Estimated Budget',
    value: plan.estimatedBudget,
    note: `For ${plan.travelers} travelers`,
  },
  {
    icon: CloudSun,
    label: 'Best Time to Visit',
    value: plan.bestTime,
    note: 'Pleasant weather',
  },
  {
    icon: Clock,
    label: 'Trip Duration',
    value: `${plan.days} Days / ${plan.nights} Nights`,
    note: 'Ideal stay',
  },
  {
    icon: Palette,
    label: 'Travel Style',
    value: plan.travelStyle,
    note: plan.travelStyleNote,
  },
]

const INCLUDED_ITEMS = [
  { icon: ClipboardList, label: 'Suggested Itinerary', note: 'Day by day plan' },
  { icon: Receipt, label: 'Budget Breakdown', note: 'Detailed cost estimate' },
  { icon: MapPin, label: 'Top Attractions', note: 'Must visit places' },
  { icon: Backpack, label: 'Packing Suggestions', note: 'What to pack' },
]

export function TripPlanPreview({ plan, onRegenerate, onContinue, creating, createError }: TripPlanPreviewProps) {
  const { data: weather } = useWeather(plan.lat, plan.lon)
  const WeatherIcon = weather ? getWeatherIcon(weather.code) : CloudSun

  const gallery = useDestinationGallery(plan.destination)
  // The plan's own image first (if it has one), then every other genuine
  // photo Wikipedia has for this place — never a fabricated image just to
  // pad out the count.
  const images = useMemo(() => {
    const galleryUrls = gallery.map((item) => item.url)
    if (!plan.image) return galleryUrls
    return [plan.image, ...galleryUrls.filter((url) => url !== plan.image)]
  }, [plan.image, gallery])

  const [imageIndex, setImageIndex] = useState(0)
  useEffect(() => {
    setImageIndex(0)
  }, [plan.destination])

  const activeImage = images[imageIndex] ?? null
  const hasMultipleImages = images.length > 1

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Sparkles className="h-4 w-4 text-ocean" />
          AI Suggested Trip Plan
        </p>
        <span className="flex items-center gap-1 rounded-full bg-ocean/10 px-2.5 py-1 text-xs font-medium text-ocean">
          <Sparkles className="h-3 w-3" />
          Generated for you
        </span>
      </div>

      <div className="relative h-44 overflow-hidden rounded-2xl">
        {activeImage ? (
          <img src={activeImage} alt={plan.destination} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <span className="absolute top-3 left-3 rounded-full bg-lavender px-2.5 py-1 text-xs font-semibold text-white">
          {plan.tag}
        </span>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute top-1/2 left-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => setImageIndex((i) => (i + 1) % images.length)}
              className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <div className="absolute top-3 right-3 rounded-xl bg-white/90 px-3 py-2 text-right">
          <p className="flex items-center justify-end gap-1 text-[11px] text-slate">
            <Clock className="h-3 w-3" /> Best Time
          </p>
          <p className="text-xs font-semibold text-ink">{plan.bestTime}</p>
          {weather && (
            <>
              <p className="mt-1 flex items-center justify-end gap-1 text-sm font-bold text-ink">
                <WeatherIcon className="h-3.5 w-3.5 text-gold" />
                {weather.temperatureC}°C
              </p>
              <p className="text-[11px] text-slate">{weather.label}</p>
            </>
          )}
        </div>

        <div className="absolute right-3 bottom-3 left-3">
          <p className="text-xl font-bold text-white">
            {plan.destination}
            {plan.country && `, ${plan.country}`}
          </p>
          <p className="mt-0.5 text-xs text-white/80">
            {plan.days} Days · {plan.category} · {plan.budgetTier}
          </p>
        </div>
      </div>

      {hasMultipleImages && (
        <div className="mt-1.5 flex justify-center gap-1.5 py-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Photo ${i + 1} of ${images.length}`}
              onClick={() => setImageIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === imageIndex ? 'w-4 bg-ocean' : 'w-1.5 bg-mist hover:bg-slate/40'}`}
            />
          ))}
        </div>
      )}

      <p className="text-sm text-slate">{plan.description}</p>

      <button
        type="button"
        className="mt-3 flex w-fit items-center gap-1.5 rounded-lg border border-mist bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream"
      >
        View Details
        <ArrowRight className="h-3.5 w-3.5" />
      </button>

      <p className="mt-6 mb-3 text-sm font-semibold text-ink">Trip Highlights</p>
      <div className="grid grid-cols-2 gap-3">
        {HIGHLIGHTS(plan).map((item) => (
          <div key={item.label} className="rounded-xl border border-mist p-3">
            <item.icon className="h-4 w-4 text-ocean" />
            <p className="mt-2 text-xs text-slate">{item.label}</p>
            <p className="text-sm font-bold text-ink">{item.value}</p>
            <p className="text-xs text-slate">{item.note}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 mb-3 text-sm font-semibold text-ink">What&rsquo;s Included</p>
      <div className="grid grid-cols-2 gap-3">
        {INCLUDED_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 rounded-xl border border-mist p-3">
            <item.icon className="h-4 w-4 shrink-0 text-ocean" />
            <div>
              <p className="text-sm font-medium text-ink">{item.label}</p>
              <p className="text-xs text-slate">{item.note}</p>
            </div>
          </div>
        ))}
      </div>

      <NearbyAttractions lat={plan.lat} lon={plan.lon} />

      <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-ocean/5 p-3.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
        <p className="text-xs text-slate">
          You can customize everything in the next step
          <br />
          AI recommendations are fully editable
        </p>
      </div>

      {createError && <p className="mt-4 text-sm text-red-600">{createError}</p>}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={creating}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-mist bg-white py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream disabled:opacity-60"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={creating}
          className="flex flex-[2] items-center justify-center gap-1.5 rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
        >
          {creating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              Looks Good, Continue
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
