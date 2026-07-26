import { Bot, MapPin } from 'lucide-react'
import heroImage from '@/assets/login-bg.jpg'
import { WelcomeNotificationCard } from './WelcomeNotificationCard'
import { PlanOptionCard } from './PlanOptionCard'
import { DestinationInspirationCard } from './DestinationInspirationCard'
import { INSPIRATION_DESTINATIONS } from './destinationInspiration'

interface FirstTimeHomeProps {
  name: string
  avatarUrl?: string
}

export function FirstTimeHome({ name, avatarUrl }: FirstTimeHomeProps) {
  return (
    <div className="relative min-h-full">
      <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-navy/10 to-navy/20" />

      <div className="relative flex justify-end px-8 pt-8">
        <WelcomeNotificationCard name={name} avatarUrl={avatarUrl} />
      </div>

      <div className="relative flex flex-col items-center px-6 pt-10 pb-16 text-center">
        <h1 className="text-4xl font-bold text-navy drop-shadow-sm">
          Welcome to TripSphere! <span className="text-gold">✨</span>
        </h1>
        <p className="mt-3 text-lg text-ink/80 drop-shadow-sm">
          Every journey begins with a plan.
          <br />
          Let&rsquo;s create your first trip <span className="text-ocean">💙</span>
        </p>

        <div className="mt-10 grid w-full max-w-3xl gap-6 sm:grid-cols-2">
          <PlanOptionCard
            to="/trips/new/ai"
            icon={Bot}
            title="Plan with AI"
            description="Let our AI travel assistant craft the perfect itinerary for you."
            ctaLabel="Plan with AI"
            tint="sky"
          />
          <PlanOptionCard
            to="/trips/new/manual"
            icon={MapPin}
            title="Create Manually"
            description="I already know where I want to go. Let me create my trip workspace."
            ctaLabel="Create Manually"
            tint="mint"
          />
        </div>

        <p className="mt-5 text-sm text-ink/60 italic">Two ways to start, endless adventures!</p>
      </div>

      <div className="relative mx-4 mb-8 rounded-3xl bg-white p-6 shadow-xl sm:mx-8 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">
              Need Inspiration? <span>🌍</span>
            </h2>
            <p className="mt-0.5 text-sm text-slate">Popular destinations loved by travelers like you.</p>
          </div>
          <span className="hidden shrink-0 text-sm font-medium text-ocean sm:inline">
            Explore all destinations →
          </span>
        </div>

        <div className="scrollbar-none mt-5 flex gap-4 overflow-x-auto pb-1">
          {INSPIRATION_DESTINATIONS.map((destination) => (
            <DestinationInspirationCard key={destination.name} destination={destination} />
          ))}
        </div>
      </div>
    </div>
  )
}
