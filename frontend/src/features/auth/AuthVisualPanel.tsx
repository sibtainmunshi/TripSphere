import { Image as ImageIcon, TrendingUp, Users, Wallet } from 'lucide-react'
import logo from '@/assets/logo.png'
import { FeatureRow } from './FeatureRow'
import { TestimonialCard } from './TestimonialCard'

const FEATURES = [
  {
    icon: Users,
    title: 'Plan Together',
    subtitle: 'Collaborate with friends and family',
    iconClassName: 'bg-sky/25 text-ocean',
  },
  {
    icon: Wallet,
    title: 'Track Everything',
    subtitle: 'Expenses, bookings, checklists & more',
    iconClassName: 'bg-mint text-sea',
  },
  {
    icon: ImageIcon,
    title: 'Share Memories',
    subtitle: 'Photos, videos and unforgettable moments',
    iconClassName: 'bg-gold/25 text-gold-dark',
  },
  {
    icon: TrendingUp,
    title: 'Relive Forever',
    subtitle: 'Timeline, stats and trip replay',
    iconClassName: 'bg-lavender/25 text-lavender-dark',
  },
]

export function AuthVisualPanel() {
  return (
    <div className="flex w-full flex-col justify-between px-10 py-10 text-white xl:px-14 xl:py-12">
      <div className="flex flex-col gap-9">
        <div className="flex items-center gap-3">
          <img src={logo} alt="" className="h-11 w-11 drop-shadow-md" />
          <span className="text-2xl font-bold drop-shadow-md">TripSphere</span>
        </div>

        <div>
          <h1 className="text-4xl leading-tight font-bold drop-shadow-lg xl:text-[2.65rem]">
            From &ldquo;Where should we go?&rdquo; to{' '}
            <span className="text-sky">&ldquo;Remember that trip?&rdquo;</span>
          </h1>
          <p className="mt-3 text-lg text-white/80 drop-shadow-md">
            Everything in One Collaborative Workspace.
          </p>
        </div>

        <div className="h-px bg-white/15" />

        <div className="flex flex-col gap-5">
          {FEATURES.map((feature) => (
            <FeatureRow key={feature.title} {...feature} />
          ))}
        </div>
      </div>

      <div className="mt-10">
        <TestimonialCard />
      </div>
    </div>
  )
}
