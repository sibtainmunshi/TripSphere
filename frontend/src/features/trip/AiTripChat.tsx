import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  Feather,
  History,
  IndianRupee,
  Landmark,
  Mountain,
  PartyPopper,
  Plus,
  Save,
  Send,
  Users,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import logo from '@/assets/logo.svg'
import { Avatar } from '@/components/Avatar'
import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'
import { ChatBubble } from './ChatBubble'
import { TypingIndicator } from './TypingIndicator'
import { QuickReplyChip } from './QuickReplyChip'
import { StepIndicator } from './StepIndicator'
import { TripPlanPreview } from './TripPlanPreview'
import { TripPlanPlaceholder } from './TripPlanPlaceholder'
import { enrichWithRealData, getDestinationForCustomName, type DestinationOption } from './destinationOptions'
import { generateTripPlan, type TripPlanData } from './tripPlanMock'
import { sendPlannerMessage, type ChatMessage, type ChatPlannerResult, type PlannerField } from '@/services/chatPlanner'

interface Message {
  id: string
  from: 'user' | 'ai'
  text: string
}

interface PlannerSlots {
  destination: string | null
  travelStyle: string | null
  travelers: number | null
  budget: number | null
}

interface ChatSession {
  id: string
  updatedAt: number
  messages: Message[]
  slots: PlannerSlots
  plan: TripPlanData | null
  enrichedDestination: DestinationOption | null
  /** Which field the last AI reply asked about — drives which quick-reply
   * chips show. Optional so older saved sessions (pre-dating this field)
   * still load fine, just falling back to a best guess. */
  nextField?: PlannerField | null
}

const EMPTY_SLOTS: PlannerSlots = { destination: null, travelStyle: null, travelers: null, budget: null }

// One-tap conversation starters — still go through the real Gemini chat
// (not a shortcut around it), just pre-fills a natural first message so
// typing isn't required to get going.
const STARTER_SUGGESTIONS = [
  { label: 'Beach getaway', icon: Waves, text: 'I want a relaxing beach getaway for 2 people, budget around ₹25,000' },
  { label: 'Mountain adventure', icon: Mountain, text: 'An adventurous mountain trip with 4 friends, budget around ₹40,000' },
  { label: 'Cultural city break', icon: Landmark, text: 'A cultural city trip for 2 people, budget around ₹50,000' },
  { label: 'Surprise me', icon: Compass, text: 'Surprise me with a good destination for 3 people, budget around ₹30,000' },
]

// Contextual quick-answer chips — shown for whichever of these three fields
// Gemini hasn't extracted yet, so answering a fixed-choice question doesn't
// require typing it out. Clicking still sends a real message through the
// same chat (handleSend), never bypassing Gemini.
const STYLE_OPTIONS = [
  { label: 'Relaxed', icon: Feather },
  { label: 'Adventurous', icon: Zap },
  { label: 'Cultural', icon: Landmark },
  { label: 'Party', icon: PartyPopper },
]

const TRAVELER_OPTIONS = [1, 2, 4, 6]
const BUDGET_OPTIONS = [15_000, 25_000, 50_000, 100_000]

// Every conversation is saved as its own session (not one slot that gets
// overwritten) so "New Chat" doesn't throw away whatever was there before —
// old conversations stay reachable from the History dropdown. Scoped per
// user so a shared/public browser doesn't leak one account's chats into
// another's.
const SESSIONS_KEY_PREFIX = 'tripsphere:ai-planner-sessions:'
// Where conversations lived before History existed — migrated once into the
// new sessions list on first load rather than silently dropped.
const LEGACY_STORAGE_KEY_PREFIX = 'tripsphere:ai-planner:'

function greetingMessage(name: string): Message {
  return {
    id: 'greeting',
    from: 'ai',
    text: `Hi ${name}! 👋\nI'm the TripSphere AI planner. Tell me about the trip you're dreaming of — where, with how many people, what kind of vibe, and roughly what budget.`,
  }
}

