import { Check } from 'lucide-react'

const DEFAULT_STEPS = ['Destination', 'Preferences', 'Travelers', 'Budget', 'Review & Create']

interface StepIndicatorProps {
  currentStep: number
  steps?: string[]
}

export function StepIndicator({ currentStep, steps = DEFAULT_STEPS }: StepIndicatorProps) {
  return (
    <div className="flex items-center px-8 py-5">
      {steps.map((label, index) => {
        const step = index + 1
        const isActive = step === currentStep
        const isDone = step < currentStep
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
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
              <span
                className={`text-sm font-medium whitespace-nowrap ${isActive ? 'text-ocean' : 'text-slate'}`}
              >
                {label}
              </span>
            </div>
            {step < steps.length && <div className="mx-4 h-px flex-1 bg-mist" />}
          </div>
        )
      })}
    </div>
  )
}
