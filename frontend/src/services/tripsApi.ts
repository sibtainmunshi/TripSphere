import { api } from './api'
import type { Trip, TripMember } from '@/types'

// DRF serializes DecimalField as a string ("25000.00") — everything else
// already comes back camelCase from the serializer's `source=` mapping.
interface RawTrip extends Omit<Trip, 'budget'> {
  budget?: string | null
}

function normalizeTrip(raw: RawTrip): Trip {
  return {
    ...raw,
    budget: raw.budget != null ? Number(raw.budget) : undefined,
  }
}

export type CreateTripPayload = Omit<Trip, 'id' | 'createdAt' | 'archived'> & {
  members?: Omit<TripMember, 'id'>[]
}

export async function listTrips(): Promise<Trip[]> {
  const { data } = await api.get<RawTrip[]>('/trips/')
  return data.map(normalizeTrip)
}

export async function createTrip(payload: CreateTripPayload): Promise<Trip> {
  const { data } = await api.post<RawTrip>('/trips/', payload)
  return normalizeTrip(data)
}

export async function setTripArchived(id: string, archived: boolean): Promise<Trip> {
  const { data } = await api.patch<RawTrip>(`/trips/${id}/`, { archived })
  return normalizeTrip(data)
}

export async function updateTrip(
  id: string,
  patch: Partial<Pick<Trip, 'name' | 'destination' | 'startDate' | 'endDate' | 'description' | 'budget'>>,
): Promise<Trip> {
  const { data } = await api.patch<RawTrip>(`/trips/${id}/`, patch)
  return normalizeTrip(data)
}

export async function deleteTripApi(id: string): Promise<void> {
  await api.delete(`/trips/${id}/`)
}
