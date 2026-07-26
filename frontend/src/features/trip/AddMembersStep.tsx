import { useState } from 'react'
import { Mail, UserPlus, X } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { TextField } from '@/components/TextField'
import type { TripMember } from '@/types'

interface AddMembersStepProps {
  members: TripMember[]
  onAdd: (email: string) => void
  onRemove: (id: string) => void
}

export function AddMembersStep({ members, onAdd, onRemove }: AddMembersStepProps) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleAdd = () => {
    const trimmed = email.trim()
    if (!trimmed) return
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setEmailError('Enter a valid email address')
      return
    }
    onAdd(trimmed)
    setEmail('')
    setEmailError(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-semibold text-ink">Add Members</p>
        <p className="mt-1 text-xs text-slate">
          Invite friends and family to collaborate on this trip — or skip for now.
        </p>
      </div>

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <TextField
            label=""
            placeholder="Enter email address"
            value={email}
            startIcon={<Mail className="h-4 w-4" />}
            error={emailError ?? undefined}
            onChange={(event) => {
              setEmail(event.target.value)
              setEmailError(null)
            }}
            onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark"
        >
          <UserPlus className="h-4 w-4" />
          Add
        </button>
      </div>

      {members.length > 0 && (
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-mist px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <Avatar name={member.email} className="h-8 w-8 text-xs" />
                <p className="text-sm font-medium text-ink">{member.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold-dark">
                  Invited
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(member.id)}
                  aria-label={`Remove ${member.email}`}
                  className="text-slate hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate">
        Each person gets their own real, shareable invite link once the trip is created — you&rsquo;ll find them in
        Trip Settings.
      </p>
    </div>
  )
}
