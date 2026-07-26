import { useEffect, useState } from 'react'
import { listMessages } from '@/services/chatApi'
import type { ChatMessage } from '@/types/chat'

const POLL_INTERVAL_MS = 4000

// Real, simple polling — re-fetches every few seconds instead of a
// WebSocket/Django Channels setup, matching this project's "simplified
// group chat" scope (no fake real-time feel pretending to be a live socket).
export function useChatMessages(tripId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const data = await listMessages(tripId)
        if (!cancelled) setMessages(data)
      } catch {
        // Transient network hiccup — keep showing whatever's already there
        // rather than clearing the chat; the next poll tries again.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [tripId])

  return { messages, loading }
}
