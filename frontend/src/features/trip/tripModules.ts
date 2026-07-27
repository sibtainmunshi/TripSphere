import {
  CalendarDays,
  FileText,
  History,
  Images,
  LayoutGrid,
  ListChecks,
  MapPinned,
  MessageCircle,
  Settings as SettingsIcon,
  StickyNote,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface TripModule {
  path: string // relative to /trips/:tripId — '' means the index/Overview route
  label: string
  icon: LucideIcon
  end: boolean
  /** Real pages set neither — only unbuilt modules show a "Coming in..." placeholder. */
  description?: string
  milestone?: string
}

// Single source of truth for both the trip sidebar and its nested routes.
// Structure follows the user-supplied reference design (light theme, not the
// reference's dark one — kept consistent with the rest of the app).
export const TRIP_MODULES: TripModule[] = [
  { path: '', label: 'Overview', icon: LayoutGrid, end: true },
  {
    path: 'itinerary',
    label: 'Itinerary',
    icon: CalendarDays,
    end: false,
    description: "A day-by-day plan for the trip — what you're doing, when, and where.",
    milestone: 'Milestone 4',
  },
  { path: 'expenses', label: 'Expenses', icon: Wallet, end: false },
  { path: 'chat', label: 'Chat', icon: MessageCircle, end: false },
  { path: 'bookings', label: 'Bookings', icon: MapPinned, end: false },
  {
    path: 'checklists',
    label: 'Checklists',
    icon: ListChecks,
    end: false,
    description: 'Packing lists and to-dos everyone on the trip can check off together.',
    milestone: 'Milestone 4',
  },
  { path: 'documents', label: 'Travel Documents', icon: FileText, end: false },
  {
    path: 'notes',
    label: 'Notes',
    icon: StickyNote,
    end: false,
    description: "Shared notes for anything that doesn't fit elsewhere.",
    milestone: 'Milestone 4',
  },
  { path: 'gallery', label: 'Gallery', icon: Images, end: false },
  { path: 'timeline', label: 'Timeline', icon: History, end: false },
  { path: 'settings', label: 'Settings', icon: SettingsIcon, end: false },
]

// Modules with real, working pages — everything else in TRIP_MODULES falls
// back to an honest ModulePlaceholder in the route table.
export const REAL_MODULE_PATHS = new Set([
  'bookings', 'documents', 'settings', 'expenses', 'chat', 'gallery', 'timeline',
])
