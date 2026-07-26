import { create } from 'zustand'
import { fetchMe, type AuthUser } from '@/services/authApi'
import { useTripStore } from './tripStore'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  hasHydrated: boolean
  setSession: (user: AuthUser, accessToken: string, refreshToken: string) => void
  setAccessToken: (accessToken: string) => void
  clearSession: () => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: Boolean(localStorage.getItem('accessToken')),
  hasHydrated: false,
  setSession: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ user, accessToken, refreshToken, isAuthenticated: true, hasHydrated: true })
  },
  setAccessToken: (accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    set({ accessToken })
  },
  clearSession: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, hasHydrated: true })
    // Don't leak the previous session's trips into whoever logs in next in this tab.
    useTripStore.getState().reset()
  },
  // Runs once on app boot. A stored access token doesn't mean it's still
  // valid — this is the real check, via /auth/me/, that rehydrates `user`
  // after a page reload (or clears the session if the token is dead).
  hydrate: async () => {
    if (!get().accessToken) {
      set({ hasHydrated: true })
      return
    }
    try {
      const user = await fetchMe()
      set({ user, isAuthenticated: true, hasHydrated: true })
    } catch {
      get().clearSession()
    }
  },
}))
