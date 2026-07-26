import { AppleIcon } from '@/components/AppleIcon'

export function ContinueWithAppleButton() {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-mist bg-white py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream"
    >
      <AppleIcon className="h-4 w-4" />
      Continue with Apple
    </button>
  )
}
