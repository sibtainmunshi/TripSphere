import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { useAuthStore } from '@/store/authStore'
import { login } from '@/services/authApi'
import { getApiErrorMessage } from '@/services/api'
import { ContinueWithGoogleButton } from './ContinueWithGoogleButton'
import { ContinueWithAppleButton } from './ContinueWithAppleButton'
import { loginSchema, type LoginValues } from './schemas'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setSession = useAuthStore((state) => state.setSession)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginValues) => {
    setFormError(null)
    try {
      const { user, access, refresh } = await login(values.email, values.password)
      setSession(user, access, refresh)
      // A join link (/join/:token) sends people here with ?redirect=... when
      // they're not logged in yet — send them back to finish joining
      // instead of dropping them on the dashboard.
      navigate(searchParams.get('redirect') || '/', { replace: true })
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not log in. Check your email and password.'))
    }
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

      <TextField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter your password"
        startIcon={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        endAdornment={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="text-slate hover:text-ink"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...register('password')}
      />

      <div className="-mt-3 flex justify-end">
        <Link to="/forgot-password" className="text-sm font-medium text-ocean hover:text-ocean-dark">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 rounded-lg bg-navy py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Log In
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-mist" />
        <span className="text-xs text-slate">or continue with</span>
        <div className="h-px flex-1 bg-mist" />
      </div>

      <div className="flex flex-col gap-3">
        <ContinueWithGoogleButton />
        <ContinueWithAppleButton />
      </div>

      <p className="text-center text-sm text-slate">
        Don&rsquo;t have an account?{' '}
        <Link
          to={{ pathname: '/signup', search: searchParams.toString() }}
          className="font-semibold text-ocean hover:text-ocean-dark"
        >
          Sign up
        </Link>
      </p>
    </form>
  )
}