function makeEmptySession(name: string): ChatSession {
  return {
    id: crypto.randomUUID(),
    updatedAt: Date.now(),
    messages: [greetingMessage(name)],
    slots: EMPTY_SLOTS,
    plan: null,
    enrichedDestination: null,
    nextField: 'destination',
  }
}

function loadSessions(userId: string | undefined): ChatSession[] {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(SESSIONS_KEY_PREFIX + userId)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as ChatSession[]) : []
  } catch {
    return []
  }
}

function saveSessions(userId: string | undefined, sessions: ChatSession[]) {
  if (!userId) return
  try {
    localStorage.setItem(SESSIONS_KEY_PREFIX + userId, JSON.stringify(sessions))
  } catch {
    // Private browsing / storage full — losing history silently is fine.
  }
}

function migrateLegacySession(userId: string | undefined): ChatSession | null {
  if (!userId) return null
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY_PREFIX + userId)
    if (!raw) return null
    localStorage.removeItem(LEGACY_STORAGE_KEY_PREFIX + userId)
    const legacy = JSON.parse(raw) as Partial<ChatSession>
    if (!legacy.messages || legacy.messages.length <= 1) return null
    return {
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
      messages: legacy.messages,
      slots: legacy.slots ?? EMPTY_SLOTS,
      plan: legacy.plan ?? null,
      enrichedDestination: legacy.enrichedDestination ?? null,
      nextField: null,
    }
  } catch {
    return null
  }
}

function sessionTitle(session: ChatSession): string {
  if (session.slots.destination) return `${session.slots.destination} trip`
  const firstUserMessage = session.messages.find((m) => m.from === 'user')
  if (firstUserMessage) {
    return firstUserMessage.text.length > 36 ? `${firstUserMessage.text.slice(0, 36)}…` : firstUserMessage.text
  }
  return 'New conversation'
}

