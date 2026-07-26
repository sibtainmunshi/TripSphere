import { api } from './api'
import type { ChatMessage } from '@/types/chat'

export async function listMessages(tripId: string): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>('/messages/', { params: { trip: tripId } })
  return data
}

export async function sendMessage(tripId: string, text: string): Promise<ChatMessage> {
  const { data } = await api.post<ChatMessage>('/messages/', { trip: tripId, text })
  return data
}
