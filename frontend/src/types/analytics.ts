export interface CategoryBreakdownItem {
  category: string
  amount: number
}

export interface DailySpendingItem {
  date: string
  amount: number
}

export interface MemberContributionItem {
  memberId: string
  memberName: string
  amount: number
}

export interface TripAnalytics {
  totalBudget: number
  totalSpent: number
  remaining: number
  categoryBreakdown: CategoryBreakdownItem[]
  dailySpending: DailySpendingItem[]
  mostExpensiveCategory: string | null
  memberContributions: MemberContributionItem[]
}
