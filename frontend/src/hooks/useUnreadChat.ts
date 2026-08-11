import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { listMessages } from '@/services/chatApi'
import { getLastReadAt, isNewerThanLastRead } from '@/utils/chatReadState'

const POLL_INTERVAL_MS = 10000

// Ambient "someone messaged" flag for the sidebar's Chat nav item — same
// simple-polling approach as useChatMessages, just lighter-weight (longer
// interval, no message state) since it only needs to know whether the newest
// message from someone else is newer than what this user last opened Chat to see.
export function useUnreadChat(tripId: string | undefined, myMemberId: string | undefined) {
  const userId = useAuthStore((state) => state.user?.id)
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    if (!tripId) return
    let cancelled = false

    const poll = async () => {
      try {
        const messages = await listMessages(tripId)
        if (cancelled) return
        const lastFromOthers = [...messages].reverse().find((message) => message.senderId !== myMemberId)
        if (!lastFromOthers) {
          setHasUnread(false)
          return
        }
        setHasUnread(isNewerThanLastRead(lastFromOthers.createdAt, getLastReadAt(tripId, userId)))
      } catch {
        // Transient network hiccup — leave the dot as it was; the next poll retries.
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [tripId, myMemberId, userId])

  return hasUnread
}
