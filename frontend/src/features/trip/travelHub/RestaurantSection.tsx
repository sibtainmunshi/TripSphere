import { useEffect, useState } from 'react'
import { Loader2, Trash2, UtensilsCrossed } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { createRestaurant, deleteRestaurant, listRestaurants } from '@/services/travelApi'
import type { RestaurantReservation } from '@/types/travel'
import { SectionShell } from './SectionShell'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const EMPTY_FORM = { restaurantName: '', reservationAt: '', partySize: '', notes: '' }

interface RestaurantSectionProps {
  tripId: string
  onChange: () => void
}

export function RestaurantSection({ tripId, onChange }: RestaurantSectionProps) {
  const [reservations, setReservations] = useState<RestaurantReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    listRestaurants(tripId)
      .then(setReservations)
      .catch(() => setError('Could not load reservations.'))
      .finally(() => setLoading(false))
  }, [tripId])

  const handleAdd = async () => {
    setError(null)
    if (!form.restaurantName.trim() || !form.reservationAt) {
      setError('Restaurant name and reservation time are required.')
      return
    }
    setSaving(true)
    try {
      const created = await createRestaurant({
        trip: tripId,
        restaurantName: form.restaurantName,
        reservationAt: new Date(form.reservationAt).toISOString(),
        partySize: form.partySize ? Number(form.partySize) : undefined,
        notes: form.notes,
      })
      setReservations((prev) => [...prev, created].sort((a, b) => a.reservationAt.localeCompare(b.reservationAt)))
      setForm(EMPTY_FORM)
      setIsAdding(false)
      onChange()
    } catch {
      setError('Could not save this reservation. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this reservation?')) return
    await deleteRestaurant(id)
    setReservations((prev) => prev.filter((r) => r.id !== id))
    onChange()
  }

  return (
    <SectionShell
      icon={UtensilsCrossed}
      title="Restaurant Reservations"
      isAdding={isAdding}
      onToggleAdd={() => setIsAdding((v) => !v)}
    >
      {isAdding && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-mist p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <TextField
            id="restaurantName"
            label="Restaurant name"
            value={form.restaurantName}
            onChange={(e) => setForm((f) => ({ ...f, restaurantName: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="reservationAt"
              label="Reservation time"
              type="datetime-local"
              value={form.reservationAt}
              onChange={(e) => setForm((f) => ({ ...f, reservationAt: e.target.value }))}
            />
            <TextField
              id="partySize"
              label="Party size (optional)"
              type="number"
              min={1}
              value={form.partySize}
              onChange={(e) => setForm((f) => ({ ...f, partySize: e.target.value }))}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Reservation'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : reservations.length === 0 ? (
        <p className="text-sm text-slate">No reservations added yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="flex items-center justify-between rounded-lg border border-mist px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-ink">{reservation.restaurantName}</p>
                <p className="text-xs text-slate">
                  {formatDateTime(reservation.reservationAt)}
                  {reservation.partySize && ` · ${reservation.partySize} people`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(reservation.id)}
                aria-label="Remove reservation"
                className="text-slate hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}
