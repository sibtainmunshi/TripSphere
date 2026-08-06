import { Link } from 'react-router-dom'
import { ArrowRight, type LucideIcon } from 'lucide-react'

interface PlanOptionCardProps {
  to: string
  image: string
  /** Tailwind object-position class for the background photo's focal point. */
  imagePosition?: string
  icon: LucideIcon
  iconClassName: string
  title: string
  description: string
  ctaLabel: string
  ctaClassName: string
  /** Controls text color to stay legible against the photo behind it. */
  tone: 'dark' | 'light'
}

export function PlanOptionCard({
  to,
  image,
  imagePosition = 'object-center',
  icon: Icon,
  iconClassName,
  title,
  description,
  ctaLabel,
  ctaClassName,
  tone,
}: PlanOptionCardProps) {
  const titleColor = tone === 'dark' ? 'text-white' : 'text-ink'
  const descriptionColor = tone === 'dark' ? 'text-white/80' : 'text-ink/70'
  const scrim =
    tone === 'dark'
      ? 'bg-gradient-to-b from-black/5 via-black/15 to-black/55'
      : 'bg-gradient-to-b from-black/0 via-white/5 to-black/25'

  return (
    <Link
      to={to}
      className="group relative flex aspect-square flex-col items-center overflow-hidden rounded-3xl shadow-[0_20px_45px_-15px_rgba(8,28,45,0.45),0_0_36px_-6px_rgba(99,197,234,0.35)] transition-transform duration-300 hover:-translate-y-1.5"
    >
      <img src={image} alt="" className={`absolute inset-0 h-full w-full scale-105 object-cover ${imagePosition}`} />
      <div className={`absolute inset-0 ${scrim}`} />

      <div
        className={`relative mt-8 flex h-14 w-14 items-center justify-center rounded-full shadow-md backdrop-blur-sm ${iconClassName}`}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div className="relative mt-4 px-7 text-center">
        <p className={`text-xl font-bold drop-shadow-sm ${titleColor}`}>{title}</p>
        <p className={`mt-1.5 text-sm ${descriptionColor}`}>{description}</p>
      </div>

      <span
        className={`relative mt-auto mb-7 flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold shadow-md transition-colors ${ctaClassName}`}
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}
