import type { ReactNode } from 'react'
import { Plus, X, type LucideIcon } from 'lucide-react'

interface SectionShellProps {
  icon: LucideIcon
  title: string
  isAdding: boolean
  onToggleAdd: () => void
  children: ReactNode
}

export function SectionShell({ icon: Icon, title, isAdding, onToggleAdd, children }: SectionShellProps) {
  return (
    <div className="rounded-2xl border border-mist p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon className="h-4 w-4 text-ocean" />
          {title}
        </p>
        <button
          type="button"
          onClick={onToggleAdd}
          className="flex items-center gap-1 rounded-lg border border-mist px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-cream"
        >
          {isAdding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isAdding ? 'Cancel' : 'Add'}
        </button>
      </div>
      {children}
    </div>
  )
}
