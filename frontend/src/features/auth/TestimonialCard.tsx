import { Heart } from 'lucide-react'
import thumbnail from '@/assets/dest-mountains.jpg'

export function TestimonialCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-md">
      <img src={thumbnail} alt="" className="h-10 w-10 rounded-full object-cover" />
      <p className="flex-1 text-sm text-white italic">
        &ldquo;Not just a trip planner, it&rsquo;s the home of your journeys.&rdquo;
      </p>
      <Heart className="h-4 w-4 shrink-0 fill-sky text-sky" />
    </div>
  )
}
