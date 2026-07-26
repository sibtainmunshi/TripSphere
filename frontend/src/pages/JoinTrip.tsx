import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Loader2, MapPin, PartyPopper } from 'lucide-react'
import logo from '@/assets/logo.svg'
import { useAuthStore } from '@/store/authStore'
import { acceptJoin, getJoinPreview, type JoinPreview } from '@/services/tripsApi'
import { getApiErrorMessage } from '@/services/api'

function formatDateRange(start: string, end: string) {
  const startLabel = new Date(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const endLabel = new Date(end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startLabel} — ${endLabel}`
}

// Public — reachable whether or not the visitor is logged in, since seeing
// what you're being invited to shouldn't require an account first. Not
// nested under AppLayout (which redirects straight to /login) or
// AuthLayout (which is specifically the login/signup forms) — its own
// standalone route.
export function JoinTrip() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [preview, setPreview] = useState<JoinPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!token) return
    getJoinPreview(token)
      .then(setPreview)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  const handleJoin = async () => {
    if (!token) return
    setJoining(true)
    setError(null)
    try {
      const trip = await acceptJoin(token)
      navigate(`/trips/${trip.id}`, { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not join this trip. Please try again.'))
      setJoining(false)
    }
  }

  const redirectTarget = `/join/${token}`

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-2xl border border-mist bg-white p-8 text-center shadow-sm">
        <img src={logo} alt="TripSphere" className="mx-auto mb-4 h-12 w-12" />

        {loading ? (
          <p className="text-sm text-slate">Loading invite…</p>
        ) : notFound || !preview ? (
          <>
            <p className="text-lg font-semibold text-ink">Invite not found</p>
            <p className="mt-1.5 text-sm text-slate">
              This invite link isn&rsquo;t valid — it may have been removed, or you might have the wrong link.
            </p>
            <Link to="/" className="mt-5 inline-block text-sm font-medium text-ocean hover:underline">
              Go to TripSphere
            </Link>
          </>
        ) : (
          <>
            <PartyPopper className="mx-auto mb-2 h-8 w-8 text-ocean" />
            <p className="text-lg font-semibold text-ink">You&rsquo;re invited to {preview.tripName}</p>
            <div className="mt-3 flex flex-col items-center gap-1.5 text-sm text-slate">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {preview.destination}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatDateRange(preview.startDate, preview.endDate)}
              </span>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {preview.alreadyJoined ? (
              <>
                <p className="mt-6 text-sm text-slate">You&rsquo;ve already joined this trip.</p>
                <Link
                  to="/trips"
                  className="mt-3 inline-block text-sm font-medium text-ocean hover:underline"
                >
                  Go to your trips →
                </Link>
              </>
            ) : isAuthenticated ? (
              <button
                type="button"
                onClick={handleJoin}
                disabled={joining}
                className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : `Join ${preview.tripName}`}
              </button>
            ) : (
              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  to={{ pathname: '/signup', search: `redirect=${encodeURIComponent(redirectTarget)}` }}
                  className="flex items-center justify-center rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
                >
                  Sign up to join
                </Link>
                <Link
                  to={{ pathname: '/login', search: `redirect=${encodeURIComponent(redirectTarget)}` }}
                  className="flex items-center justify-center rounded-lg border border-mist py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream"
                >
                  Log in to join
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
