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

export type PlannerField = 'destination' | 'travelStyle' | 'travelers' | 'budget'

export interface PlannerSlots {
  destination: string | null
  travelStyle: string | null
  travelers: number | null
  budget: number | null
}

export interface ChatPlannerResult {
  reply: string
  destination: string | null
  travelStyle: string | null
  travelers: number | null
  budget: number | null
  readyToPlan: boolean
  /** Which field `reply` is actually asking the user for right now — lets the
   * UI show matching quick-reply chips instead of guessing from a fixed
   * order, since Gemini can ask about these in whatever order fits the
   * conversation. */
  nextField: PlannerField | null
}

// Stateless — the frontend also sends its own tracked `slots` alongside the
// message history every turn, as ground truth for what's already confirmed.
// Without it, Gemini's only way to know what's settled is re-reading its own
// past reply text, which broke down on ambiguous turns (e.g. the user just
// replying "yes") and produced a nextField that contradicted its own reply.
export async function sendPlannerMessage(messages: ChatMessage[], slots: PlannerSlots): Promise<ChatPlannerResult> {
  const { data } = await api.post<ChatPlannerResult>('/chat-planner/', { messages, slots })
  return data
}
