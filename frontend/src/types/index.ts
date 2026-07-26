export type TripStatus = 'planning' | 'in_progress' | 'completed'

export interface TripMember {
  id: string
  email: string
  name?: string
  status: 'invited' | 'joined' | 'owner'
  /** True once a real account is linked to this member (via the invite
   * link) — that's what real trip access is granted against, not just
   * being on the list. */
  joined: boolean
  /** Only ever present for the trip owner's own view of the member list —
   * other viewers get null, since anyone could otherwise reuse another
   * pending member's invite. */
  inviteToken: string | null
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
