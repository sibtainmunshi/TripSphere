import { useState } from 'react'
import { X } from 'lucide-react'
import { Avatar } from '@/components/Avatar'

interface WelcomeNotificationCardProps {
  name: string
  avatarUrl?: string
}

export function WelcomeNotificationCard({ name, avatarUrl }: WelcomeNotificationCardProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/90 py-3 pr-3 pl-4 shadow-lg backdrop-blur-md">
      <span className="text-lg">👋</span>
      <div className="pr-2">
        <p className="text-sm font-semibold text-ink">Hey there, {name}!</p>
        <p className="text-xs text-slate">Let&rsquo;s plan something amazing</p>
      </div>
      <Avatar name={name} imageUrl={avatarUrl} className="h-9 w-9 text-sm" />
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss notification"
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-slate hover:bg-mist hover:text-ink"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
