import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { googleLogin } from '@/services/authApi'
import { GoogleIcon } from '@/components/GoogleIcon'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const MAX_SCRIPT_WAIT_ATTEMPTS = 50 // ~5s at 100ms intervals

// Renders Google's own "Sign in with Google" button (via Identity Services) —
// not a custom-styled one, since GIS's supported styling (outline/filled,
// pill/rectangular) only goes so far and a pixel-exact custom button would
// need a fragile transparent-overlay hack on top of Google's real iframe.
// Using their real button is also the standard, most-trusted UX pattern.
export function ContinueWithGoogleButton() {
  const containerRef = useRef<HTMLDivElement>(null)
  const setSession = useAuthStore((state) => state.setSession)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [scriptFailed, setScriptFailed] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false
    let attempts = 0

    const handleCredential = async (response: { credential: string }) => {
      try {
        const { user, access, refresh } = await googleLogin(response.credential)
        setSession(user, access, refresh)
        // A join link (/join/:token) sends people here with ?redirect=...
        // when they're not logged in yet — send them back to finish
        // joining instead of dropping them on the dashboard.
        navigate(searchParams.get('redirect') || '/', { replace: true })
      } catch {
        setScriptFailed(true)
      }
    }

    const trySetup = () => {
      if (cancelled) return
      if (!window.google || !containerRef.current) {
        attempts += 1
        if (attempts >= MAX_SCRIPT_WAIT_ATTEMPTS) {
          setScriptFailed(true)
          return
        }
        setTimeout(trySetup, 100)
        return
      }
      const width = Math.round(containerRef.current.getBoundingClientRect().width) || 320
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredential })
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        width,
        text: 'continue_with',
        logo_alignment: 'left',
      })
    }
    trySetup()

    return () => {
      cancelled = true
    }
  }, [setSession, navigate, searchParams])

  if (!GOOGLE_CLIENT_ID || scriptFailed) {
    return (
      <button
        type="button"
        disabled
        title={!GOOGLE_CLIENT_ID ? "Google sign-in isn't configured yet" : 'Google sign-in is unavailable right now'}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-mist bg-white py-2.5 text-sm font-medium text-slate opacity-60"
      >
        <GoogleIcon className="h-4 w-4" />
        Continue with Google
      </button>
    )
  }

  return <div ref={containerRef} className="flex w-full justify-center" />
}
