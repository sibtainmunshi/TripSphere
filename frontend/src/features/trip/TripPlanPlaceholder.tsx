import { Backpack, Calendar, CloudSun, DollarSign, MapPin, Sparkles } from 'lucide-react'

const UPCOMING_ITEMS = [
  {
    icon: MapPin,
    label: 'Suggested Destinations',
    note: 'Top places picked just for you',
    iconClassName: 'bg-mint text-sea',
  },
  {
    icon: Calendar,
    label: 'Smart Itinerary',
    note: 'Day by day plan with experiences',
    iconClassName: 'bg-sky/25 text-ocean',
  },
  {
    icon: DollarSign,
    label: 'Budget Estimate',
    note: 'Clear breakdown & cost overview',
    iconClassName: 'bg-gold/25 text-gold-dark',
  },
  {
    icon: CloudSun,
    label: 'Weather Preview',
    note: 'Best time & what to expect',
    iconClassName: 'bg-lavender/25 text-lavender-dark',
  },
  {
    icon: Backpack,
    label: 'Packing Suggestions',
    note: 'What to pack for your trip',
    iconClassName: 'bg-gold/25 text-gold-dark',
  },
]

export function TripPlanPlaceholder() {
  return (
    <div className="relative h-full overflow-hidden bg-white">
      <div className="relative flex h-full flex-col p-6">
        <p className="flex items-center gap-1.5 text-lg font-bold text-ink">
          Your journey will come alive here
          <Sparkles className="h-4 w-4 text-sky" />
        </p>
        <p className="mt-1.5 max-w-[15rem] text-sm text-slate">
          As we chat, I&rsquo;ll create a personalized trip plan just for you.
        </p>

        <div className="mt-6 flex max-w-xs flex-col gap-3">
          {UPCOMING_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl bg-white/95 p-3 shadow-sm">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.iconClassName}`}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="text-xs text-slate">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
