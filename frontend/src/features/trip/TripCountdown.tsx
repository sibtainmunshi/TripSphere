import { useCountdown } from '@/hooks/useCountdown'

interface TripCountdownProps {
  startDate: string
}

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Min' },
  { key: 'seconds', label: 'Sec' },
] as const

// Real, live countdown to the trip's actual start date — not a fabricated
// number. Hidden once the date has passed rather than showing a countdown
// to nothing.
export function TripCountdown({ startDate }: TripCountdownProps) {
  const countdown = useCountdown(startDate)

  if (countdown.isPast) return null

  return (
    <div className="rounded-2xl border border-mist p-5">
      <p className="text-sm font-semibold text-ink">Trip Countdown</p>
      <p className="mt-1 text-xs text-slate">The countdown is on!</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {UNITS.map((unit) => (
          <div key={unit.key} className="rounded-xl bg-cream py-3 text-center">
            <p className="text-xl font-bold text-ink">{String(countdown[unit.key]).padStart(2, '0')}</p>
            <p className="text-[11px] text-slate">{unit.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
