import { useState } from 'react'
import { Check, Copy, Link2, Mail, UserPlus, X } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { TextField } from '@/components/TextField'
import type { TripMember } from '@/types'

interface AddMembersStepProps {
  members: TripMember[]
  onAdd: (email: string) => void
  onRemove: (id: string) => void
  inviteLink: string
}

export function AddMembersStep({ members, onAdd, onRemove, inviteLink }: AddMembersStepProps) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

      <div className="rounded-xl border border-dashed border-mist p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink">
          <Link2 className="h-4 w-4 text-ocean" />
          Or share an invite link
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteLink}
            className="flex-1 rounded-lg border border-mist bg-cream px-3 py-2 text-xs text-slate"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-mist px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-cream"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-sea" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate">
          Real email delivery lands with backend integration — for now this link is saved with your
          trip so you can share it manually.
        </p>
      </div>
    </div>
  )
}
