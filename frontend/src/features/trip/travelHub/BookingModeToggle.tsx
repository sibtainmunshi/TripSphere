import { CheckCircle2, Search } from 'lucide-react'

export type BookingMode = 'search' | 'manual'

interface BookingModeToggleProps {
  mode: BookingMode
  onChange: (mode: BookingMode) => void
}

// Two equally first-class paths, not a "search, with manual as a fallback
// when it fails" — some people are booking here for the first time, others
// already booked elsewhere (or don't want to share where, for privacy) and
// just want to log it.
export function BookingModeToggle({ mode, onChange }: BookingModeToggleProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('search')}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
          mode === 'search' ? 'border-ocean bg-ocean/5 text-ocean' : 'border-mist text-slate hover:border-ocean/50'
        }`}
      >
        <Search className="h-3.5 w-3.5" />
        Find a real place
      </button>
      <button
        type="button"
        onClick={() => onChange('manual')}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
          mode === 'manual' ? 'border-ocean bg-ocean/5 text-ocean' : 'border-mist text-slate hover:border-ocean/50'
        }`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        I already booked this
      </button>
    </div>
  )
}
