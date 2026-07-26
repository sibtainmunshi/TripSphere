export type MediaType = 'photo' | 'video'

export interface MediaItem {
  id: string
  trip: string
  uploaderId: string
  uploaderName: string
  file: string
  mediaType: MediaType
  caption?: string
  isFavorite: boolean
  createdAt: string
}
