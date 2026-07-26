import { useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Plus } from 'lucide-react'
import logo from '@/assets/logo.svg'
import { Avatar } from './Avatar'
import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'
import { TRIP_MODULES } from '@/features/trip/tripModules'
import { getTripStatus } from '@/utils/tripStatus'

const STATUS_DOT: Record<string, string> = {
  planning: 'bg-gold-dark',
  in_progress: 'bg-ocean',
  completed: 'bg-sea',
}

export function TripSidebar() {
  const navigate = useNavigate()
  const { tripId } = useParams<{ tripId: string }>()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const trips = useTripStore((state) => state.trips)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-mist bg-white">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <img src={logo} alt="" className="h-8 w-8" />
        <span className="text-lg font-bold text-navy">TripSphere</span>
      </div>

      <div className="px-3">
        <NavLink
          to="/trips"
          className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium text-slate transition-colors hover:bg-cream hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all trips
        </NavLink>
      </div>

      <nav className="mt-2 flex flex-col gap-1 px-3">
        <p className="px-3.5 pb-1 text-xs font-semibold tracking-wide text-slate uppercase">Workspace</p>
        {TRIP_MODULES.map((module) => (
          <NavLink
            key={module.path}
            to={`/trips/${tripId}${module.path ? `/${module.path}` : ''}`}
            end={module.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-ocean/10 text-ocean' : 'text-slate hover:bg-cream hover:text-ink'
              }`
            }
          >
            <module.icon className="h-4.5 w-4.5" />
            {module.label}
          </NavLink>
        ))}
      </nav>

      <div className="scrollbar-none mt-5 flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between px-3.5 pb-1">
          <p className="text-xs font-semibold tracking-wide text-slate uppercase">Your Trips</p>
          <NavLink to="/trips" aria-label="Create new trip" className="text-slate hover:text-ink">
            <Plus className="h-3.5 w-3.5" />
          </NavLink>
        </div>
        <div className="flex flex-col gap-0.5">
          {trips
            .filter((trip) => !trip.archived)
            .map((trip) => {
              const status = getTripStatus(trip)
              return (
                <NavLink
                  key={trip.id}
                  to={`/trips/${trip.id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-sm transition-colors ${
                      isActive ? 'bg-ocean/10 text-ocean' : 'text-slate hover:bg-cream hover:text-ink'
                    }`
                  }
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                  <span className="flex-1 truncate">{trip.name}</span>
                </NavLink>
              )
            })}
        </div>
      </div>

      <div className="relative border-t border-mist p-3">
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-cream"
        >
          <Avatar name={user?.name ?? 'You'} imageUrl={user?.avatarUrl} />
          <span className="flex-1 truncate text-sm font-medium text-ink">{user?.name ?? 'Your account'}</span>
          <ChevronDown className="h-4 w-4 text-slate" />
        </button>

        {menuOpen && (
          <div className="absolute bottom-full left-3 mb-1 w-[calc(100%-1.5rem)] overflow-hidden rounded-lg border border-mist bg-white shadow-lg">
            <button onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-cream">
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
