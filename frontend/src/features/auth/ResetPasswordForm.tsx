import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { confirmPasswordReset } from '@/services/authApi'
import { getApiErrorMessage } from '@/services/api'
import { resetPasswordSchema, type ResetPasswordValues } from './schemas'

interface ResetPasswordFormProps {
  uid: string
  token: string
}

export function ResetPasswordForm({ uid, token }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = async (values: ResetPasswordValues) => {
    setFormError(null)
    try {
      await confirmPasswordReset(uid, token, values.password)
      setDone(true)
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not reset your password. Please try again.')
      if (message.toLowerCase().includes('password')) {
        setError('password', { message })
      } else {
        setFormError(message)
      }
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mint">
          <CheckCircle2 className="h-5 w-5 text-sea" />
        </div>
        <p className="text-sm text-slate">Your password has been updated.</p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="mt-1 text-sm font-semibold text-ocean hover:text-ocean-dark"
        >
          Continue to log in
        </button>
      </div>
    )
  }

  const toggleButton = (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => setShowPassword((v) => !v)}
      className="text-slate hover:text-ink"
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{formError}</p>
      )}

      <TextField
        label="New password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter your new password"
        startIcon={<Lock className="h-4 w-4" />}
        endAdornment={toggleButton}
        error={errors.password?.message}
        {...register('password')}
      />

      <TextField
        label="Confirm new password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Re-enter your new password"
        startIcon={<Lock className="h-4 w-4" />}
        endAdornment={toggleButton}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-navy py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Update Password
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
