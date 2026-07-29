import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  ChevronDown,
  Home,
  Settings as SettingsIcon,
  Sparkles,
  User as UserIcon,
} from 'lucide-react'
import logo from '@/assets/logo.png'
import { Avatar } from './Avatar'
import { useAuthStore } from '@/store/authStore'

const NAV_ITEMS_TOP = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/trips', label: 'Trips', icon: Briefcase, end: false },
  { to: '/trips/new/ai', label: 'AI Planner', icon: Sparkles, end: false },
]

const NAV_ITEMS_BOTTOM = [
  { to: '/profile', label: 'Profile', icon: UserIcon, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
]

// No real notifications exist yet (nothing in the app generates them) — the
// badge only ever shows once something actually needs the user's attention.
const NOTIFICATION_COUNT = 0

export function Sidebar() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleLogout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-mist bg-white">
      <NavLink to="/" className="flex items-center gap-2.5 px-6 py-6">
        <img src={logo} alt="" className="h-8 w-8" />
        <span className="text-lg font-bold text-navy">TripSphere</span>
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS_TOP.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-ocean/10 text-ocean' : 'text-slate hover:bg-cream hover:text-ink'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}

        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((open) => !open)}
            className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
              notificationsOpen ? 'bg-ocean/10 text-ocean' : 'text-slate hover:bg-cream hover:text-ink'
            }`}
          >
            <span className="flex items-center gap-3">
              <Bell className="h-4.5 w-4.5" />
              Notifications
            </span>
            {NOTIFICATION_COUNT > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ocean text-xs font-semibold text-white">
                {NOTIFICATION_COUNT}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute top-full left-0 z-10 mt-1 w-full rounded-lg border border-mist bg-white p-4 shadow-lg">
              <p className="text-sm text-slate">You&rsquo;re all caught up — no notifications yet.</p>
            </div>
          )}
        </div>

        {NAV_ITEMS_BOTTOM.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-ocean/10 text-ocean' : 'text-slate hover:bg-cream hover:text-ink'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="relative border-t border-mist p-3">
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-cream"
        >
          <Avatar name={user?.name ?? 'You'} imageUrl={user?.avatarUrl} />
          <span className="flex-1 truncate text-sm font-medium text-ink">
            {user?.name ?? 'Your account'}
          </span>
          <ChevronDown className="h-4 w-4 text-slate" />
        </button>

        {menuOpen && (
          <div className="absolute bottom-full left-3 mb-1 w-[calc(100%-1.5rem)] overflow-hidden rounded-lg border border-mist bg-white shadow-lg">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-cream"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
