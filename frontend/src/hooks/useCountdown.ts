import { useEffect, useState } from 'react'

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

function computeCountdown(target: number): Countdown {
  const diff = target - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isPast: false,
  }
}

// Real, live countdown to a trip's start date — ticks every second off the
// actual date, not a fabricated/static number.
export function useCountdown(targetDate: string): Countdown {
  const target = new Date(targetDate).getTime()
  const [countdown, setCountdown] = useState(() => computeCountdown(target))

  useEffect(() => {
    setCountdown(computeCountdown(target))
    const interval = setInterval(() => setCountdown(computeCountdown(target)), 1000)
    return () => clearInterval(interval)
  }, [target])

  return countdown
}
