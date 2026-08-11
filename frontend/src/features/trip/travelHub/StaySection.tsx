import { useEffect, useState } from 'react'
import { BedDouble, Loader2, Trash2 } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { createStay, deleteStay, listStays } from '@/services/travelApi'
import type { StayBooking } from '@/types/travel'
import { SectionShell } from './SectionShell'
import { PlacePicker } from './PlacePicker'
import { BookingModeToggle, type BookingMode } from './BookingModeToggle'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const EMPTY_FORM = { hotelName: '', address: '', checkIn: '', checkOut: '', confirmationNumber: '', notes: '' }

interface StaySectionProps {
  tripId: string
  lat?: number
  lon?: number
  onChange: () => void
}

export function StaySection({ tripId, lat, lon, onChange }: StaySectionProps) {
  const [stays, setStays] = useState<StayBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [mode, setMode] = useState<BookingMode>('search')

  useEffect(() => {
    listStays(tripId)
      .then(setStays)
      .catch(() => setError('Could not load stays.'))
      .finally(() => setLoading(false))
  }, [tripId])

  const handleAdd = async () => {
    setError(null)
    if (!form.hotelName.trim() || !form.checkIn || !form.checkOut) {
      setError('Hotel name, check-in and check-out are required.')
      return
    }
    if (form.checkOut < form.checkIn) {
      setError('Check-out must be after check-in.')
      return
    }
    setSaving(true)
    try {
      const created = await createStay({ trip: tripId, ...form })
      setStays((prev) => [...prev, created].sort((a, b) => a.checkIn.localeCompare(b.checkIn)))
      setForm(EMPTY_FORM)
      setMode('search')
      setIsAdding(false)
      onChange()
    } catch {
      setError('Could not save this stay. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this stay?')) return
    await deleteStay(id)
    setStays((prev) => prev.filter((s) => s.id !== id))
    onChange()
  }

  return (
    <SectionShell icon={BedDouble} title="Stay" isAdding={isAdding} onToggleAdd={() => setIsAdding((v) => !v)}>
      {isAdding && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-mist p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <BookingModeToggle mode={mode} onChange={setMode} />
          {mode === 'search' ? (
            <PlacePicker
              type="hotel"
              label="Hotel name"
              lat={lat}
              lon={lon}
              name={form.hotelName}
              onChange={(hotelName, address) => setForm((f) => ({ ...f, hotelName, address: address ?? '' }))}
            />
          ) : (
            <>
              <TextField
                id="hotelName"
                label="Hotel name"
                value={form.hotelName}
                onChange={(e) => setForm((f) => ({ ...f, hotelName: e.target.value }))}
              />
              <TextField
                id="address"
                label="Address (optional)"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              id="checkIn"
              label="Check-in"
              type="date"
              value={form.checkIn}
              onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))}
            />
            <TextField
              id="checkOut"
              label="Check-out"
              type="date"
              value={form.checkOut}
              onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))}
            />
          </div>
          <TextField
            id="confirmationNumber"
            label="Confirmation number (optional)"
            value={form.confirmationNumber}
            onChange={(e) => setForm((f) => ({ ...f, confirmationNumber: e.target.value }))}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Stay'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : stays.length === 0 ? (
        <p className="text-sm text-slate">No stays added yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {stays.map((stay) => (
            <div key={stay.id} className="flex items-center justify-between rounded-lg border border-mist px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{stay.hotelName}</p>
                {stay.address && <p className="text-xs text-slate">{stay.address}</p>}
                <p className="text-xs text-slate">
                  {formatDate(stay.checkIn)} → {formatDate(stay.checkOut)}
                  {stay.confirmationNumber && ` · ${stay.confirmationNumber}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(stay.id)}
                aria-label="Remove stay"
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
