import { DestinationSuggestionCard } from './DestinationSuggestionCard'
import type { AiTripSummary, DestinationSuggestion } from './mockAiSuggestions'

interface AiSummaryMessageProps {
  summary: AiTripSummary
  onChoose: (destination: DestinationSuggestion) => void
}

export function AiSummaryMessage({ summary, onChoose }: AiSummaryMessageProps) {
  return (
    <div className="flex flex-col gap-3">
      <p>Here&rsquo;s what I&rsquo;d suggest:</p>

      <div className="grid grid-cols-2 gap-2">
        {summary.destinations.map((destination) => (
          <DestinationSuggestionCard
            key={destination.name}
            suggestion={destination}
            onChoose={() => onChoose(destination)}
          />
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
          Suggested itinerary
        </p>
        <ul className="mt-1 space-y-0.5 text-xs text-neutral-600">
          {summary.itinerary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">Weather</p>
        <p className="mt-1 text-xs text-neutral-600">{summary.weather}</p>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
          Pack for this trip
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {summary.packingList.map((item) => (
            <span
              key={item}
              className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-600"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
