import { Check } from 'lucide-react'

const DEFAULT_STEPS = ['Destination', 'Preferences', 'Travelers', 'Budget', 'Review & Create']

interface StepIndicatorProps {
  currentStep: number
  steps?: string[]
}

export function StepIndicator({ currentStep, steps = DEFAULT_STEPS }: StepIndicatorProps) {
  return (
    <div className="scrollbar-none flex items-center overflow-x-auto px-4 py-5 sm:px-8">
      {steps.map((label, index) => {
        const step = index + 1
        const isActive = step === currentStep
        const isDone = step < currentStep
        return (
          <div key={label} className="flex shrink-0 items-center sm:flex-1 sm:last:flex-none">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  isDone
                    ? 'bg-ocean text-white'
                    : isActive
                      ? 'bg-ocean text-white'
                      : 'border border-mist text-slate'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : step}
              </div>
              {/* Full labels for every step only from sm: up — on a phone,
                  only the current step's label is worth the horizontal
                  space; the rest are still readable via the number badges. */}
              <span
                className={`text-sm font-medium whitespace-nowrap ${isActive ? 'text-ocean' : 'text-slate'} ${
                  isActive ? '' : 'hidden sm:inline'
                }`}
              >
                {label}
              </span>
            </div>
            {step < steps.length && <div className="mx-3 h-px w-8 shrink-0 bg-mist sm:mx-4 sm:w-auto sm:flex-1" />}
          </div>
        )
      })}
    </div>
  )
}
