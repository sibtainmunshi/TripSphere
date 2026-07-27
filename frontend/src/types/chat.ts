export interface ChatMessage {
  id: string
  trip: string
  senderId: string | null
  senderName: string | null
  isSystem: boolean
  text: string
  createdAt: string
}
