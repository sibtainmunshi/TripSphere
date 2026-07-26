import type { LucideIcon } from 'lucide-react'

interface QuickReplyChipProps {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
}

export function QuickReplyChip({ label, icon: Icon, onClick, disabled }: QuickReplyChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-full border border-mist bg-white px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-ocean hover:bg-ocean/5 disabled:pointer-events-none disabled:opacity-50"
    >
      <Icon className="h-3.5 w-3.5 text-ocean" />
      {label}
    </button>
  )
}
