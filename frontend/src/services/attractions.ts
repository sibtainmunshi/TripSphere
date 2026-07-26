import axios from 'axios'
import { api } from './api'

// Real, named tourist attractions from OpenStreetMap (via Overpass API),
// proxied through our own backend — Overpass requires an identifying
// User-Agent header, and browsers refuse to let client-side fetch() set
// that header, so this can't be called directly like geocoding.ts/weather.ts.
export interface Attraction {
  id: number
  name: string
  category: string
  lat: number
  lon: number
}

export function googleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
}

export async function fetchNearbyAttractions(lat: number, lon: number, signal?: AbortSignal): Promise<Attraction[]> {
  const { data } = await api.get<Attraction[]>('/attractions/', { params: { lat, lon }, signal })
  return data
}

export function isAbortError(error: unknown): boolean {
  return axios.isCancel(error)
}
