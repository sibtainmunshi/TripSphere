import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'
import type { TripMember } from '@/types'
import { StepIndicator } from './StepIndicator'
import { TripDetailsStep, type TripDetailsValue } from './TripDetailsStep'
import { AddMembersStep } from './AddMembersStep'
import { PreferencesStep } from './PreferencesStep'
import { ReviewCreateStep } from './ReviewCreateStep'
import { TripPreviewCard } from './TripPreviewCard'

const STEP_LABELS = ['Trip Details', 'Add Members', 'Preferences (Optional)', 'Review & Create']

type Step = 1 | 2 | 3 | 4

export function ManualTripWizard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const createTrip = useTripStore((state) => state.createTrip)
  const name = user?.name ?? 'there'

  const [step, setStep] = useState<Step>(1)
  const [details, setDetails] = useState<TripDetailsValue>({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    tripType: '',
    description: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof TripDetailsValue, string>>>({})
  const [members, setMembers] = useState<TripMember[]>([])
  const [budget, setBudget] = useState('')
  const [notes, setNotes] = useState('')

  const patchDetails = (patch: Partial<TripDetailsValue>) => {
    setDetails((prev) => ({ ...prev, ...patch }))
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch)) delete next[key as keyof TripDetailsValue]
      return next
    })
  }

  const validateDetails = (): boolean => {
    const next: Partial<Record<keyof TripDetailsValue, string>> = {}
    if (!details.name.trim()) next.name = 'Give your trip a name'
    if (!details.destination.trim()) next.destination = 'Where are you headed?'
    if (!details.startDate) next.startDate = 'Pick a start date'
    if (!details.endDate) next.endDate = 'Pick an end date'
    if (details.startDate && details.endDate && details.endDate < details.startDate) {
      next.endDate = 'End date must be after the start date'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleAddMember = (email: string) => {
    if (members.some((member) => member.email.toLowerCase() === email.toLowerCase())) return
    // joined/inviteToken don't exist yet at this point — the trip (and its
    // real TripMember rows/tokens) isn't created until the final Review
    // step, so this is only ever a local, pre-save placeholder.
    setMembers((prev) => [...prev, { id: crypto.randomUUID(), email, status: 'invited', joined: false, inviteToken: null }])
  }

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id))
  }

  const handleNext = () => {
    if (step === 1 && !validateDetails()) return
    setStep((prev) => (Math.min(4, prev + 1) as Step))
  }

  const handleBack = () => setStep((prev) => Math.max(1, prev - 1) as Step)

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreate = async () => {
    setCreating(true)
    setCreateError(null)
    try {
      const trip = await createTrip({
        name: details.name,
        destination: details.destination,
        startDate: details.startDate,
        endDate: details.endDate,
        memberCount: members.length + 1,
        tripType: details.tripType || undefined,
        description: details.description || undefined,
        budget: budget ? Number(budget) : undefined,
        members,
        lat: details.destinationLat,
        lon: details.destinationLon,
      })
      navigate(`/trips/${trip.id}`)
    } catch {
      setCreateError('Could not create your trip. Please try again.')
      setCreating(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-mist px-8 py-5">
        <div>
          <h1 className="text-xl font-bold text-ink">Create New Trip</h1>
          <p className="text-sm text-slate">Fill in the details to create your trip workspace</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 rounded-lg border border-mist px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream">
            <Save className="h-4 w-4" />
            Save as Draft
          </button>
          <div className="flex items-center gap-2">
            <Avatar name={name} imageUrl={user?.avatarUrl} />
            <span className="text-sm font-medium text-ink">{name}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-mist">
        <StepIndicator currentStep={step} steps={STEP_LABELS} />
      </div>

      <div className="grid flex-1 grid-cols-2 gap-6 overflow-hidden">
        <div className="scrollbar-none overflow-y-auto py-6 pr-2 pl-8">
          {step === 1 && <TripDetailsStep value={details} onChange={patchDetails} errors={errors} />}
          {step === 2 && (
            <AddMembersStep members={members} onAdd={handleAddMember} onRemove={handleRemoveMember} />
          )}
          {step === 3 && (
            <PreferencesStep
              budget={budget}
              notes={notes}
              onChange={(patch) => {
                if (patch.budget !== undefined) setBudget(patch.budget)
                if (patch.notes !== undefined) setNotes(patch.notes)
              }}
            />
          )}
          {step === 4 && (
            <ReviewCreateStep
              name={details.name}
              destination={details.destination}
              startDate={details.startDate}
              endDate={details.endDate}
              tripType={details.tripType}
              description={details.description}
              members={members}
              budget={budget}
              notes={notes}
              onEditStep={(target) => setStep(target as Step)}
            />
          )}

          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 rounded-lg border border-mist px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <span />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {createError && <p className="text-sm text-red-600">{createError}</p>}
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-1.5 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Create Workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="scrollbar-none overflow-y-auto py-6 pr-8 pl-2">
          <TripPreviewCard
            name={details.name}
            destination={details.destination}
            startDate={details.startDate}
            endDate={details.endDate}
            tripType={details.tripType}
            memberCount={members.length + 1}
            budget={budget}
          />
        </div>
      </div>
    </div>
  )
}
