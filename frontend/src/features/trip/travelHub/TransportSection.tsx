import { useEffect, useState } from 'react'
import { Bus, Car, Loader2, Plane, Trash2, TrainFront } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { createTransport, deleteTransport, listTransport } from '@/services/travelApi'
import type { TransportBooking, TransportMode } from '@/types/travel'
import { SectionShell } from './SectionShell'
import { RoutePlacePicker } from './RoutePlacePicker'
import { BookingModeToggle, type BookingMode } from './BookingModeToggle'

const MODES: { value: TransportMode; label: string; icon: typeof Plane }[] = [
  { value: 'flight', label: 'Flight', icon: Plane },
  { value: 'train', label: 'Train', icon: TrainFront },
  { value: 'bus', label: 'Bus', icon: Bus },
  { value: 'car', label: 'Car', icon: Car },
]

// Only flight/train have a real dataset behind them (real airports / real
// Indian train stations) — bus/car routes stay free text either way.
const REAL_ROUTE_TYPE: Partial<Record<TransportMode, 'airport' | 'station'>> = {
  flight: 'airport',
  train: 'station',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function emptyForm(toLocation = '') {
  return {
    mode: 'flight' as TransportMode,
    operator: '',
    fromLocation: '',
    toLocation,
    departureAt: '',
    arrivalAt: '',
    confirmationNumber: '',
    notes: '',
  }
}

interface TransportSectionProps {
  tripId: string
  destination?: string
  onChange: () => void
}

export function TransportSection({ tripId, destination, onChange }: TransportSectionProps) {
  const [bookings, setBookings] = useState<TransportBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [mode, setMode] = useState<BookingMode>('search')

  useEffect(() => {
    listTransport(tripId)
      .then(setBookings)
      .catch(() => setError('Could not load transport bookings.'))
      .finally(() => setLoading(false))
  }, [tripId])

  const routeType = REAL_ROUTE_TYPE[form.mode]

  const handleToggleAdd = () => {
    setIsAdding((wasAdding) => {
      // Opening fresh — default "To" to the trip's own destination, since
      // that's almost always where transport booked here is heading.
      if (!wasAdding) setForm(emptyForm(destination ?? ''))
      return !wasAdding
    })
  }

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
      setForm(emptyForm())
      setMode('search')
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
    <SectionShell icon={Plane} title="Transport" isAdding={isAdding} onToggleAdd={handleToggleAdd}>
      {isAdding && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-mist p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MODES.map((modeOption) => (
              <button
                key={modeOption.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, mode: modeOption.value }))}
                className={`flex flex-col items-center gap-1 rounded-lg border py-2.5 text-xs font-medium transition-colors ${
                  form.mode === modeOption.value ? 'border-ocean bg-ocean/5 text-ocean' : 'border-mist text-slate'
                }`}
              >
                <modeOption.icon className="h-4 w-4" />
                {modeOption.label}
              </button>
            ))}
          </div>

          {routeType && <BookingModeToggle mode={mode} onChange={setMode} />}

          <TextField
            id="operator"
            label="Operator / flight no. (optional)"
            value={form.operator}
            onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value }))}
          />

          {routeType && mode === 'search' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RoutePlacePicker
                type={routeType}
                label="From"
                value={form.fromLocation}
                onChange={(value) => setForm((f) => ({ ...f, fromLocation: value }))}
              />
              <RoutePlacePicker
                type={routeType}
                label="To"
                value={form.toLocation}
                onChange={(value) => setForm((f) => ({ ...f, toLocation: value }))}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          )}

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
