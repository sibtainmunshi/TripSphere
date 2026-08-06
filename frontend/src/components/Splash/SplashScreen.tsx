import { motion, type Variants } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Route, Briefcase, Camera, Heart } from 'lucide-react'
import logoMark from '@/assets/logo.png'
import splashBg from '@/assets/splash-bg.jpg'

const HOLD_AFTER_ENTRANCE_MS = 1600
const SAFETY_TIMEOUT_MS = 5000
const EASE_OUT = [0.16, 1, 0.3, 1] as const

const FEATURES = [
  { icon: Route, label: 'Plan Together' },
  { icon: Briefcase, label: 'Track Everything' },
  { icon: Camera, label: 'Share Memories' },
  { icon: Heart, label: 'Relive Forever' },
]

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.11,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
}

const logoVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE_OUT } },
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
      className="fixed inset-0 z-50 overflow-hidden bg-navy-dark"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${splashBg})` }}
        initial={{ scale: 1 }}
        animate={{ scale: 1.04 }}
        transition={{ duration: 5, ease: 'linear' }}
      />

      <div className="relative flex h-full flex-col items-center">
        {/* Corner brand kicker */}
        <motion.div
          variants={fadeIn}
          className="absolute top-[clamp(1.25rem,4vh,2.75rem)] left-[clamp(1.25rem,3.5vw,2.75rem)]"
        >
          <p className="text-[10px] leading-relaxed font-medium tracking-[0.35em] text-mist/70 uppercase sm:text-xs">
            Your Journey
            <br />
            Our Workspace
          </p>
          <div className="mt-2 h-[2px] w-10 bg-sky" />
        </motion.div>

        {/* Corner dot grid */}
        <motion.div
          variants={fadeIn}
          className="absolute top-[clamp(1.25rem,4vh,2.75rem)] right-[clamp(1.25rem,3.5vw,2.75rem)] grid grid-cols-5 gap-3 sm:gap-4"
        >
          {Array.from({ length: 15 }).map((_, i) => (
            <span key={i} className="h-[3px] w-[3px] rounded-full bg-white/35" />
          ))}
        </motion.div>

        {/* Center brand block */}
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-[20vh] sm:pb-[22vh]">
          <motion.div variants={logoVariants} className="relative">
            <div className="absolute inset-0 -m-5 rounded-full bg-sky/25 blur-2xl" />
            <img
              src={logoMark}
              alt=""
              className="relative h-[clamp(5.5rem,12vw,11rem)] w-[clamp(5.5rem,12vw,11rem)] drop-shadow-lg"
            />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-[clamp(2.5rem,5.5vw,4.75rem)] font-bold tracking-tight text-white drop-shadow-sm"
          >
            TripSphere
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-[clamp(0.8rem,1.3vw,1.125rem)] text-center font-medium tracking-[0.3em] text-sky uppercase"
          >
            Your Journey, Our Workspace.
          </motion.p>

          <motion.div
            variants={fadeIn}
            onAnimationComplete={handleEntranceComplete}
            className="relative mt-2 h-px w-44 overflow-hidden bg-white/15"
          >
            <motion.div
              className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-sky to-transparent"
              initial={{ x: '-100%' }}
              animate={entered ? { x: '350%' } : undefined}
              transition={{ duration: 1.1, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.25 }}
            />
          </motion.div>
        </div>

        {/* Feature row */}
        <motion.div
          variants={fadeUp}
          className="absolute inset-x-0 bottom-[13%] flex justify-center px-6 sm:bottom-[15%]"
        >
          <div className="flex items-start divide-x divide-white/15">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2.5 px-4 sm:px-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-sky/40 sm:h-14 sm:w-14">
                  <Icon className="h-4 w-4 text-sky sm:h-5 sm:w-5" strokeWidth={1.75} />
                </div>
                <span className="text-center text-[9px] font-medium tracking-[0.2em] text-white/75 uppercase sm:text-[11px]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
