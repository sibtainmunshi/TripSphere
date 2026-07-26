import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-mist bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setDark(false)}
        aria-label="Light mode"
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
          dark ? 'text-slate' : 'bg-cream text-gold-dark'
        }`}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setDark(true)}
        aria-label="Dark mode"
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
          dark ? 'bg-navy text-white' : 'text-slate'
        }`}
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  )
}
