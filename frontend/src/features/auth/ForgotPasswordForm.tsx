import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, Mail, MailCheck } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { requestPasswordReset } from '@/services/authApi'
import { getApiErrorMessage } from '@/services/api'
import { forgotPasswordSchema, type ForgotPasswordValues } from './schemas'

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (values: ForgotPasswordValues) => {
    setFormError(null)
    try {
      await requestPasswordReset(values.email)
      setSentTo(values.email)
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not send the reset link. Please try again.'))
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mint">
          <MailCheck className="h-5 w-5 text-sea" />
        </div>
        <p className="text-sm text-slate">
          If an account exists for <span className="font-medium text-navy">{sentTo}</span>, a
          reset link is on its way.
        </p>
        <Link to="/login" className="mt-1 text-sm font-semibold text-ocean hover:text-ocean-dark">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{formError}</p>
      )}

      <TextField
        label="Email or Phone Number"
        type="email"
        placeholder="Enter your email or phone number"
        startIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 rounded-lg bg-navy py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Send Reset Link
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-slate">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-ocean hover:text-ocean-dark">
          Back to log in
        </Link>
      </p>
    </form>
  )
}
