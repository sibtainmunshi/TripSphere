import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface QuickActionButtonProps {
  icon: LucideIcon
  label: string
  to: string
}

export function QuickActionButton({ icon: Icon, label, to }: QuickActionButtonProps) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-xl border border-mist px-3 py-4 text-xs font-medium text-ink transition-colors hover:border-ocean hover:text-ocean"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  )
}
