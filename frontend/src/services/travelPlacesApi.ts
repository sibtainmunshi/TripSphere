import { api } from './api'

export interface TravelPlaceOption {
  label: string
  value: string
}

export type TravelPlaceType = 'airport' | 'station'

export async function searchTravelPlaces(
  type: TravelPlaceType,
  query: string,
  signal?: AbortSignal,
): Promise<TravelPlaceOption[]> {
  const { data } = await api.get<TravelPlaceOption[]>('/travel/places-search/', { params: { type, query }, signal })
  return data
}
