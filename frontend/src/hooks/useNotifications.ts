import { useEffect, useState } from 'react'
import { listNotifications } from '@/services/notificationApi'
import type { NotificationItem } from '@/types/notification'

const POLL_INTERVAL_MS = 15000

// Polling, same reasoning as chat (useChatMessages) — no WebSockets needed
// for this project's scope. Less frequent than chat since notifications
// are lower urgency.
export function useNotifications(tripId: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const data = await listNotifications(tripId)
        if (!cancelled) setNotifications(data)
      } catch {
        // Keep showing whatever's already there; the next poll retries.
      }
    }
    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [tripId])

  return { notifications, setNotifications }
}
