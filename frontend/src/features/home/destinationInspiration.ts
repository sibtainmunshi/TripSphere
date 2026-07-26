import { TreePalm, Mountain, Building2, type LucideIcon } from 'lucide-react'
import destMountains from '@/assets/dest-mountains.jpg'

export interface InspirationDestination {
  name: string
  country: string
  rating: number
  days: number
  price: string
  icon: LucideIcon
  image: string | null
  gradient: string
}

// Real photography only where it actually exists in the repo — Switzerland
// genuinely matches dest-mountains.jpg. The rest fall back to an honest
// brand-colored card rather than a mismatched or invented photo.
export const INSPIRATION_DESTINATIONS: InspirationDestination[] = [
  {
    name: 'Bali',
    country: 'Indonesia',
    rating: 4.8,
    days: 6,
    price: '₹45,000',
    icon: TreePalm,
    image: null,
    gradient: 'from-sea to-forest',
  },
  {
    name: 'Switzerland',
    country: '',
    rating: 4.9,
    days: 5,
    price: '₹95,000',
    icon: Mountain,
    image: destMountains,
    gradient: 'from-ocean to-navy',
  },
  {
    name: 'Goa',
    country: 'India',
    rating: 4.6,
    days: 4,
    price: '₹18,000',
    icon: TreePalm,
    image: null,
    gradient: 'from-gold to-gold-dark',
  },
  {
    name: 'Dubai',
    country: 'UAE',
    rating: 4.7,
    days: 5,
    price: '₹75,000',
    icon: Building2,
    image: null,
    gradient: 'from-lavender to-lavender-dark',
  },
]
