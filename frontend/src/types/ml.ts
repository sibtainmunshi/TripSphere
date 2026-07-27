export type TravelStyle = 'backpacking' | 'relaxed' | 'adventure' | 'luxury'

export interface BudgetPrediction {
  predictedBudget: number
  rangeMin: number
  rangeMax: number
  destinationTier: 'budget' | 'mid' | 'luxury'
}

export interface DestinationSuggestion {
  name: string
  avgDailyCost: number
  styleTags: string[]
  bestMonths: string[]
  matchScore: number
}
