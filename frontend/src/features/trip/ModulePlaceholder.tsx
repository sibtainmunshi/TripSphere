import type { LucideIcon } from 'lucide-react'

interface ModulePlaceholderProps {
  icon: LucideIcon
  title: string
  description: string
  milestone: string
}

export function ModulePlaceholder({ icon: Icon, title, description, milestone }: ModulePlaceholderProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ocean/10 text-ocean">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-lg font-semibold text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-slate">{description}</p>
      <span className="mt-4 rounded-full bg-cream px-3 py-1 text-xs font-medium text-slate">
        Coming in {milestone}
      </span>
    </div>
  )
}
