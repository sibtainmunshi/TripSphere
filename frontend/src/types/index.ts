export type TripStatus = 'planning' | 'in_progress' | 'completed'

export interface TripMember {
  id: string
  email: string
  name?: string
  status: 'invited' | 'owner'
}

export interface Trip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  createdAt: string
  archived?: boolean
  lat?: number
  lon?: number
  memberCount: number
  coverImageUrl?: string
  tripType?: string
  description?: string
  budget?: number
  members?: TripMember[]
  inviteLink?: string
}
