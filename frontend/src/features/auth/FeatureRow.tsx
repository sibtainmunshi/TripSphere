import type { LucideIcon } from 'lucide-react'

interface FeatureRowProps {
  icon: LucideIcon
  title: string
  subtitle: string
  iconClassName: string
}

export function FeatureRow({ icon: Icon, title, subtitle, iconClassName }: FeatureRowProps) {
  return (
    <div className="flex items-start gap-3.5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-sm text-white/60">{subtitle}</p>
      </div>
    </div>
  )
}
