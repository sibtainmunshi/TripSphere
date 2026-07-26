import destMountains from '@/assets/dest-mountains.jpg'
import destLakes from '@/assets/dest-lakes.jpg'

// Real project photography, matched by keyword. Add more entries here as more
// destination photos land in the repo (e.g. a beach shot for Goa, a skyline
// for Dubai). Returns null rather than guessing — showing no photo beats
// showing the wrong one.
const IMAGE_RULES: { keywords: string[]; image: string }[] = [
  { keywords: ['manali', 'mountain', 'hill', 'snow', 'trek', 'himalaya'], image: destMountains },
  { keywords: ['udaipur', 'lake', 'palace', 'royal', 'rajasthan'], image: destLakes },
]

export function getDestinationImage(destination: string): string | null {
  const value = destination.toLowerCase()
  const match = IMAGE_RULES.find((rule) => rule.keywords.some((keyword) => value.includes(keyword)))
  return match ? match.image : null
}
