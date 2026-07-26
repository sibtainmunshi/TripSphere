import { motion, type Variants } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import splashBg from '@/assets/splash-bg.jpg'

const HOLD_AFTER_ENTRANCE_MS = 1600
const SAFETY_TIMEOUT_MS = 5000
const EASE_OUT = [0.16, 1, 0.3, 1] as const

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.15,
      staggerChildren: 0.14,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
}

const wordmarkVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
}

const taglineVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
}

const trackVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
}

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  const finishedRef = useRef(false)
  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    onFinishRef.current()
  }

  // Safety net: never let the splash outlive this, even if the browser
  // never fires the entrance's onAnimationComplete (e.g. reduced-motion,
  // a stalled tab, or a device too slow to composite).
  useEffect(() => {
    const timer = setTimeout(finish, SAFETY_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  const [entered, setEntered] = useState(false)
  const enteredRef = useRef(false)
  const handleEntranceComplete = () => {
    if (enteredRef.current) return
    enteredRef.current = true
    setEntered(true)
    setTimeout(finish, HOLD_AFTER_ENTRANCE_MS)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-black"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${splashBg})` }}
        initial={{ scale: 1 }}
        animate={{ scale: 1.06 }}
        transition={{ duration: 4, ease: 'linear' }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)]" />

      <div className="relative flex h-full flex-col items-center justify-center gap-5 px-6">
        <motion.h1
          variants={wordmarkVariants}
          className="text-4xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-5xl"
        >
          TripSphere
        </motion.h1>

        <motion.p
          variants={taglineVariants}
          className="max-w-xs text-center text-sm leading-relaxed text-white/80 drop-shadow-sm sm:max-w-sm sm:text-base"
        >
          From &ldquo;Where should we go?&rdquo; to &ldquo;Remember that
          trip?&rdquo; — Everything in one place.
        </motion.p>

        <motion.div
          variants={trackVariants}
          onAnimationComplete={handleEntranceComplete}
          className="mt-3 h-[3px] w-28 overflow-hidden rounded-full bg-white/20"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#E8B466] to-[#C1663B]"
            style={{ transformOrigin: 'left' }}
            initial={{ scaleX: 0 }}
            animate={entered ? { scaleX: 1 } : undefined}
            transition={{ duration: HOLD_AFTER_ENTRANCE_MS / 1000, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
