import { useState } from 'react'
import { Loader2, Receipt, Trash2 } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { createExpense, deleteExpense } from '@/services/budgetApi'
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from '@/types/budget'
import type { TripMember } from '@/types'
import { SectionShell } from '../travelHub/SectionShell'

interface ExpenseSectionProps {
  tripId: string
  members: TripMember[]
  expenses: Expense[]
  loading: boolean
  onChange: () => void
}

const EMPTY_FORM = { paidBy: '', amount: '', category: 'miscellaneous' as ExpenseCategory, description: '', date: '' }

function categoryLabel(category: ExpenseCategory) {
  return EXPENSE_CATEGORIES.find((cat) => cat.value === category)?.label ?? category
}

export function ExpenseSection({ tripId, members, expenses, loading, onChange }: ExpenseSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const handleAdd = async () => {
    setError(null)
    if (!form.paidBy || !form.amount || Number(form.amount) <= 0 || !form.date) {
      setError('Who paid, amount and date are required.')
      return
    }
    setSaving(true)
    try {
      await createExpense({
        trip: tripId,
        paidBy: form.paidBy,
        amount: form.amount,
        category: form.category,
        description: form.description,
        date: form.date,
      })
      setForm(EMPTY_FORM)
      setIsAdding(false)
      onChange()
    } catch {
      setError('Could not save this expense. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this expense?')) return
    await deleteExpense(id)
    onChange()
  }

  return (
    <SectionShell icon={Receipt} title="Expenses" isAdding={isAdding} onToggleAdd={() => setIsAdding((v) => !v)}>
      {isAdding && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-mist p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="paidBy" className="text-sm font-medium text-ink">
              Paid by
            </label>
            <select
              id="paidBy"
              value={form.paidBy}
              onChange={(event) => setForm((f) => ({ ...f, paidBy: event.target.value }))}
              className="w-full rounded-lg border border-mist bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
            >
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.email}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="amount"
              label="Amount (₹)"
              type="number"
              value={form.amount}
              onChange={(event) => setForm((f) => ({ ...f, amount: event.target.value }))}
            />
            <TextField
              id="date"
              label="Date"
              type="date"
              value={form.date}
              onChange={(event) => setForm((f) => ({ ...f, date: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-sm font-medium text-ink">
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(event) => setForm((f) => ({ ...f, category: event.target.value as ExpenseCategory }))}
              className="w-full rounded-lg border border-mist bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <TextField
            id="description"
            label="Description (optional)"
            value={form.description}
            onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Expense'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-slate">No expenses recorded yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between rounded-lg border border-mist px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{expense.description || categoryLabel(expense.category)}</p>
                <p className="text-xs text-slate">
                  {expense.paidByName} · {categoryLabel(expense.category)} ·{' '}
                  {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-ink">₹{Number(expense.amount).toLocaleString('en-IN')}</p>
                <button
                  type="button"
                  onClick={() => handleDelete(expense.id)}
                  aria-label="Remove expense"
                  className="text-slate hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}
