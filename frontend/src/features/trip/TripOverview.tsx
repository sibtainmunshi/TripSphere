import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Check,
  FileText,
  Images,
  IndianRupee,
  MapPinned,
  MessageCircle,
  Send,
  Settings,
  Wallet,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'
import { useDestinationImage } from '@/hooks/useDestinationImage'
import { listDocuments } from '@/services/travelApi'
import { getBudget, listExpenses } from '@/services/budgetApi'
import { useChatMessages } from '@/hooks/useChatMessages'
import { sendMessage } from '@/services/chatApi'
import { listMedia } from '@/services/galleryApi'
import type { TravelDocument } from '@/types/travel'
import type { Budget, Expense } from '@/types/budget'
import type { MediaItem } from '@/types/gallery'
import { useBookingEvents, formatEventTime } from './travelHub/useBookingEvents'
import { TripCountdown } from './TripCountdown'

export function TripOverview() {
  const { tripId } = useParams<{ tripId: string }>()
  const user = useAuthStore((state) => state.user)
  const trip = useTripStore((state) => (tripId ? state.getTripById(tripId) : undefined))
  const nextUpImage = useDestinationImage(trip?.destination ?? '')
  const events = useBookingEvents(tripId ?? '')
  const [documents, setDocuments] = useState<TravelDocument[] | null>(null)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [media, setMedia] = useState<MediaItem[] | null>(null)
  const { messages: chatMessages } = useChatMessages(tripId ?? '')
  const [chatInput, setChatInput] = useState('')
  const [sendingChat, setSendingChat] = useState(false)

  useEffect(() => {
    if (!tripId) return
    listDocuments(tripId)
      .then(setDocuments)
      .catch(() => setDocuments([]))
    getBudget(tripId).then(setBudget)
    listExpenses(tripId)
      .then(setExpenses)
      .catch(() => setExpenses([]))
    listMedia(tripId)
      .then(setMedia)
      .catch(() => setMedia([]))
  }, [tripId])

  if (!trip || !tripId) return null

  const hasBookings = events !== null && events.length > 0
  const hasDocuments = (documents?.length ?? 0) > 0
  const hasBudget = Boolean(budget) || Boolean(trip.budget)
  const hasPhotos = (media?.length ?? 0) > 0
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  const checkpoints = [
    { label: 'Trip Details', done: true },
    { label: 'Budget Set', done: hasBudget },
    { label: 'Bookings Added', done: hasBookings },
    { label: 'Documents Added', done: hasDocuments },
    { label: 'Photos Added', done: hasPhotos },
  ]
  const progressPercent = Math.round((checkpoints.filter((c) => c.done).length / checkpoints.length) * 100)

  const upcoming = (events ?? []).filter((event) => event.at >= new Date().toISOString().slice(0, 10))
  const nextEvent = upcoming[0]

  const myMemberId = trip.members?.find((member) => member.email === user?.email)?.id
  const recentChat = chatMessages.slice(-4)

  const handleSendChat = async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || sendingChat) return
    setSendingChat(true)
    setChatInput('')
    try {
      await sendMessage(tripId, trimmed)
    } finally {
      setSendingChat(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <p className="font-script text-3xl font-bold text-ink">Hey {user?.name?.split(' ')[0] ?? 'there'}! 👋</p>
      <p className="mt-1 text-sm text-slate">
        Excited for your trip to {trip.destination}? Here&rsquo;s everything you need in one place.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-mist">
              <p className="px-5 pt-4 text-sm font-semibold text-ink">Next Up</p>
              <div className="relative mt-3 h-32">
                {nextUpImage ? (
                  <img src={nextUpImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-ocean to-navy" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="p-4">
                {nextEvent ? (
                  <>
                    <p className="text-sm font-semibold text-ink">{nextEvent.label}</p>
                    <p className="mt-1 text-xs text-slate">{formatEventTime(nextEvent)}</p>
                    <p className="text-xs text-slate">{nextEvent.detail}</p>
                  </>
                ) : (
                  <p className="text-sm text-slate">Nothing booked yet — add a stay, transport or reservation.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-mist p-5">
              <p className="flex items-center justify-between text-sm font-semibold text-ink">
                Trip Progress
                <span className="text-xs font-normal text-ocean">{progressPercent}% Completed</span>
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-mist">
                <div className="h-full rounded-full bg-sea transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {checkpoints.map((checkpoint) => (
                  <span
                    key={checkpoint.label}
                    className={`flex items-center gap-1.5 text-xs font-medium ${
                      checkpoint.done ? 'text-sea' : 'text-slate'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        checkpoint.done ? 'bg-sea text-white' : 'bg-mist text-slate'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {checkpoint.label}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-mist pt-3 text-xs text-slate">
                <span>
                  {Math.max(
                    1,
                    Math.round(
                      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86_400_000,
                    ) + 1,
                  )}{' '}
                  Days
                </span>
                {budget && (
                  <span className="flex items-center gap-0.5">
                    <IndianRupee className="h-3 w-3" />
                    {Number(budget.totalBudget).toLocaleString('en-IN')} Budget
                  </span>
                )}
                <span>{trip.members?.length ?? trip.memberCount} Members</span>
                <Link
                  to={`/trips/${tripId}/settings`}
                  className="ml-auto flex items-center gap-1 rounded-full bg-lavender/20 px-2.5 py-1 font-medium text-lavender-dark"
                >
                  <Settings className="h-3 w-3" />
                  Trip Settings
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-mist p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Wallet className="h-4 w-4 text-ocean" />
                  Budget
                </p>
                <Link to={`/trips/${tripId}/expenses`} className="text-xs font-medium text-ocean hover:underline">
                  View all →
                </Link>
              </div>
              {budget ? (
                <>
                  <p className="flex items-center gap-1 text-lg font-bold text-ink">
                    <IndianRupee className="h-4 w-4" />
                    {totalSpent.toLocaleString('en-IN')}
                    <span className="text-sm font-normal text-slate">
                      {' '}
                      / {Number(budget.totalBudget).toLocaleString('en-IN')}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    {expenses.length} expense{expenses.length === 1 ? '' : 's'} logged
                  </p>
                </>
              ) : trip.budget ? (
                <>
                  <p className="flex items-center gap-1 text-lg font-bold text-ink">
                    <IndianRupee className="h-4 w-4" />
                    {trip.budget.toLocaleString('en-IN')} planned
                  </p>
                  <p className="mt-1 text-xs text-slate">Set a detailed budget to track spending by category.</p>
                </>
              ) : (
                <p className="text-sm text-slate">No budget set yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-mist p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <FileText className="h-4 w-4 text-ocean" />
                  Important Documents
                </p>
                <Link to={`/trips/${tripId}/documents`} className="text-xs font-medium text-ocean hover:underline">
                  View all →
                </Link>
              </div>
              {!documents || documents.length === 0 ? (
                <p className="text-sm text-slate">No documents added yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {documents.slice(0, 3).map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-ink hover:text-ocean"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate" />
                      <span className="truncate">{doc.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-mist p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Images className="h-4 w-4 text-ocean" />
                Memories
              </p>
              <Link to={`/trips/${tripId}/gallery`} className="text-xs font-medium text-ocean hover:underline">
                View gallery →
              </Link>
            </div>
            {!media || media.length === 0 ? (
              <p className="text-sm text-slate">No photos yet — add the first one.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {media.slice(0, 6).map((item) => (
                  <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-cream">
                    {item.mediaType === 'video' ? (
                      <video src={item.file} className="h-full w-full object-cover" />
                    ) : (
                      <img src={item.file} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col rounded-2xl border border-mist p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Group Chat</p>
              <Link to={`/trips/${tripId}/chat`} className="text-xs font-medium text-ocean hover:underline">
                View all →
              </Link>
            </div>
            {recentChat.length === 0 ? (
              <p className="text-sm text-slate">No messages yet — say hi to the group.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recentChat.map((message) => {
                  if (message.isSystem) {
                    return (
                      <p key={message.id} className="text-center text-xs text-slate">
                        {message.text}
                      </p>
                    )
                  }
                  const isMine = message.senderId === myMemberId
                  return (
                    <div key={message.id} className="text-sm">
                      {!isMine && <span className="font-medium text-ink">{message.senderName}: </span>}
                      <span className={isMine ? 'text-ocean' : 'text-slate'}>{message.text}</span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2 border-t border-mist pt-3">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSendChat()}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-mist px-3.5 py-2 text-xs outline-none placeholder:text-slate/60 focus:border-ocean"
              />
              <button
                type="button"
                onClick={handleSendChat}
                disabled={sendingChat || !chatInput.trim()}
                aria-label="Send message"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean text-white transition-colors hover:bg-ocean-dark disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-slate">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to={`/trips/${tripId}/expenses`}
                className="flex flex-col items-center gap-2 rounded-xl border border-mist px-3 py-4 text-xs font-medium text-ink transition-colors hover:border-ocean hover:text-ocean"
              >
                <Wallet className="h-5 w-5" />
                Add Expense
              </Link>
              <Link
                to={`/trips/${tripId}/bookings`}
                className="flex flex-col items-center gap-2 rounded-xl border border-mist px-3 py-4 text-xs font-medium text-ink transition-colors hover:border-ocean hover:text-ocean"
              >
                <MapPinned className="h-5 w-5" />
                Add Booking
              </Link>
              <Link
                to={`/trips/${tripId}/chat`}
                className="flex flex-col items-center gap-2 rounded-xl border border-mist px-3 py-4 text-xs font-medium text-ink transition-colors hover:border-ocean hover:text-ocean"
              >
                <MessageCircle className="h-5 w-5" />
                Open Chat
              </Link>
              <Link
                to={`/trips/${tripId}/documents`}
                className="flex flex-col items-center gap-2 rounded-xl border border-mist px-3 py-4 text-xs font-medium text-ink transition-colors hover:border-ocean hover:text-ocean"
              >
                <FileText className="h-5 w-5" />
                Upload Docs
              </Link>
            </div>
          </div>

          <TripCountdown startDate={trip.startDate} />
        </div>
      </div>
    </div>
  )
}
