import { useEffect, useState } from 'react'
import { Bus, Car, Loader2, Plane, Trash2, TrainFront } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { createTransport, deleteTransport, listTransport } from '@/services/travelApi'
import type { TransportBooking, TransportMode } from '@/types/travel'
import { SectionShell } from './SectionShell'

const MODES: { value: TransportMode; label: string; icon: typeof Plane }[] = [
  { value: 'flight', label: 'Flight', icon: Plane },
  { value: 'train', label: 'Train', icon: TrainFront },
  { value: 'bus', label: 'Bus', icon: Bus },
  { value: 'car', label: 'Car', icon: Car },
]

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const EMPTY_FORM = {
  mode: 'flight' as TransportMode,
  operator: '',
  fromLocation: '',
  toLocation: '',
  departureAt: '',
  arrivalAt: '',
  confirmationNumber: '',
  notes: '',
}

interface TransportSectionProps {
  tripId: string
  onChange: () => void
}

export function TransportSection({ tripId, onChange }: TransportSectionProps) {
  const [bookings, setBookings] = useState<TransportBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    listTransport(tripId)
      .then(setBookings)
      .catch(() => setError('Could not load transport bookings.'))
      .finally(() => setLoading(false))
  }, [tripId])

  const handleAdd = async () => {
    setError(null)
    if (!form.fromLocation.trim() || !form.toLocation.trim() || !form.departureAt) {
      setError('From, to and departure time are required.')
      return
    }
    setSaving(true)
    try {
      const created = await createTransport({
        trip: tripId,
        ...form,
        departureAt: new Date(form.departureAt).toISOString(),
        arrivalAt: form.arrivalAt ? new Date(form.arrivalAt).toISOString() : undefined,
      })
      setBookings((prev) => [...prev, created].sort((a, b) => a.departureAt.localeCompare(b.departureAt)))
      setForm(EMPTY_FORM)
      setIsAdding(false)
      onChange()
    } catch {
      setError('Could not save this booking. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this transport booking?')) return
    await deleteTransport(id)
    setBookings((prev) => prev.filter((b) => b.id !== id))
    onChange()
  }

  return (
    <SectionShell icon={Plane} title="Transport" isAdding={isAdding} onToggleAdd={() => setIsAdding((v) => !v)}>
      {isAdding && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-mist p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-4 gap-2">
            {MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, mode: mode.value }))}
                className={`flex flex-col items-center gap-1 rounded-lg border py-2.5 text-xs font-medium transition-colors ${
                  form.mode === mode.value ? 'border-ocean bg-ocean/5 text-ocean' : 'border-mist text-slate'
                }`}
              >
                <mode.icon className="h-4 w-4" />
                {mode.label}
              </button>
            ))}
          </div>
          <TextField
            id="operator"
            label="Operator / flight no. (optional)"
            value={form.operator}
            onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="fromLocation"
              label="From"
              value={form.fromLocation}
              onChange={(e) => setForm((f) => ({ ...f, fromLocation: e.target.value }))}
            />
            <TextField
              id="toLocation"
              label="To"
              value={form.toLocation}
              onChange={(e) => setForm((f) => ({ ...f, toLocation: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="departureAt"
              label="Departure"
              type="datetime-local"
              value={form.departureAt}
              onChange={(e) => setForm((f) => ({ ...f, departureAt: e.target.value }))}
            />
            <TextField
              id="arrivalAt"
              label="Arrival (optional)"
              type="datetime-local"
              value={form.arrivalAt}
              onChange={(e) => setForm((f) => ({ ...f, arrivalAt: e.target.value }))}
            />
          </div>
          <TextField
            id="transportConfirmationNumber"
            label="Confirmation / PNR (optional)"
            value={form.confirmationNumber}
            onChange={(e) => setForm((f) => ({ ...f, confirmationNumber: e.target.value }))}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Transport'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-slate">No transport added yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {bookings.map((booking) => {
            const ModeIcon = MODES.find((m) => m.value === booking.mode)?.icon ?? Plane
            return (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border border-mist px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <ModeIcon className="h-4 w-4 text-slate" />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {booking.fromLocation} → {booking.toLocation}
                      {booking.operator && ` · ${booking.operator}`}
                    </p>
                    <p className="text-xs text-slate">
                      {formatDateTime(booking.departureAt)}
                      {booking.confirmationNumber && ` · ${booking.confirmationNumber}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(booking.id)}
                  aria-label="Remove transport booking"
                  className="text-slate hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </SectionShell>
  )
}
