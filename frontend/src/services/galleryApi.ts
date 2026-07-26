import { api } from './api'
import type { MediaItem } from '@/types/gallery'

export async function listMedia(tripId: string): Promise<MediaItem[]> {
  const { data } = await api.get<MediaItem[]>('/media/', { params: { trip: tripId } })
  return data
}

export async function uploadMedia(tripId: string, file: File, caption?: string): Promise<MediaItem> {
  const formData = new FormData()
  formData.append('trip', tripId)
  formData.append('file', file)
  if (caption) formData.append('caption', caption)
  const { data } = await api.post<MediaItem>('/media/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function setFavorite(id: string, isFavorite: boolean): Promise<MediaItem> {
  const { data } = await api.patch<MediaItem>(`/media/${id}/`, { isFavorite })
  return data
}

export async function deleteMedia(id: string): Promise<void> {
  await api.delete(`/media/${id}/`)
}
