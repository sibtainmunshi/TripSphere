import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  Feather,
  IndianRupee,
  Landmark,
  Mountain,
  PartyPopper,
  Save,
  Send,
  Users,
  Waves,
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
import { sendPlannerMessage, type ChatMessage } from '@/services/chatPlanner'

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

// Keeps an in-progress conversation alive across a refresh or a re-login —
// without this it only ever lived in React state, so reloading the page
// silently threw away everything Gemini had already learned about the trip.
// Scoped per user so a shared/public browser doesn't leak one account's
// planning chat into another's.
const STORAGE_KEY_PREFIX = 'tripsphere:ai-planner:'

interface PersistedPlannerState {
  messages: Message[]
  slots: PlannerSlots
  plan: TripPlanData | null
  enrichedDestination: DestinationOption | null
}

function loadPersistedState(userId: string | undefined): PersistedPlannerState | null {
  if (!userId) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId)
    return raw ? (JSON.parse(raw) as PersistedPlannerState) : null
  } catch {
    return null
  }
}

export function AiTripChat() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const createTrip = useTripStore((state) => state.createTrip)
  const name = user?.name ?? 'there'

  const [persisted] = useState(() => loadPersistedState(user?.id))

  const [messages, setMessages] = useState<Message[]>(
    persisted?.messages ?? [
      {
        id: 'greeting',
        from: 'ai',
        text: `Hi ${name}! 👋\nI'm the TripSphere AI planner. Tell me about the trip you're dreaming of — where, with how many people, what kind of vibe, and roughly what budget.`,
      },
    ],
  )
  const [thinking, setThinking] = useState(false)
  const [input, setInput] = useState('')
  const [slots, setSlots] = useState<PlannerSlots>(persisted?.slots ?? EMPTY_SLOTS)
  const [plan, setPlan] = useState<TripPlanData | null>(persisted?.plan ?? null)
  const [enrichedDestination, setEnrichedDestination] = useState<DestinationOption | null>(
    persisted?.enrichedDestination ?? null,
  )

  useEffect(() => {
    if (!user?.id) return
    try {
      const toSave: PersistedPlannerState = { messages, slots, plan, enrichedDestination }
      localStorage.setItem(STORAGE_KEY_PREFIX + user.id, JSON.stringify(toSave))
    } catch {
      // Private browsing / storage full — losing persistence silently is
      // fine, it just means this session behaves like it used to.
    }
  }, [messages, slots, plan, enrichedDestination, user?.id])

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
      const result = await sendPlannerMessage(history)
      pushMessage('ai', result.reply)
      setThinking(false)

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
      // The trip this conversation was building now exists for real —
      // clear it so the next visit to the planner starts a fresh chat
      // instead of resuming one that's already been turned into a trip.
      if (user?.id) localStorage.removeItem(STORAGE_KEY_PREFIX + user.id)
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-mist px-8 py-5">
        <div>
          <h1 className="text-xl font-bold text-ink">AI Trip Planner</h1>
          <p className="text-sm text-slate">Your personal travel assistant</p>
        </div>
        <div className="flex items-center gap-3">
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
                <div className="ml-10 flex flex-wrap gap-2">
                  {STARTER_SUGGESTIONS.map((suggestion) => (
                    <QuickReplyChip
                      key={suggestion.label}
                      label={suggestion.label}
                      icon={suggestion.icon}
                      onClick={() => handleSend(suggestion.text)}
                    />
                  ))}
                </div>
              )}

              {!thinking && messages.length > 1 && !plan && (
                <div className="ml-10 flex flex-col gap-3">
                  {!slots.travelStyle && (
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
                  )}
                  {!slots.travelers && (
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
                  )}
                  {!slots.budget && (
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
                  )}
                </div>
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
