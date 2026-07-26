import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Archive, ArchiveRestore, IndianRupee, Loader2, Trash2 } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { useTripStore } from '@/store/tripStore'
import { getTripStatus } from '@/utils/tripStatus'

export function TripSettings() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const trip = useTripStore((state) => (tripId ? state.getTripById(tripId) : undefined))
  const updateTrip = useTripStore((state) => state.updateTrip)
  const setArchived = useTripStore((state) => state.setArchived)
  const deleteTrip = useTripStore((state) => state.deleteTrip)

  const [form, setForm] = useState(() => ({
    name: trip?.name ?? '',
    destination: trip?.destination ?? '',
    startDate: trip?.startDate ?? '',
    endDate: trip?.endDate ?? '',
    description: trip?.description ?? '',
    budget: trip?.budget != null ? String(trip.budget) : '',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (!trip || !tripId) return null

  const handleSave = async () => {
    setError(null)
    setSaved(false)
    if (!form.name.trim() || !form.destination.trim() || !form.startDate || !form.endDate) {
      setError('Name, destination and dates are required.')
      return
    }
    if (form.endDate < form.startDate) {
      setError('End date must be after start date.')
      return
    }
    setSaving(true)
    try {
      await updateTrip(tripId, {
        name: form.name,
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description,
        budget: form.budget ? Number(form.budget) : undefined,
      })
      setSaved(true)
    } catch {
      setError('Could not save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveToggle = async () => {
    await setArchived(tripId, !trip.archived)
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${trip.name}"? This can't be undone.`)) return
    await deleteTrip(tripId)
    navigate('/', { replace: true })
  }

  const isCompleted = getTripStatus(trip) === 'completed'

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-sm font-semibold text-ink">Trip Settings</p>
        <p className="mt-1 text-xs text-slate">Update your trip&rsquo;s details, or archive/delete it.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-mist p-5">
        {error && <p className="text-xs text-red-600">{error}</p>}
        {saved && <p className="text-xs text-sea">Saved.</p>}

        <TextField
          id="settingsName"
          label="Trip name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <TextField
          id="settingsDestination"
          label="Destination"
          value={form.destination}
          onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            id="settingsStartDate"
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
          <TextField
            id="settingsEndDate"
            label="End date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
          />
        </div>
        <TextField
          id="settingsBudget"
          label="Budget (optional)"
          type="number"
          min={0}
          startIcon={<IndianRupee className="h-4 w-4" />}
          value={form.budget}
          onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full resize-none rounded-lg border border-mist px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-slate/60 focus:border-ocean focus:ring-1 focus:ring-ocean"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-mist p-5">
        <p className="text-sm font-semibold text-ink">Danger Zone</p>

        {isCompleted && (
          <button
            type="button"
            onClick={handleArchiveToggle}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-mist py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream"
          >
            {trip.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {trip.archived ? 'Unarchive this trip' : 'Archive this trip'}
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete this trip
        </button>
      </div>
    </div>
  )
}
