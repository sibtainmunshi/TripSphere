import { SignupForm } from '@/features/auth/SignupForm'

export function Signup() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-navy">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate">Start planning your next trip together</p>
      </div>
      <SignupForm />
    </div>
  )
}
