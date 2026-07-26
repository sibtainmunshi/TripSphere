import { useNavigate } from 'react-router-dom'
import { Briefcase, Calendar, IndianRupee, LogOut, Mail, MapPin, ShieldCheck } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'
import { useTripFilters } from '@/features/home/useTripFilters'

function formatJoinedDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function Profile() {
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const trips = useTripStore((state) => state.trips)
  const navigate = useNavigate()
  const { tabCounts } = useTripFilters(trips)

  const totalBudget = trips
    .filter((trip) => !trip.archived && trip.budget)
    .reduce((sum, trip) => sum + (trip.budget ?? 0), 0)

  const isGoogleAccount = Boolean(user?.avatarUrl)
  const joinedLabel = formatJoinedDate(user?.joinedAt)

  const handleLogout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  const STATS = [
    { label: 'Total Trips', value: tabCounts.all, icon: Briefcase, tint: 'text-ocean bg-ocean/10' },
    { label: 'Planning', value: tabCounts.planning, icon: Calendar, tint: 'text-gold-dark bg-gold/10' },
    { label: 'In Progress', value: tabCounts.in_progress, icon: MapPin, tint: 'text-sea bg-sea/10' },
    { label: 'Completed', value: tabCounts.completed, icon: ShieldCheck, tint: 'text-lavender-dark bg-lavender/10' },
  ]

  return (
    <div className="min-h-full bg-white">
      <div className="bg-gradient-to-br from-navy via-navy to-ocean-dark px-6 py-14 sm:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Avatar
            name={user?.name ?? 'You'}
            imageUrl={user?.avatarUrl}
            className="h-24 w-24 border-4 border-white/20 text-3xl shadow-xl"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.name ?? 'Traveler'}</h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-white/70">
              <Mail className="h-3.5 w-3.5" />
              {user?.email ?? ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {isGoogleAccount && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                Signed in with Google
              </span>
            )}
            {joinedLabel && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                Member since {joinedLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-mist p-4 text-center">
              <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${stat.tint}`}>
                <stat.icon className="h-4 w-4" />
              </span>
              <p className="mt-2.5 text-2xl font-bold text-ink">{stat.value}</p>
              <p className="text-xs text-slate">{stat.label}</p>
            </div>
          ))}
        </div>

        {totalBudget > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-mist p-4">
            <span className="flex items-center gap-2 text-sm text-slate">
              <IndianRupee className="h-4 w-4" />
              Total planned across active trips
            </span>
            <span className="text-lg font-bold text-ink">₹{totalBudget.toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-mist p-5">
          <p className="mb-4 text-sm font-semibold text-ink">Account</p>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate">Email</span>
              <span className="text-ink">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate">Sign-in method</span>
              <span className="text-ink">{isGoogleAccount ? 'Google' : 'Email & Password'}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-mist py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  )
}