function relativeTime(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

// The free-tier backend can take 50+ seconds to wake up after being idle,
// which sometimes trips the very first request after a gap — one silent
// retry clears most of these instead of surfacing a "connection" error for
// something that would have worked a few seconds later.
async function sendPlannerMessageWithRetry(history: ChatMessage[], slots: PlannerSlots): Promise<ChatPlannerResult> {
  try {
    return await sendPlannerMessage(history, slots)
  } catch {
    return await sendPlannerMessage(history, slots)
  }
}

export function AiTripChat() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const createTrip = useTripStore((state) => state.createTrip)
  const name = user?.name ?? 'there'

  const [initial] = useState(() => {
    const migrated = migrateLegacySession(user?.id)
    const existing = loadSessions(user?.id)
    const sessions = migrated ? [migrated, ...existing] : existing
    const active = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? makeEmptySession(name)
    return { sessions, active }
  })

  const [sessions, setSessions] = useState<ChatSession[]>(initial.sessions)
  const [activeSessionId, setActiveSessionId] = useState(initial.active.id)
  const [historyOpen, setHistoryOpen] = useState(false)

  const [messages, setMessages] = useState<Message[]>(initial.active.messages)
  const [thinking, setThinking] = useState(false)
  const [input, setInput] = useState('')
  const [slots, setSlots] = useState<PlannerSlots>(initial.active.slots)
  const [plan, setPlan] = useState<TripPlanData | null>(initial.active.plan)
  const [enrichedDestination, setEnrichedDestination] = useState<DestinationOption | null>(
    initial.active.enrichedDestination,
  )
  const [nextField, setNextField] = useState<PlannerField | null>(initial.active.nextField ?? 'destination')

  useEffect(() => {
    if (!user?.id) return
    // An untouched session (just the greeting, no plan) isn't worth saving —
    // keeps "New Chat" from cluttering History until there's something real
    // to resume.
    if (messages.length <= 1 && !plan) return

    setSessions((prev) => {
      const updated: ChatSession = {
        id: activeSessionId,
        updatedAt: Date.now(),
        messages,
        slots,
        plan,
        enrichedDestination,
        nextField,
      }
      const next = [updated, ...prev.filter((s) => s.id !== activeSessionId)]
      saveSessions(user.id, next)
      return next
    })
  }, [messages, slots, plan, enrichedDestination, nextField, activeSessionId, user?.id])

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const pushMessage = (from: 'user' | 'ai', text: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from, text }])
  }

  // Gemini's job is only to hold the conversation and extract these 4
  // fields — it's never trusted as ground truth for whether the destination
  // it heard is a real place. That's checked here, independently, against
  // Wikipedia/OpenStreetMap, before a trip plan is ever built from it.
  const buildPlan = async (finalSlots: PlannerSlots) => {
    if (!finalSlots.destination || !finalSlots.travelStyle || !finalSlots.travelers || !finalSlots.budget) return

    const enriched = await enrichWithRealData(getDestinationForCustomName(finalSlots.destination))

    if (enriched.lat == null || enriched.lon == null) {
      pushMessage(
        'ai',
        `I couldn't confirm "${finalSlots.destination}" as a real place — could you try a real city, region or country name?`,
      )
      setSlots((prev) => ({ ...prev, destination: null }))
      return
    }

    setEnrichedDestination(enriched)
    setPlan(generateTripPlan(enriched, finalSlots.travelStyle, finalSlots.travelers, finalSlots.budget))
  }

  const handleSend = async (overrideText?: string) => {
    const trimmed = (overrideText ?? input).trim()
    if (!trimmed || thinking || plan) return
    setInput('')

    const nextMessages: Message[] = [...messages, { id: crypto.randomUUID(), from: 'user', text: trimmed }]
    setMessages(nextMessages)
    setThinking(true)

    const history: ChatMessage[] = nextMessages.map((m) => ({ role: m.from === 'user' ? 'user' : 'model', text: m.text }))

    try {
      const result = await sendPlannerMessageWithRetry(history, slots)
      pushMessage('ai', result.reply)
      setThinking(false)
      setNextField(result.nextField)

      const newSlots: PlannerSlots = {
        destination: result.destination ?? slots.destination,
        travelStyle: result.travelStyle ?? slots.travelStyle,
        travelers: result.travelers ?? slots.travelers,
        budget: result.budget ?? slots.budget,
      }
      setSlots(newSlots)

      if (result.readyToPlan) await buildPlan(newSlots)
    } catch {
      pushMessage('ai', "Sorry, I'm having trouble connecting right now — please try again in a moment.")
      setThinking(false)
    }
  }

  const handleRegenerate = () => {
    if (!enrichedDestination || !slots.travelStyle || !slots.travelers || !plan) return
    const amount = Number(plan.estimatedBudget.replace(/[^\d]/g, ''))
    setPlan(generateTripPlan(enrichedDestination, slots.travelStyle, slots.travelers, amount))
  }

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleNewChat = () => {
    const fresh = makeEmptySession(name)
    setActiveSessionId(fresh.id)
    setMessages(fresh.messages)
    setSlots(EMPTY_SLOTS)
    setPlan(null)
    setEnrichedDestination(null)
    setNextField(fresh.nextField ?? 'destination')
    setInput('')
    setCreateError(null)
    setHistoryOpen(false)
  }

  const handleSelectSession = (session: ChatSession) => {
    setActiveSessionId(session.id)
    setMessages(session.messages)
    setSlots(session.slots)
    setPlan(session.plan)
    setEnrichedDestination(session.enrichedDestination)
    setNextField(session.nextField ?? null)
    setInput('')
    setCreateError(null)
    setHistoryOpen(false)
  }

  const handleDeleteSession = (sessionId: string, event: MouseEvent) => {
    event.stopPropagation()
    const next = sessions.filter((s) => s.id !== sessionId)
    setSessions(next)
    saveSessions(user?.id, next)
    if (sessionId === activeSessionId) handleNewChat()
  }

  const handleContinue = async () => {
    if (!plan) return
    setCreating(true)
    setCreateError(null)
    const start = new Date(Date.now() + 14 * 86_400_000)
    const end = new Date(start.getTime() + plan.nights * 86_400_000)
    try {
      const trip = await createTrip({
        name: `${plan.destination} Trip`,
        destination: plan.country ? `${plan.destination}, ${plan.country}` : plan.destination,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        memberCount: plan.travelers,
        lat: plan.lat,
        lon: plan.lon,
      })
      // The trip this conversation was building now exists for real — drop
      // it from history so it doesn't linger as a "conversation" once it's
      // already a real trip on the Trips page.
      const next = sessions.filter((s) => s.id !== activeSessionId)
      setSessions(next)
      saveSessions(user?.id, next)
      navigate(`/trips/${trip.id}`)
    } catch {
      setCreateError('Could not create your trip. Please try again.')
      setCreating(false)
    }
  }

  // Purely a visual progress cue now — Gemini fills these in whatever order
  // the conversation naturally goes, not a fixed sequence, so this is an
  // approximation (slots filled so far) rather than a strict step number.
  const filledCount = [slots.destination, slots.travelStyle, slots.travelers, slots.budget].filter(
    (value) => value != null,
  ).length
  const currentStep = plan ? 5 : Math.min(4, filledCount + 1)

  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)

  // Which chip set to show is driven by what Gemini's reply actually asked
  // for (nextField), not a fixed guess — it can ask about these in whatever
  // order fits the conversation. Falls back to a best guess only if a
  // response ever comes back without it (e.g. an older cached session).
  const effectiveNextField: PlannerField | null =
    nextField !== undefined && nextField !== null
      ? nextField
      : !slots.travelStyle
        ? 'travelStyle'
        : !slots.travelers
          ? 'travelers'
          : !slots.budget
            ? 'budget'
            : null

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-mist px-8 py-5">
        <div>
          <h1 className="text-xl font-bold text-ink">AI Trip Planner</h1>
          <p className="text-sm text-slate">Your personal travel assistant</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setHistoryOpen((open) => !open)}
              disabled={thinking}
              className={`flex items-center gap-1.5 rounded-lg border border-mist px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream disabled:opacity-40 ${
                historyOpen ? 'bg-cream' : ''
              }`}
            >
              <History className="h-4 w-4" />
              History
            </button>

            {historyOpen && (
              <div className="absolute top-full right-0 z-10 mt-1 max-h-80 w-72 overflow-y-auto rounded-lg border border-mist bg-white p-2 shadow-lg">
                {sortedSessions.length === 0 ? (
                  <p className="p-3 text-sm text-slate">No past conversations yet.</p>
                ) : (
                  sortedSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => event.key === 'Enter' && handleSelectSession(session)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-cream ${
                        session.id === activeSessionId ? 'bg-ocean/10 text-ocean' : 'text-ink'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{sessionTitle(session)}</span>
                        <span className="block text-xs text-slate">{relativeTime(session.updatedAt)}</span>
                      </span>
                      <button
                        onClick={(event) => handleDeleteSession(session.id, event)}
                        aria-label="Delete conversation"
                        className="shrink-0 rounded p-1 text-slate hover:bg-mist hover:text-ink"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleNewChat}
            disabled={thinking}
            className="flex items-center gap-1.5 rounded-lg border border-mist px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-mist px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream">
            <Save className="h-4 w-4" />
            Save as Draft
          </button>
          <div className="flex items-center gap-2">
            <Avatar name={name} imageUrl={user?.avatarUrl} />
            <span className="text-sm font-medium text-ink">{name}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-mist">
        <StepIndicator currentStep={currentStep} />
      </div>

      <div className="grid flex-1 grid-cols-2 overflow-hidden">
        <div className="flex flex-col overflow-hidden border-r border-mist">
          <div ref={scrollRef} className="scrollbar-none flex-1 overflow-y-auto px-6 py-6">
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-2.5">
                  {message.from === 'ai' && (
                    <img src={logo} alt="TripSphere" className="h-8 w-8 shrink-0 rounded-full" />
                  )}
                  <div className={message.from === 'user' ? 'ml-auto' : ''}>
                    <ChatBubble from={message.from}>
                      <span className="whitespace-pre-line">{message.text}</span>
                    </ChatBubble>
                  </div>
                </div>
              ))}

              {!thinking && messages.length === 1 && !plan && (
                <div className="ml-10 flex flex-col gap-1.5">
                  <p className="text-xs text-slate">Pick one, or describe your trip yourself:</p>
                  <div className="flex flex-wrap gap-2">
                    {STARTER_SUGGESTIONS.map((suggestion) => (
                      <QuickReplyChip
                        key={suggestion.label}
                        label={suggestion.label}
                        icon={suggestion.icon}
                        onClick={() => handleSend(suggestion.text)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Which chip set shows is driven by effectiveNextField (what Gemini's
                  reply actually just asked about), not a fixed guess — otherwise the
                  chips can ask about something completely different from the text
                  above them. */}
              {!thinking && messages.length > 1 && !plan && (
                <>
                  {effectiveNextField === 'travelStyle' && (
                    <div className="ml-10 flex flex-col gap-1.5">
                      <p className="text-xs text-slate">Pick one, or describe it yourself:</p>
                      <div className="flex flex-wrap gap-2">
                        {STYLE_OPTIONS.map((style) => (
                          <QuickReplyChip
                            key={style.label}
                            label={style.label}
                            icon={style.icon}
                            onClick={() => handleSend(style.label)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {effectiveNextField === 'travelers' && (
                    <div className="ml-10 flex flex-col gap-1.5">
                      <p className="text-xs text-slate">Pick one, or describe it yourself:</p>
                      <div className="flex flex-wrap gap-2">
                        {TRAVELER_OPTIONS.map((count) => (
                          <QuickReplyChip
                            key={count}
                            label={`${count}${count === 6 ? '+' : ''} traveler${count === 1 ? '' : 's'}`}
                            icon={Users}
                            onClick={() => handleSend(`${count} travelers`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {effectiveNextField === 'budget' && (
                    <div className="ml-10 flex flex-col gap-1.5">
                      <p className="text-xs text-slate">Pick one, or describe it yourself:</p>
                      <div className="flex flex-wrap gap-2">
                        {BUDGET_OPTIONS.map((amount) => (
                          <QuickReplyChip
                            key={amount}
                            label={`₹${amount.toLocaleString('en-IN')}${amount === 100_000 ? '+' : ''}`}
                            icon={IndianRupee}
                            onClick={() => handleSend(`My budget is ₹${amount.toLocaleString('en-IN')}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {thinking && (
                <div className="flex items-start gap-2.5">
                  <img src={logo} alt="TripSphere" className="h-8 w-8 shrink-0 rounded-full" />
                  <TypingIndicator />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-mist p-4">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                disabled={thinking || !!plan}
                placeholder="Tell me about your dream trip..."
                className="flex-1 rounded-full border border-mist px-4 py-2.5 text-sm outline-none placeholder:text-slate/60 focus:border-ocean disabled:bg-cream"
              />
              <button
                onClick={() => handleSend()}
                disabled={thinking || !!plan || !input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean text-white transition-colors hover:bg-ocean-dark disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate">
              The more details you share, the better I can plan your trip ✨
            </p>
          </div>
        </div>

        <div className="overflow-hidden bg-cream/40">
          {plan ? (
            <TripPlanPreview
              plan={plan}
              onRegenerate={handleRegenerate}
              onContinue={handleContinue}
              creating={creating}
              createError={createError}
            />
          ) : (
            <TripPlanPlaceholder />
          )}
        </div>
      </div>
    </div>
  )
}
