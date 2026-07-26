import { Sparkles } from 'lucide-react'

export function TripPlanPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ocean/10">
        <Sparkles className="h-6 w-6 text-ocean" />
      </div>
      <p className="font-semibold text-ink">Your AI trip plan will appear here</p>
      <p className="max-w-xs text-sm text-slate">
        Answer a couple of questions in the chat and I&rsquo;ll put together a suggested plan.
      </p>
    </div>
  )
}
