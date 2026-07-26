import { api } from './api'

// Real conversational AI (Gemini, proxied through Django) for the Trip
// Planner chat. Stateless — the full message history is sent each turn,
// same shape the backend forwards straight to Gemini. The model only ever
// extracts these fields from the conversation; it is NOT trusted as ground
// truth for whether a destination is real — see destinationOptions.ts's
// enrichWithRealData for the independent Wikipedia/OpenStreetMap check that
// runs before any trip is actually created from what it extracted.
export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export interface ChatPlannerResult {
  reply: string
  destination: string | null
  travelStyle: string | null
  travelers: number | null
  budget: number | null
  readyToPlan: boolean
}

export async function sendPlannerMessage(messages: ChatMessage[]): Promise<ChatPlannerResult> {
  const { data } = await api.post<ChatPlannerResult>('/chat-planner/', { messages })
  return data
}
