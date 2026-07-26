import { IndianRupee } from 'lucide-react'
import { TextField } from '@/components/TextField'

interface PreferencesStepProps {
  budget: string
  notes: string
  onChange: (patch: { budget?: string; notes?: string }) => void
}

export function PreferencesStep({ budget, notes, onChange }: PreferencesStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-semibold text-ink">Preferences</p>
        <p className="mt-1 text-xs text-slate">
          Totally optional — skip ahead if you&rsquo;d rather decide these later.
        </p>
      </div>

      <TextField
        label="Estimated Budget (Optional)"
        id="budget"
        type="number"
        min={0}
        placeholder="e.g. 25000"
        startIcon={<IndianRupee className="h-4 w-4" />}
        value={budget}
        onChange={(event) => onChange({ budget: event.target.value })}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Anything specific in mind? (Optional)</label>
        <textarea
          value={notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          placeholder="Must-visit places, dietary needs, pace of the trip..."
          rows={4}
          className="w-full resize-none rounded-lg border border-mist px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-slate/60 focus:border-ocean focus:ring-1 focus:ring-ocean"
        />
      </div>
    </div>
  )
}
