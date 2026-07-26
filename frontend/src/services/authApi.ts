import { api } from './api'

export interface AuthUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
  joinedAt?: string
}

interface AuthResponse {
  access: string
  refresh: string
  user: AuthUser
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register/', { name, email, password })
  return data
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login/', { email, password })
  return data
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me/')
  return data
}

export async function googleLogin(credential: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/google/', { credential })
  return data
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post('/auth/password-reset/', { email })
}

export async function confirmPasswordReset(uid: string, token: string, password: string): Promise<void> {
  await api.post('/auth/password-reset/confirm/', { uid, token, password })
}
