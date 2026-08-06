import { RefreshCw, Sparkles, MapPin } from 'lucide-react'
import heroImage from '@/assets/login-bg.jpg'
import logo from '@/assets/logo.png'
import aiCardImage from '@/assets/journey-ai-card.jpg'
import manualCardImage from '@/assets/journey-manual-card.jpg'
import { PlanOptionCard } from './PlanOptionCard'

interface FirstTimeHomeProps {
  name: string
  avatarUrl?: string
}

export function FirstTimeHome({ name }: FirstTimeHomeProps) {
  return (
    <div className="relative min-h-screen bg-navy">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[20%_55%] brightness-110 contrast-105 saturate-[1.12]"
      />
      {/* Warm glow around the sun (upper-right of the frame) to lift exposure without flattening contrast. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_38%,rgba(212,166,90,0.28),transparent_45%)] mix-blend-soft-light" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/55 via-navy/25 to-navy/50" />

      <div className="relative flex items-center px-6 pt-6 sm:px-10">
        <div className="flex items-center gap-2.5 text-white">
          <img src={logo} alt="" className="h-9 w-9 drop-shadow-md" />
          <span className="text-lg font-bold drop-shadow-md">TripSphere</span>
        </div>
      </div>

      <div className="relative flex flex-col items-center px-6 pt-6 pb-8 text-center backdrop-blur-[1.5px]">
        <p className="text-base font-medium text-white/85 sm:text-lg">
          Welcome, {name} <span className="text-sky">💙</span>
        </p>
        <h1 className="mt-2 max-w-2xl text-[2.1rem] leading-snug font-bold text-white drop-shadow-sm sm:text-[2.5rem]">
          Let&rsquo;s create your{' '}
          <span className="bg-gradient-to-r from-sky to-ocean bg-clip-text font-extrabold text-transparent drop-shadow-[0_0_22px_rgba(99,197,234,0.45)]">
            first journey
          </span>
          .
        </h1>
        <p className="mt-3 max-w-md text-white/75">
          Every unforgettable trip starts with a single workspace built just for you.
        </p>

        <div className="mt-10 grid w-full max-w-[840px] gap-6 sm:grid-cols-2">
          <PlanOptionCard
            to="/trips/new/ai"
            image={aiCardImage}
            imagePosition="object-[50%_78%]"
            icon={Sparkles}
            iconClassName="bg-lavender/30 text-white ring-1 ring-white/40"
            title="Plan with AI"
            description="Tell us your travel style and we'll craft the perfect itinerary for you."
            ctaLabel="Plan with AI"
            ctaClassName="bg-white text-ocean-dark hover:bg-cream"
            tone="dark"
          />
          <PlanOptionCard
            to="/trips/new/manual"
            image={manualCardImage}
            imagePosition="object-[68%_70%]"
            icon={MapPin}
            iconClassName="bg-white text-sea"
            title="Create Manually"
            description="Already know where you're headed? Set up your trip workspace yourself."
            ctaLabel="Create Manually"
            ctaClassName="bg-white text-sea hover:bg-cream"
            tone="light"
          />
        </div>

        <p className="mt-5 flex items-center gap-2 text-sm text-white/65">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
            <RefreshCw className="h-3.5 w-3.5" />
          </span>
          You can always switch between these options later.
        </p>
      </div>
    </div>
  )
}
