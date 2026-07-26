import { ForgotPasswordForm } from '@/features/auth/ForgotPasswordForm'

export function ForgotPassword() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-navy">Reset your password</h1>
        <p className="mt-1.5 text-sm text-slate">We&rsquo;ll email you a link to get back in</p>
      </div>
      <ForgotPasswordForm />
    </div>
  )
}
