import { api } from './api'
import type { BudgetPrediction, DestinationSuggestion, TravelStyle } from '@/types/ml'

export async function predictBudget(
  destination: string,
  durationDays: number,
  travelers: number,
  travelStyle: TravelStyle,
): Promise<BudgetPrediction> {
  const { data } = await api.post<BudgetPrediction>('/ml/predict-budget/', {
    destination,
    durationDays,
    travelers,
    travelStyle,
  })
  return data
}

export async function recommendDestinations(
  budgetPerDay: number,
  travelStyle: TravelStyle,
  month?: string,
): Promise<DestinationSuggestion[]> {
  const { data } = await api.post<{ results: DestinationSuggestion[] }>('/ml/recommend-destinations/', {
    budgetPerDay,
    travelStyle,
    month,
  })
  return data.results
}
