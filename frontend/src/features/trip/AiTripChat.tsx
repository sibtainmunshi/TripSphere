import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Compass,
  Feather,
  IndianRupee,
  Landmark,
  Leaf,
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
import {
  enrichWithRealData,
  getDestinationForCustomName,
  getDestinationForVibe,
  type DestinationOption,
} from './destinationOptions'
import { generateTripPlan, type TripPlanData } from './tripPlanMock'

interface Message {
  id: string
  from: 'user' | 'ai'
  text: string
}

type Step = 1 | 2 | 3 | 4 | 5

const VIBES = [
  { label: 'Beach', icon: Waves },
  { label: 'Mountains', icon: Mountain },
  { label: 'City', icon: Building2 },
  { label: 'Nature', icon: Leaf },
  { label: 'Anywhere', icon: Compass },
]

const STYLES = [
  { label: 'Relaxed', icon: Feather },
  { label: 'Adventurous', icon: Zap },
  { label: 'Cultural', icon: Landmark },
  { label: 'Party', icon: PartyPopper },
]

const TRAVELER_OPTIONS = [1, 2, 4, 6]
const BUDGET_OPTIONS = [15_000, 25_000, 50_000, 100_000]

export function AiTripChat() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const createTrip = useTripStore((state) => state.createTrip)
  const name = user?.name ?? 'there'

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      from: 'ai',
      text: `Hi ${name}! 👋\nI'm the TripSphere AI planner. I'll help you plan the perfect trip. Let's start with the destination.`,
    },
    { id: 'ask-vibe', from: 'ai', text: 'Where would you like to go?' },
  ])
  const [step, setStep] = useState<Step>(1)
  const [thinking, setThinking] = useState(false)
  const [input, setInput] = useState('')

  const [destination, setDestination] = useState<DestinationOption | null>(null)
  const [travelStyle, setTravelStyle] = useState<string | null>(null)
  const [travelers, setTravelers] = useState<number | null>(null)
  const [plan, setPlan] = useState<TripPlanData | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const pushMessage = (from: 'user' | 'ai', text: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from, text }])
  }

  const advance = (userText: string, botReply: string, next: Step) => {
    pushMessage('user', userText)
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      pushMessage('ai', botReply)
      setStep(next)
    }, 800)
  }

  const handleDestination = (chosen: DestinationOption, label: string) => {
    pushMessage('user', label)
    setThinking(true)
    // Real coordinates/photo lookup (Wikipedia) for whatever this option is
    // still missing — genuinely fetched, not a fixed setTimeout, since this
    // step now does real work rather than just simulating "thinking". These
    // are the 5 preset vibes, always real destinations, so no validation
    // is needed here — see handleCustomDestination for free-typed input.
    enrichWithRealData(chosen).then((enriched) => {
      setDestination(enriched)
      setThinking(false)
      pushMessage('ai', `Great pick! ${enriched.name} it is. 🎉\nWhat kind of trip are you after?`)
      setStep(2)
    })
  }

  // Small talk isn't a destination — catches exact greetings/acknowledgements
  // typed at step 1 so the bot doesn't try to "geocode" them. Anchored at
  // both ends so it never rejects a real place that happens to start with
  // one of these words (e.g. "Hello Kitty Park" wouldn't be flagged).
  const NON_DESTINATION_PATTERN =
    /^(hi|hey|hey there|hello|yo|hola|sup|good\s?(morning|evening|afternoon|day)|thanks?|thank\s?you|ok|okay|cool|nice|great|awesome)[\s!.,]*$/i

  const handleCustomDestination = (raw: string) => {
    pushMessage('user', raw)

    if (raw.length < 2 || NON_DESTINATION_PATTERN.test(raw)) {
      pushMessage('ai', "Hey! 👋 Tell me a destination to get started — a city, region or country, like Goa, Manali or Bali.")
      return
    }

    setThinking(true)
    enrichWithRealData(getDestinationForCustomName(raw)).then((enriched) => {
      setThinking(false)
      // Neither Wikipedia nor OpenStreetMap could confirm this is a real
      // place — say so honestly instead of pretending any typed text works.
      if (enriched.lat == null || enriched.lon == null) {
        pushMessage(
          'ai',
          `I couldn't find a real place called "${raw}" — try a city, region or country name, like Goa, Manali or Bali.`,
        )
        return
      }
      setDestination(enriched)
      pushMessage('ai', `Great pick! ${enriched.name} it is. 🎉\nWhat kind of trip are you after?`)
      setStep(2)
    })
  }

  const handleStyle = (style: string) => {
    setTravelStyle(style)
    advance(style, `Love it — ${style.toLowerCase()} sounds perfect.\nHow many travelers are joining?`, 3)
  }

  const handleTravelers = (count: number) => {
    setTravelers(count)
    advance(
      `${count} traveler${count === 1 ? '' : 's'}`,
      `Got it, ${count} traveler${count === 1 ? '' : 's'}.\nWhat's your budget for this trip?`,
      4,
    )
  }

  const handleBudget = (amount: number) => {
    if (!destination || !travelStyle || !travelers) return
    pushMessage('user', `₹${amount.toLocaleString('en-IN')}`)
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      pushMessage('ai', "Here's what I've put together for you! ✨")
      setPlan(generateTripPlan(destination, travelStyle, travelers, amount))
      setStep(5)
    }, 1400)
  }

  const parseTravelers = (text: string): number | null => {
    const match = text.match(/\d+/)
    if (!match) return null
    return Math.max(1, Math.min(20, Number(match[0])))
  }

  const parseBudget = (text: string): number | null => {
    const digits = text.replace(/[^\d]/g, '')
    if (!digits) return null
    return Math.max(1000, Number(digits))
  }

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || thinking) return
    setInput('')

    if (step === 1) {
      handleCustomDestination(trimmed)
      return
    }
    if (step === 2) {
      const matched = STYLES.find((s) => s.label.toLowerCase() === trimmed.toLowerCase())
      handleStyle(matched?.label ?? 'Relaxed')
      return
    }
    if (step === 3) {
      const count = parseTravelers(trimmed)
      if (count) handleTravelers(count)
      return
    }
    if (step === 4) {
      const amount = parseBudget(trimmed)
      if (amount) handleBudget(amount)
      return
    }
  }

  const handleRegenerate = () => {
    if (!destination || !travelStyle || !travelers || !plan) return
    const amount = Number(plan.estimatedBudget.replace(/[^\d]/g, ''))
    setPlan(generateTripPlan(destination, travelStyle, travelers, amount))
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
      navigate(`/trips/${trip.id}`)
    } catch {
      setCreateError('Could not create your trip. Please try again.')
      setCreating(false)
    }
  }

  const placeholderForStep: Record<Step, string> = {
    1: 'e.g. Goa, or describe a vibe...',
    2: 'e.g. Relaxed, Adventurous...',
    3: 'e.g. 4',
    4: 'e.g. 25000',
    5: 'Trip plan ready — scroll right',
  }

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
        <StepIndicator currentStep={step} />
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

              {!thinking && step === 1 && (
                <div className="ml-10 flex flex-wrap gap-2">
                  {VIBES.map((vibe) => (
                    <QuickReplyChip
                      key={vibe.label}
                      label={vibe.label}
                      icon={vibe.icon}
                      onClick={() => handleDestination(getDestinationForVibe(vibe.label), vibe.label)}
                    />
                  ))}
                </div>
              )}

              {!thinking && step === 2 && (
                <div className="ml-10 flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <QuickReplyChip key={s.label} label={s.label} icon={s.icon} onClick={() => handleStyle(s.label)} />
                  ))}
                </div>
              )}

              {!thinking && step === 3 && (
                <div className="ml-10 flex flex-wrap gap-2">
                  {TRAVELER_OPTIONS.map((count) => (
                    <QuickReplyChip
                      key={count}
                      label={`${count}${count === 6 ? '+' : ''}`}
                      icon={Users}
                      onClick={() => handleTravelers(count)}
                    />
                  ))}
                </div>
              )}

              {!thinking && step === 4 && (
                <div className="ml-10 flex flex-wrap gap-2">
                  {BUDGET_OPTIONS.map((amount) => (
                    <QuickReplyChip
                      key={amount}
                      label={`₹${amount.toLocaleString('en-IN')}${amount === 100_000 ? '+' : ''}`}
                      icon={IndianRupee}
                      onClick={() => handleBudget(amount)}
                    />
                  ))}
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
                disabled={thinking || step === 5}
                placeholder={placeholderForStep[step]}
                className="flex-1 rounded-full border border-mist px-4 py-2.5 text-sm outline-none placeholder:text-slate/60 focus:border-ocean disabled:bg-cream"
              />
              <button
                onClick={handleSend}
                disabled={thinking || step === 5 || !input.trim()}
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
