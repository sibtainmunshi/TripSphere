import { Calendar, Compass, FileText, IndianRupee, Tag, Users } from 'lucide-react'
import type { TripMember } from '@/types'

interface ReviewCreateStepProps {
  name: string
  destination: string
  startDate: string
  endDate: string
  tripType: string
  description: string
  members: TripMember[]
  budget: string
  notes: string
  onEditStep: (step: number) => void
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ReviewCreateStep({
  name,
  destination,
  startDate,
  endDate,
  tripType,
  description,
  members,
  budget,
  notes,
  onEditStep,
}: ReviewCreateStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-ink">Review &amp; Create</p>
        <p className="mt-1 text-xs text-slate">Double-check everything, then create your workspace.</p>
      </div>

      <div className="rounded-xl border border-mist p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Trip Details</p>
          <button type="button" onClick={() => onEditStep(1)} className="text-xs font-medium text-ocean hover:underline">
            Edit
          </button>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="flex items-center gap-2 text-ink">
            <Tag className="h-4 w-4 text-slate" /> {name || 'Untitled trip'}
          </p>
          <p className="flex items-center gap-2 text-ink">
            <Compass className="h-4 w-4 text-slate" /> {destination || 'No destination set'}
          </p>
          <p className="flex items-center gap-2 text-ink">
            <Calendar className="h-4 w-4 text-slate" /> {formatDate(startDate)} → {formatDate(endDate)}
          </p>
          {tripType && (
            <p className="flex items-center gap-2 text-ink">
              <FileText className="h-4 w-4 text-slate" /> {tripType}
            </p>
          )}
          {description && <p className="text-slate">{description}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-mist p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Members</p>
          <button type="button" onClick={() => onEditStep(2)} className="text-xs font-medium text-ocean hover:underline">
            Edit
          </button>
        </div>
        {members.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-slate">
            <Users className="h-4 w-4" /> Just you for now — invite others anytime from the workspace.
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-ink">
            <Users className="h-4 w-4 text-slate" /> You + {members.length} invited
          </p>
        )}
      </div>

      <div className="rounded-xl border border-mist p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Preferences</p>
          <button type="button" onClick={() => onEditStep(3)} className="text-xs font-medium text-ocean hover:underline">
            Edit
          </button>
        </div>
        <p className="flex items-center gap-2 text-sm text-ink">
          <IndianRupee className="h-4 w-4 text-slate" /> {budget ? `₹${budget}` : 'Not set'}
        </p>
        {notes && <p className="mt-2 text-sm text-slate">{notes}</p>}
      </div>
    </div>
  )
}
