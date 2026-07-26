import { api } from './api'
import type { RestaurantReservation, StayBooking, TransportBooking, TravelDocument } from '@/types/travel'

export async function listStays(tripId: string): Promise<StayBooking[]> {
  const { data } = await api.get<StayBooking[]>('/travel/stays/', { params: { trip: tripId } })
  return data
}
export async function createStay(payload: Omit<StayBooking, 'id' | 'createdAt'>): Promise<StayBooking> {
  const { data } = await api.post<StayBooking>('/travel/stays/', payload)
  return data
}
export async function deleteStay(id: string): Promise<void> {
  await api.delete(`/travel/stays/${id}/`)
}

export async function listTransport(tripId: string): Promise<TransportBooking[]> {
  const { data } = await api.get<TransportBooking[]>('/travel/transport/', { params: { trip: tripId } })
  return data
}
export async function createTransport(
  payload: Omit<TransportBooking, 'id' | 'createdAt'>,
): Promise<TransportBooking> {
  const { data } = await api.post<TransportBooking>('/travel/transport/', payload)
  return data
}
export async function deleteTransport(id: string): Promise<void> {
  await api.delete(`/travel/transport/${id}/`)
}

export async function listRestaurants(tripId: string): Promise<RestaurantReservation[]> {
  const { data } = await api.get<RestaurantReservation[]>('/travel/restaurants/', { params: { trip: tripId } })
  return data
}
export async function createRestaurant(
  payload: Omit<RestaurantReservation, 'id' | 'createdAt'>,
): Promise<RestaurantReservation> {
  const { data } = await api.post<RestaurantReservation>('/travel/restaurants/', payload)
  return data
}
export async function deleteRestaurant(id: string): Promise<void> {
  await api.delete(`/travel/restaurants/${id}/`)
}

export async function listDocuments(tripId: string): Promise<TravelDocument[]> {
  const { data } = await api.get<TravelDocument[]>('/travel/documents/', { params: { trip: tripId } })
  return data
}
export async function uploadDocument(
  tripId: string,
  title: string,
  documentType: string,
  file: File,
): Promise<TravelDocument> {
  const formData = new FormData()
  formData.append('trip', tripId)
  formData.append('title', title)
  formData.append('documentType', documentType)
  formData.append('file', file)
  const { data } = await api.post<TravelDocument>('/travel/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/travel/documents/${id}/`)
}
