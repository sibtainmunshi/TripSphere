import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<{ access: string }>(`${api.defaults.baseURL}/auth/refresh/`, {
      refresh: refreshToken,
    })
    useAuthStore.getState().setAccessToken(data.access)
    return data.access
  } catch {
    return null
  }
}

// A single 401 triggers one shared refresh attempt (even if several requests
// fail at once) and retries the original request with the new token. If the
// refresh itself fails, the session is real gone — log out rather than loop.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newToken = await refreshPromise
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
      useAuthStore.getState().clearSession()
    }
    return Promise.reject(error)
  },
)

// DRF error responses look like {"detail": "..."} for auth failures or
// {"email": ["already exists"]} for serializer validation — this pulls out
// whichever message is actually there instead of a generic string.
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined
    if (data) {
      if (typeof data.detail === 'string') return data.detail
      const firstValue = Object.values(data)[0]
      if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') return firstValue[0]
    }
  }
  return fallback
}
