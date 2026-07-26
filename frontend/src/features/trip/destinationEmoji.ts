// A small, honest decoration next to the trip name — matched from real
// words in the destination text (same keyword-matching idea as
// destinationImagery.ts), not a guess. Falls back to a generic travel
// emoji rather than picking something that might not fit.
const EMOJI_RULES: { keywords: string[]; emoji: string }[] = [
  { keywords: ['goa', 'beach', 'coast', 'island', 'bali', 'maldives'], emoji: '🌴' },
  { keywords: ['manali', 'shimla', 'mountain', 'hill', 'himalaya', 'trek', 'ladakh', 'snow'], emoji: '🏔️' },
  { keywords: ['dubai', 'singapore', 'new york', 'tokyo', 'city', 'mumbai', 'delhi'], emoji: '🏙️' },
  { keywords: ['udaipur', 'jaipur', 'rajasthan', 'palace', 'fort'], emoji: '🏰' },
  { keywords: ['kerala', 'lake', 'backwater', 'river'], emoji: '🛶' },
  { keywords: ['forest', 'jungle', 'wildlife', 'safari'], emoji: '🌲' },
]

export function getDestinationEmoji(destination: string): string {
  const value = destination.toLowerCase()
  const match = EMOJI_RULES.find((rule) => rule.keywords.some((keyword) => value.includes(keyword)))
  return match ? match.emoji : '✈️'
}
