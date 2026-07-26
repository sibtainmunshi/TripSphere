import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { ResetPassword } from '@/pages/ResetPassword'
import { PlanTripAi } from '@/pages/PlanTripAi'
import { PlanTripManual } from '@/pages/PlanTripManual'
import { TripWorkspace } from '@/pages/TripWorkspace'
import { Trips } from '@/pages/Trips'
import { Profile } from '@/pages/Profile'
import { Settings } from '@/pages/Settings'
import { NotFound } from '@/pages/NotFound'
import { SplashScreen } from '@/components/Splash/SplashScreen'
import { useAuthStore } from '@/store/authStore'
import { TripOverview } from '@/features/trip/TripOverview'
import { TripSettings } from '@/features/trip/TripSettings'
import { ModulePlaceholder } from '@/features/trip/ModulePlaceholder'
import { REAL_MODULE_PATHS, TRIP_MODULES } from '@/features/trip/tripModules'
import { Bookings } from '@/features/trip/travelHub/Bookings'
import { TravelDocumentsPage } from '@/features/trip/travelHub/TravelDocumentsPage'
import { ExpensesPage } from '@/features/trip/budgetPlanner/ExpensesPage'

function AppShell() {
  const [showSplash, setShowSplash] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const handleSplashFinish = () => {
    setShowSplash(false)
    // Deep links (e.g. a shared /signup or /forgot-password URL) survive the
    // splash untouched. Only the ambiguous "/" entry point gets redirected
    // based on auth state.
    if (location.pathname !== '/') return
    navigate(isAuthenticated ? '/' : '/login', { replace: true })
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" onFinish={handleSplashFinish} />}
      </AnimatePresence>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="trips" element={<Trips />} />
          <Route path="trips/new/ai" element={<PlanTripAi />} />
          <Route path="trips/new/manual" element={<PlanTripManual />} />
          <Route path="trips/:tripId" element={<TripWorkspace />}>
            <Route index element={<TripOverview />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="documents" element={<TravelDocumentsPage />} />
            <Route path="settings" element={<TripSettings />} />
            {TRIP_MODULES.filter((module) => module.path && !REAL_MODULE_PATHS.has(module.path)).map((module) => (
              <Route
                key={module.path}
                path={module.path}
                element={
                  <ModulePlaceholder
                    icon={module.icon}
                    title={module.label}
                    description={module.description ?? ''}
                    milestone={module.milestone ?? ''}
                  />
                }
              />
            ))}
          </Route>
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
