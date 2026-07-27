import { api } from './api'

// Real, named hotels/restaurants from OpenStreetMap (via Overpass API),
// proxied through our own backend — same reasoning as attractions.ts
// (Overpass needs a User-Agent header browsers can't set).
export interface NearbyPlace {
  id: number
  name: string
  address: string
  lat: number
  lon: number
}

export type PlaceType = 'hotel' | 'restaurant'

export async function fetchNearbyPlaces(type: PlaceType, lat: number, lon: number): Promise<NearbyPlace[]> {
  const { data } = await api.get<NearbyPlace[]>('/places/', { params: { type, lat, lon } })
  return data
}
