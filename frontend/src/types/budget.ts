export type ExpenseCategory = 'stay' | 'food' | 'transport' | 'activities' | 'shopping' | 'miscellaneous'

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'stay', label: 'Stay' },
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'activities', label: 'Activities' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
]

export interface Budget {
  id: string
  trip: string
  totalBudget: string
  categoryBudgets: Partial<Record<ExpenseCategory, number>>
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  trip: string
  paidBy: string
  paidByName: string
  amount: string
  category: ExpenseCategory
  description?: string
  date: string
  createdAt: string
}

export type SettlementStatus = 'pending' | 'paid'

export interface Settlement {
  id: string
  trip: string
  fromMemberId: string
  fromMemberName: string
  toMemberId: string
  toMemberName: string
  amount: string
  status: SettlementStatus
  updatedAt: string
}
