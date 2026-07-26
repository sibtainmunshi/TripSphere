import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTripStore } from '@/store/tripStore'
import { listExpenses } from '@/services/budgetApi'
import type { Expense } from '@/types/budget'
import { BudgetSection } from './BudgetSection'
import { ExpenseSection } from './ExpenseSection'
import { SettlementSection } from './SettlementSection'

export function ExpensesPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useTripStore((state) => (tripId ? state.getTripById(tripId) : undefined))
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!tripId) return
    setLoadingExpenses(true)
    listExpenses(tripId)
      .then(setExpenses)
      .finally(() => setLoadingExpenses(false))
  }, [tripId, refreshKey])

  if (!tripId) return null

  const bumpRefresh = () => setRefreshKey((key) => key + 1)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-8">
      <div>
        <p className="text-sm font-semibold text-ink">Budget &amp; Expenses</p>
        <p className="mt-1 text-xs text-slate">Track spending by category, and see who owes whom.</p>
      </div>

      <BudgetSection tripId={tripId} expenses={expenses} onChange={bumpRefresh} />
      <ExpenseSection
        tripId={tripId}
        members={trip?.members ?? []}
        expenses={expenses}
        loading={loadingExpenses}
        onChange={bumpRefresh}
      />
      <SettlementSection tripId={tripId} refreshKey={refreshKey} />
    </div>
  )
}
