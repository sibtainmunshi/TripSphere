import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  startIcon?: ReactNode
  endAdornment?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, startIcon, endAdornment, id, className, ...props },
  ref,
) {
  const inputId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {startIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate">
            {startIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate/60 focus:border-ocean focus:ring-1 focus:ring-ocean ${
            error ? 'border-red-300' : 'border-mist'
          } ${startIcon ? 'pl-10' : ''} ${endAdornment ? 'pr-10' : ''} ${className ?? ''}`}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-3 flex items-center">{endAdornment}</div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})
