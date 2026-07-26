import { Star } from 'lucide-react'
import type { InspirationDestination } from './destinationInspiration'

export function DestinationInspirationCard({
  destination,
}: {
  destination: InspirationDestination
}) {
  const { name, country, rating, days, price, icon: Icon, image, gradient } = destination

  return (
    <div className="relative h-44 w-64 shrink-0 overflow-hidden rounded-2xl shadow-md">
      {image ? (
        <img src={image} alt={name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-ink">
        <Star className="h-3 w-3 fill-gold text-gold" />
        {rating}
      </span>

      <span className="absolute top-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90">
        <Icon className="h-3.5 w-3.5 text-ocean" />
      </span>

      <div className="absolute right-3 bottom-3 left-3 text-white">
        <p className="font-semibold">
          {name}
          {country && <span className="font-normal text-white/70">, {country}</span>}
        </p>
        <p className="text-xs text-white/80">
          {days} days · {price}
        </p>
      </div>
    </div>
  )
}
