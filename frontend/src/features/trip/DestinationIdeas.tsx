import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { recommendDestinations } from '@/services/mlApi'
import { searchDestinations } from '@/services/destinationSearch'
import type { DestinationSuggestion, TravelStyle } from '@/types/ml'

const TRAVEL_STYLES: { value: TravelStyle; label: string }[] = [
  { value: 'backpacking', label: 'Backpacking' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'luxury', label: 'Luxury' },
]

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface DestinationIdeasProps {
  onPick: (destination: string, coords?: { lat: number; lon: number }) => void
}

export function DestinationIdeas({ onPick }: DestinationIdeasProps) {
  const [open, setOpen] = useState(false)
  const [budgetPerDay, setBudgetPerDay] = useState('3000')
  const [style, setStyle] = useState<TravelStyle>('relaxed')
  const [month, setMonth] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DestinationSuggestion[] | null>(null)
  const [picking, setPicking] = useState<string | null>(null)

  const handlePick = async (name: string) => {
    setPicking(name)
    try {
      // Same reasoning as the quick-picks in DestinationSearchField — a
      // suggestion should get real coordinates too, so the resulting trip
      // still shows real weather, not just a name.
      const [place] = await searchDestinations(name)
      onPick(name, place ? { lat: place.lat, lon: place.lon } : undefined)
    } catch {
      onPick(name)
    } finally {
      setPicking(null)
    }
  }

  const handleSearch = async () => {
    const budget = Number(budgetPerDay)
    if (!budget || budget <= 0) return
    setLoading(true)
    try {
      const data = await recommendDestinations(budget, style, month || undefined)
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 self-start text-xs font-medium text-ocean hover:underline"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Not sure where to go? Get ideas
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-mist bg-cream p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Sparkles className="h-3.5 w-3.5 text-ocean" />
        Destination Ideas
      </p>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate">Budget/day (₹)</label>
          <input
            type="number"
            value={budgetPerDay}
            onChange={(event) => setBudgetPerDay(event.target.value)}
            className="rounded-lg border border-mist bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-ocean"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate">Style</label>
          <select
            value={style}
            onChange={(event) => setStyle(event.target.value as TravelStyle)}
            className="rounded-lg border border-mist bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-ocean"
          >
            {TRAVEL_STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate">Month (optional)</label>
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-lg border border-mist bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-ocean"
          >
            <option value="">Any</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSearch}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-navy py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Show me ideas'}
      </button>

      {results && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {results.map((suggestion) => (
            <button
              key={suggestion.name}
              type="button"
              onClick={() => handlePick(suggestion.name)}
              disabled={picking === suggestion.name}
              className="flex flex-col items-start gap-0.5 rounded-lg border border-mist bg-white p-2.5 text-left transition-colors hover:border-ocean disabled:opacity-60"
            >
              <span className="text-sm font-medium text-ink">{suggestion.name}</span>
              <span className="text-xs text-slate">
                {picking === suggestion.name
                  ? 'Selecting…'
                  : `~₹${suggestion.avgDailyCost.toLocaleString('en-IN')}/day`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
