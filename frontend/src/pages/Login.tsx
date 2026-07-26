import { LoginForm } from '@/features/auth/LoginForm'

export function Login() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-navy">Welcome back 👋</h1>
        <p className="mt-1.5 text-sm text-slate">Log in to continue your journeys</p>
      </div>
      <LoginForm />
    </div>
  )
}
