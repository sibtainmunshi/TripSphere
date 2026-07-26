import { Link, useSearchParams } from 'react-router-dom'
import { ResetPasswordForm } from '@/features/auth/ResetPasswordForm'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  if (!uid || !token) {
    return (
      <div>
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-navy">Invalid reset link</h1>
          <p className="mt-1.5 text-sm text-slate">
            This link is missing some details. Request a new one from the forgot password page.
          </p>
        </div>
        <Link to="/forgot-password" className="text-sm font-semibold text-ocean hover:text-ocean-dark">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-navy">Set a new password</h1>
        <p className="mt-1.5 text-sm text-slate">Choose something you haven&rsquo;t used before</p>
      </div>
      <ResetPasswordForm uid={uid} token={token} />
    </div>
  )
}
