import { useEffect, useState } from 'react'
import { Check, HandCoins, Loader2 } from 'lucide-react'
import { listSettlements, updateSettlementStatus } from '@/services/budgetApi'
import type { Settlement } from '@/types/budget'

interface SettlementSectionProps {
  tripId: string
  refreshKey: number
}

export function SettlementSection({ tripId, refreshKey }: SettlementSectionProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listSettlements(tripId)
      .then(setSettlements)
      .finally(() => setLoading(false))
  }, [tripId, refreshKey])

  const handleTogglePaid = async (settlement: Settlement) => {
    setUpdatingId(settlement.id)
    try {
      const updated = await updateSettlementStatus(settlement.id, settlement.status === 'paid' ? 'pending' : 'paid')
      setSettlements((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="rounded-2xl border border-mist p-5">
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
        <HandCoins className="h-4 w-4 text-ocean" />
        Settle Up
      </p>
      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : settlements.length === 0 ? (
        <p className="text-sm text-slate">Everyone&rsquo;s settled up — no one owes anything right now.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {settlements.map((settlement) => (
            <div
              key={settlement.id}
              className="flex items-center justify-between rounded-lg border border-mist px-4 py-3"
            >
              <p className="text-sm text-ink">
                <span className="font-medium">{settlement.fromMemberName}</span> owes{' '}
                <span className="font-medium">{settlement.toMemberName}</span>{' '}
                <span className="font-semibold">₹{Number(settlement.amount).toLocaleString('en-IN')}</span>
              </p>
              <button
                type="button"
                onClick={() => handleTogglePaid(settlement)}
                disabled={updatingId === settlement.id}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  settlement.status === 'paid' ? 'bg-sea/10 text-sea' : 'border border-mist text-ink hover:bg-cream'
                }`}
              >
                {updatingId === settlement.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : settlement.status === 'paid' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {settlement.status === 'paid' ? 'Paid' : 'Mark as Paid'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
