// Tracks, per trip and per user, the timestamp of the newest group chat
// message the user has actually opened Chat to see — powers the WhatsApp-style
// unread dot in TripSidebar. No backend read-receipts model exists (or is
// needed) for this; localStorage is enough for a single-browser "have I seen
// this" flag, same convention as AiTripChat's session storage.
const STORAGE_PREFIX = 'chatLastRead:'

function storageKey(tripId: string, userId: string) {
  return `${STORAGE_PREFIX}${tripId}:${userId}`
}

export function getLastReadAt(tripId: string, userId: string | undefined): string | null {
  if (!userId) return null
  try {
    return localStorage.getItem(storageKey(tripId, userId))
  } catch {
    return null
  }
}

export function setLastReadAt(tripId: string, userId: string | undefined, iso: string): void {
  if (!userId) return
  try {
    localStorage.setItem(storageKey(tripId, userId), iso)
  } catch {
    // Private browsing / storage full — the dot just won't persist across reloads.
  }
}

export function isNewerThanLastRead(createdAt: string, lastReadAt: string | null): boolean {
  if (!lastReadAt) return true
  return new Date(createdAt).getTime() > new Date(lastReadAt).getTime()
}
