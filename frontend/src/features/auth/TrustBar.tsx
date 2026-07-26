import { Cloud, ShieldCheck, Users } from 'lucide-react'

const ITEMS = [
  { icon: ShieldCheck, text: 'Your data is safe and encrypted' },
  { icon: Users, text: 'Trusted by travelers worldwide' },
  { icon: Cloud, text: 'Access your trips from anywhere' },
]

export function TrustBar() {
  return (
    <div className="grid grid-cols-1 gap-3 border-t border-mist bg-cream/60 px-6 py-5 sm:grid-cols-3 sm:px-12">
      {ITEMS.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0 text-slate" />
          <span className="text-xs text-slate">{text}</span>
        </div>
      ))}
    </div>
  )
}
