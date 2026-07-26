import { useEffect, useState } from 'react'
import { Loader2, Wallet } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { getBudget, saveBudget } from '@/services/budgetApi'
import { EXPENSE_CATEGORIES, type Budget, type Expense } from '@/types/budget'

interface BudgetSectionProps {
  tripId: string
  expenses: Expense[]
  onChange: () => void
}

export function BudgetSection({ tripId, expenses, onChange }: BudgetSectionProps) {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalInput, setTotalInput] = useState('')
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    getBudget(tripId)
      .then((existing) => {
        setBudget(existing)
        if (existing) {
          setTotalInput(existing.totalBudget)
          setCategoryInputs(
            Object.fromEntries(
              EXPENSE_CATEGORIES.map((cat) => [cat.value, String(existing.categoryBudgets[cat.value] ?? '')]),
            ),
          )
        }
      })
      .finally(() => setLoading(false))
  }, [tripId])

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const totalBudgetNum = budget ? Number(budget.totalBudget) : 0
  const spentRatio = totalBudgetNum > 0 ? totalSpent / totalBudgetNum : 0

  const health = !budget
    ? null
    : spentRatio >= 1
      ? { label: 'Budget Exceeded', className: 'bg-red-50 text-red-600', bar: 'bg-red-500' }
      : spentRatio >= 0.8
        ? { label: 'Near Budget', className: 'bg-gold/15 text-gold-dark', bar: 'bg-gold' }
        : { label: 'On Track', className: 'bg-sea/10 text-sea', bar: 'bg-sea' }

  const handleSave = async () => {
    setError(null)
    const total = Number(totalInput)
    if (!total || total <= 0) {
      setError('Enter a valid total budget.')
      return
    }
    setSaving(true)
    try {
      const categoryBudgets = Object.fromEntries(
        Object.entries(categoryInputs)
          .filter(([, value]) => value.trim() !== '')
          .map(([key, value]) => [key, Number(value)]),
      )
      const saved = await saveBudget(tripId, total, categoryBudgets)
      setBudget(saved)
      setEditing(false)
      onChange()
    } catch {
      setError('Could not save the budget. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const categoriesWithBudget = budget ? EXPENSE_CATEGORIES.filter((cat) => budget.categoryBudgets[cat.value] != null) : []

  return (
    <div className="rounded-2xl border border-mist p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Wallet className="h-4 w-4 text-ocean" />
          Budget
        </p>
        {budget && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-ocean hover:underline">
            Edit
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : !budget || editing ? (
        <div className="flex flex-col gap-3">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <TextField
            id="totalBudget"
            label="Total budget (₹)"
            type="number"
            value={totalInput}
            onChange={(event) => setTotalInput(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            {EXPENSE_CATEGORIES.map((cat) => (
              <TextField
                key={cat.value}
                id={`cat-${cat.value}`}
                label={`${cat.label} (optional)`}
                type="number"
                value={categoryInputs[cat.value] ?? ''}
                onChange={(event) => setCategoryInputs((prev) => ({ ...prev, [cat.value]: event.target.value }))}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {budget && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 rounded-lg border border-mist py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex flex-[2] items-center justify-center gap-1.5 rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Budget'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-ink">₹{totalSpent.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate">of ₹{totalBudgetNum.toLocaleString('en-IN')} spent</p>
            </div>
            {health && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${health.className}`}>{health.label}</span>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-mist">
            <div
              className={`h-full rounded-full transition-all ${health?.bar ?? 'bg-sea'}`}
              style={{ width: `${Math.min(spentRatio * 100, 100)}%` }}
            />
          </div>
          {categoriesWithBudget.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categoriesWithBudget.map((cat) => {
                const allocated = budget.categoryBudgets[cat.value] ?? 0
                const spent = expenses
                  .filter((expense) => expense.category === cat.value)
                  .reduce((sum, expense) => sum + Number(expense.amount), 0)
                return (
                  <div key={cat.value} className="rounded-xl border border-mist p-3">
                    <p className="text-xs text-slate">{cat.label}</p>
                    <p className="text-sm font-semibold text-ink">
                      ₹{spent.toLocaleString('en-IN')}{' '}
                      <span className="font-normal text-slate">/ ₹{allocated.toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
