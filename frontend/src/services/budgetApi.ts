import { api } from './api'
import type { Budget, Expense, Settlement, SettlementStatus } from '@/types/budget'

export async function getBudget(tripId: string): Promise<Budget | null> {
  const { data } = await api.get<Budget[]>('/budgets/', { params: { trip: tripId } })
  return data[0] ?? null
}

export async function saveBudget(
  tripId: string,
  totalBudget: number,
  categoryBudgets: Budget['categoryBudgets'],
): Promise<Budget> {
  // The backend upserts — posting again for the same trip updates the
  // existing budget instead of erroring, so there's no need to check
  // "does one already exist" before saving.
  const { data } = await api.post<Budget>('/budgets/', {
    trip: tripId,
    totalBudget,
    categoryBudgets,
  })
  return data
}

export async function listExpenses(tripId: string): Promise<Expense[]> {
  const { data } = await api.get<Expense[]>('/expenses/', { params: { trip: tripId } })
  return data
}

export async function createExpense(payload: Omit<Expense, 'id' | 'paidByName' | 'createdAt'>): Promise<Expense> {
  const { data } = await api.post<Expense>('/expenses/', payload)
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}/`)
}

export async function listSettlements(tripId: string): Promise<Settlement[]> {
  const { data } = await api.get<Settlement[]>('/settlements/', { params: { trip: tripId } })
  return data
}

export async function updateSettlementStatus(id: string, status: SettlementStatus): Promise<Settlement> {
  const { data } = await api.patch<Settlement>(`/settlements/${id}/`, { status })
  return data
}
