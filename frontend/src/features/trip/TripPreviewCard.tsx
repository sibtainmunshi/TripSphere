import { useState } from 'react'
import { Calendar, Camera, Clock, Compass, Sparkles, Users, Wallet } from 'lucide-react'
import { useDestinationImage } from '@/hooks/useDestinationImage'

interface TripPreviewCardProps {
  name: string
  destination: string
  startDate: string
  endDate: string
  tripType: string
  memberCount: number
  budget: string
}

function formatDate(iso: string) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function durationLabel(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000)
  if (nights <= 0) return null
  return `${nights + 1} Days / ${nights} Nights`
}

export function TripPreviewCard({
  name,
  destination,
  startDate,
  endDate,
  tripType,
  memberCount,
  budget,
}: TripPreviewCardProps) {
  const [showComingSoon, setShowComingSoon] = useState(false)
  const image = useDestinationImage(destination)
  const start = formatDate(startDate)
  const end = formatDate(endDate)
  const duration = durationLabel(startDate, endDate)

  return (
    <div className="rounded-2xl border border-mist bg-white p-5">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Sparkles className="h-4 w-4 text-ocean" />
        Trip Preview
      </p>
      <p className="mb-4 text-xs text-slate">Here&rsquo;s a preview of your trip</p>

      <div className="relative h-52 overflow-hidden rounded-xl">
        {image ? (
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ocean to-navy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <span className="absolute top-3 left-3 rounded-full bg-sea px-2.5 py-1 text-xs font-semibold text-white">
          Planning
        </span>

        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={() => {
              setShowComingSoon(true)
              setTimeout(() => setShowComingSoon(false), 2000)
            }}
            className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/60"
          >
            <Camera className="h-3.5 w-3.5" />
            {showComingSoon ? 'Coming soon' : 'Change Image'}
          </button>
        </div>

        <div className="absolute right-3 bottom-3 left-3">
          <p className="truncate text-xl font-bold text-white">{name || 'Trip Name'}</p>
          <p className="flex items-center gap-1 text-sm text-white/80">
            <Compass className="h-3.5 w-3.5" />
            {destination || 'Destination'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white">
              <Calendar className="h-3 w-3" />
              {start && end ? `${start} — ${end}` : 'Start Date — End Date'}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white">
              <Users className="h-3 w-3" />
              {memberCount} Member{memberCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-5 mb-2 text-sm font-semibold text-ink">Trip Summary</p>
      <div className="flex flex-col gap-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate">
            <Clock className="h-4 w-4" /> Duration
          </span>
          <span className="font-medium text-ink">{duration ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate">
            <Compass className="h-4 w-4" /> Trip Type
          </span>
          <span className="font-medium text-ink">{tripType || '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate">
            <Users className="h-4 w-4" /> Members
          </span>
          <span className="font-medium text-ink">{memberCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate">
            <Wallet className="h-4 w-4" /> Budget
          </span>
          <span className="font-medium text-ink">{budget ? `₹${budget}` : 'Not set'}</span>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-ocean/5 p-3">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ocean" />
        <p className="text-xs text-slate">You can always edit these details later from your trip workspace settings.</p>
      </div>
    </div>
  )
}
