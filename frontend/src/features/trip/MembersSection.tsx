import { useState } from 'react'
import { Check, Copy, Loader2, Mail, Trash2, UserPlus, Users } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { TextField } from '@/components/TextField'
import { useTripStore } from '@/store/tripStore'
import { getApiErrorMessage } from '@/services/api'
import type { Trip, TripMember } from '@/types'

interface MembersSectionProps {
  trip: Trip
}

const STATUS_LABEL: Record<TripMember['status'], string> = {
  owner: 'Owner',
  joined: 'Joined',
  invited: 'Invited',
}

const STATUS_STYLE: Record<TripMember['status'], string> = {
  owner: 'bg-ocean/10 text-ocean',
  joined: 'bg-sea/10 text-sea',
  invited: 'bg-gold/15 text-gold-dark',
}

export function MembersSection({ trip }: MembersSectionProps) {
  const addMember = useTripStore((state) => state.addMember)
  const removeMember = useTripStore((state) => state.removeMember)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const members = trip.members ?? []

  const handleAdd = async () => {
    setError(null)
    const trimmed = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Enter a valid email address.')
      return
    }
    setAdding(true)
    try {
      await addMember(trip.id, trimmed, name.trim())
      setEmail('')
      setName('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not add this member. Please try again.'))
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (member: TripMember) => {
    if (!window.confirm(`Remove ${member.name || member.email} from this trip?`)) return
    await removeMember(trip.id, member.id)
  }

  const handleCopy = async (member: TripMember) => {
    if (!member.inviteToken) return
    const link = `${window.location.origin}/join/${member.inviteToken}`
    await navigator.clipboard.writeText(link)
    setCopiedId(member.id)
    setTimeout(() => setCopiedId((id) => (id === member.id ? null : id)), 2000)
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-mist p-5">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Users className="h-4 w-4 text-ocean" />
        Members
      </p>

      {members.length > 0 && (
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-mist px-3.5 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={member.name || member.email} className="h-8 w-8 shrink-0 text-xs" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{member.name || member.email}</p>
                  {member.name && <p className="truncate text-xs text-slate">{member.email}</p>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[member.status]}`}>
                  {STATUS_LABEL[member.status]}
                </span>
                {member.inviteToken && (
                  <button
                    type="button"
                    onClick={() => handleCopy(member)}
                    title="Copy invite link"
                    className="text-slate hover:text-ocean"
                  >
                    {copiedId === member.id ? <Check className="h-4 w-4 text-sea" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
                {member.status !== 'owner' && (
                  <button
                    type="button"
                    onClick={() => handleRemove(member)}
                    aria-label={`Remove ${member.email}`}
                    className="text-slate hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <TextField
            label=""
            placeholder="Email address"
            value={email}
            startIcon={<Mail className="h-4 w-4" />}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="flex-1">
          <TextField
            label=""
            placeholder="Name (optional)"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Invite
        </button>
      </div>

      <p className="text-xs text-slate">
        Each person gets their own real invite link — tap the copy icon next to their name to share it (via
        WhatsApp, SMS, however you like).
      </p>
    </div>
  )
}
