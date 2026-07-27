// Shared "which trip day did this happen on" logic — used by both Gallery
// (day albums) and Timeline (day-grouped activity feed) so the two features
// never drift into slightly different day-numbering rules.
export function getTripDayLabel(dateIso: string, tripStartDate: string): string {
  const date = new Date(dateIso)
  const start = new Date(tripStartDate)
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const dayNumber = Math.round((dateOnly.getTime() - startOnly.getTime()) / 86_400_000) + 1
  if (dayNumber >= 1) return `Day ${dayNumber}`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getTripDayKey(dateIso: string): string {
  const date = new Date(dateIso)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10)
}

export interface DayGroup<T> {
  key: string
  label: string
  items: T[]
}

export function groupByTripDay<T>(items: T[], getDate: (item: T) => string, tripStartDate: string): DayGroup<T>[] {
  const groups = new Map<string, DayGroup<T>>()
  for (const item of items) {
    const iso = getDate(item)
    const key = getTripDayKey(iso)
    if (!groups.has(key)) groups.set(key, { key, label: getTripDayLabel(iso, tripStartDate), items: [] })
    groups.get(key)!.items.push(item)
  }
  return Array.from(groups.values()).sort((a, b) => b.key.localeCompare(a.key))
}
