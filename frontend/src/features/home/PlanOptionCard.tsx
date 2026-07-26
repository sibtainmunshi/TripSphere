import { Link } from 'react-router-dom'
import { ArrowRight, type LucideIcon } from 'lucide-react'

interface PlanOptionCardProps {
  to: string
  icon: LucideIcon
  title: string
  description: string
  ctaLabel: string
  tint: 'sky' | 'mint'
}

const TINT_STYLES = {
  sky: {
    card: 'bg-sky/15 border-sky/30',
    icon: 'bg-white text-ocean',
    cta: 'bg-ocean text-white hover:bg-ocean-dark',
  },
  mint: {
    card: 'bg-mint/50 border-sea/30',
    icon: 'bg-white text-sea',
    cta: 'bg-sea text-white hover:bg-forest',
  },
}

export function PlanOptionCard({ to, icon: Icon, title, description, ctaLabel, tint }: PlanOptionCardProps) {
  const styles = TINT_STYLES[tint]
  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-3xl border p-8 text-center shadow-lg backdrop-blur-md ${styles.card}`}
    >
      <div className={`flex h-16 w-16 items-center justify-center rounded-full shadow-sm ${styles.icon}`}>
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <p className="text-xl font-bold text-ink">{title}</p>
        <p className="mt-1.5 text-sm text-slate">{description}</p>
      </div>
      <Link
        to={to}
        className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${styles.cta}`}
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
