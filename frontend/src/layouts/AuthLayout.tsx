import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import bgImage from '@/assets/login-bg.jpg'
import { AuthVisualPanel } from '@/features/auth/AuthVisualPanel'
import { ThemeToggle } from '@/features/auth/ThemeToggle'
import { TrustBar } from '@/features/auth/TrustBar'

export function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-navy">
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[20%_55%]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/50 via-navy/10 to-navy/55" />

      <div className="relative flex min-h-screen">
        <div className="hidden lg:flex lg:flex-[1.2]">
          <AuthVisualPanel />
        </div>

        <div className="flex w-full flex-1 items-center justify-center lg:p-4">
          <div className="relative flex h-screen w-full flex-col bg-white lg:h-[calc(100vh-2rem)] lg:max-w-[560px] lg:overflow-hidden lg:rounded-2xl lg:shadow-2xl">
            <div className="absolute top-6 right-6 z-10">
              <ThemeToggle />
            </div>

            <div className="scrollbar-none flex flex-1 items-center justify-center overflow-y-auto px-6 py-16 sm:px-12">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg"
              >
                <Outlet />
              </motion.div>
            </div>

            <TrustBar />
          </div>
        </div>
      </div>
    </div>
  )
}
