import { Wallet, CloudSun } from 'lucide-react'
import type { DestinationSuggestion } from './mockAiSuggestions'

interface DestinationSuggestionCardProps {
  suggestion: DestinationSuggestion
  onChoose: () => void
}

export function DestinationSuggestionCard({
  suggestion,
  onChoose,
}: DestinationSuggestionCardProps) {
  return (
    <div className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-28 overflow-hidden">
        <img
          src={suggestion.image}
          alt={suggestion.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
        <p className="absolute bottom-2 left-3 text-sm font-semibold text-white drop-shadow-sm">
          {suggestion.name}
        </p>
      </div>
      <div className="p-3.5">
        <p className="text-xs leading-relaxed text-neutral-500">{suggestion.blurb}</p>
        <div className="mt-2.5 flex flex-col gap-1.5 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> {suggestion.estimatedBudget}
          </span>
          <span className="flex items-center gap-1.5">
            <CloudSun className="h-3.5 w-3.5" /> {suggestion.bestTime}
          </span>
        </div>
        <button
          onClick={onChoose}
          className="mt-3 w-full rounded-lg bg-brand py-2 text-xs font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Choose {suggestion.name}
        </button>
      </div>
    </div>
  )
}
