import { api } from './api'
import type { TripAnalytics } from '@/types/analytics'

export async function getTripAnalytics(tripId: string): Promise<TripAnalytics> {
  const { data } = await api.get<TripAnalytics>('/analytics/summary/', { params: { trip: tripId } })
  return data
}
