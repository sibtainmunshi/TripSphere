import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CalendarClock,
  Check,
  CloudSun,
  FileText,
  Images,
  IndianRupee,
  ListChecks,
  MapPinned,
  Wallet,
} from 'lucide-react'
import { useTripStore } from '@/store/tripStore'
import { useWeather } from '@/hooks/useWeather'
import { getWeatherIcon } from '@/services/weather'
import { listDocuments } from '@/services/travelApi'
import { getBudget, listExpenses } from '@/services/budgetApi'
import type { TravelDocument } from '@/types/travel'
import type { Budget, Expense } from '@/types/budget'
import { useBookingEvents, formatEventTime } from './travelHub/useBookingEvents'
import { TripCountdown } from './TripCountdown'

export function TripOverview() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useTripStore((state) => (tripId ? state.getTripById(tripId) : undefined))
  const { data: weather } = useWeather(trip?.lat, trip?.lon)
  const events = useBookingEvents(tripId ?? '')
  const [documents, setDocuments] = useState<TravelDocument[] | null>(null)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    if (!tripId) return
    listDocuments(tripId)
      .then(setDocuments)
      .catch(() => setDocuments([]))
    getBudget(tripId).then(setBudget)
    listExpenses(tripId)
      .then(setExpenses)
      .catch(() => setExpenses([]))
  }, [tripId])

  if (!trip || !tripId) return null

  const hasBookings = events !== null && events.length > 0
  const hasDocuments = (documents?.length ?? 0) > 0
  const hasBudget = Boolean(budget) || Boolean(trip.budget)
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  const checkpoints = [
    { label: 'Trip Details', done: true },
    { label: 'Budget Set', done: hasBudget },
    { label: 'Bookings Added', done: hasBookings },
    { label: 'Documents Added', done: hasDocuments },
  ]
  const progressPercent = Math.round((checkpoints.filter((c) => c.done).length / checkpoints.length) * 100)

  const upcoming = (events ?? []).filter((event) => event.at >= new Date().toISOString().slice(0, 10)).slice(0, 3)

  const WeatherIcon = weather ? getWeatherIcon(weather.code) : CloudSun

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-mist p-5">
          <p className="text-sm font-semibold text-ink">Trip Progress</p>
          <p className="mt-1 text-xs text-slate">
            {progressPercent === 100 ? "You're all set!" : "You're getting there — keep it up."}
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-sea transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-sm font-bold text-ink">{progressPercent}% Completed</p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
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
        </div>

        <div className="rounded-2xl border border-mist p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <WeatherIcon className="h-4 w-4 text-ocean" />
            Weather
          </p>
          {weather ? (
            <>
              <p className="mt-3 text-3xl font-bold text-ink">{weather.temperatureC}°C</p>
              <p className="text-sm text-slate">{weather.label}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate">Weather unavailable for this trip.</p>
          )}
        </div>

        <TripCountdown startDate={trip.startDate} />
      </div>

      <div className="rounded-2xl border border-mist p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <CalendarClock className="h-4 w-4 text-ocean" />
            Upcoming
          </p>
          <Link to={`/trips/${tripId}/bookings`} className="text-xs font-medium text-ocean hover:underline">
            View all →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate">Nothing booked yet — add a stay, transport or reservation.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((event) => (
              <div key={event.id} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean/10 text-ocean">
                  <event.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{event.label}</p>
                  <p className="text-xs text-slate">{formatEventTime(event)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
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
                <span className="text-sm font-normal text-slate"> / {Number(budget.totalBudget).toLocaleString('en-IN')}</span>
              </p>
              <p className="mt-1 text-xs text-slate">{expenses.length} expense{expenses.length === 1 ? '' : 's'} logged</p>
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

      <div className="rounded-2xl border border-dashed border-mist p-5 text-center text-sm text-slate">
        <Images className="mx-auto mb-2 h-5 w-5" />
        Photos &amp; memories will show up here once Gallery is built (Milestone 6).
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-slate">Quick actions</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            to={`/trips/${tripId}/bookings`}
            className="flex flex-col items-center gap-2 rounded-xl border border-mist px-3 py-4 text-xs font-medium text-ink transition-colors hover:border-ocean hover:text-ocean"
          >
            <MapPinned className="h-5 w-5" />
            Bookings
          </Link>
          <Link
            to={`/trips/${tripId}/documents`}
            className="flex flex-col items-center gap-2 rounded-xl border border-mist px-3 py-4 text-xs font-medium text-ink transition-colors hover:border-ocean hover:text-ocean"
          >
            <FileText className="h-5 w-5" />
            Documents
          </Link>
          <Link
            to={`/trips/${tripId}/expenses`}
            className="flex flex-col items-center gap-2 rounded-xl border border-mist px-3 py-4 text-xs font-medium text-ink transition-colors hover:border-ocean hover:text-ocean"
          >
            <Wallet className="h-5 w-5" />
            Expenses
          </Link>
          <Link
            to={`/trips/${tripId}/checklists`}
            className="flex flex-col items-center gap-2 rounded-xl border border-mist px-3 py-4 text-xs font-medium text-ink transition-colors hover:border-ocean hover:text-ocean"
          >
            <ListChecks className="h-5 w-5" />
            Checklists
          </Link>
        </div>
      </div>
    </div>
  )
}
