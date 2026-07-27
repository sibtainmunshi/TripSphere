import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'
import { useChatMessages } from '@/hooks/useChatMessages'
import { sendMessage } from '@/services/chatApi'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export function ChatPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const user = useAuthStore((state) => state.user)
  const trip = useTripStore((state) => (tripId ? state.getTripById(tripId) : undefined))
  const { messages, loading } = useChatMessages(tripId ?? '')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  if (!tripId) return null

  // Messages are attributed by TripMember id, not directly by user id — this
  // is how "is this my own message" gets figured out for alignment/styling.
  const myMemberId = trip?.members?.find((member) => member.email === user?.email)?.id

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending || !tripId) return
    setSending(true)
    setInput('')
    try {
      await sendMessage(tripId, trimmed)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-mist px-8 py-5">
        <h1 className="text-xl font-bold text-ink">Group Chat</h1>
        <p className="text-sm text-slate">Updates every few seconds — no need to refresh.</p>
      </div>

      <div ref={scrollRef} className="scrollbar-none flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <p className="text-sm text-slate">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate">No messages yet — say hi to get the conversation started.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              if (message.isSystem) {
                return (
                  <p key={message.id} className="my-1 text-center text-xs text-slate">
                    {message.text} · {formatTime(message.createdAt)}
                  </p>
                )
              }
              const isMine = message.senderId === myMemberId
              return (
                <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[70%]">
                    {!isMine && <p className="mb-1 ml-1 text-xs font-medium text-slate">{message.senderName}</p>}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isMine ? 'rounded-br-sm bg-navy text-white' : 'rounded-bl-sm bg-cream text-ink'
                      }`}
                    >
                      {message.text}
                    </div>
                    <p className={`mt-1 text-[11px] text-slate ${isMine ? 'mr-1 text-right' : 'ml-1'}`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-mist p-4">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-mist px-4 py-2.5 text-sm outline-none placeholder:text-slate/60 focus:border-ocean"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean text-white transition-colors hover:bg-ocean-dark disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
