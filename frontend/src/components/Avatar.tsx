import { useState } from 'react'

const PALETTE = ['bg-ocean', 'bg-sea', 'bg-gold-dark', 'bg-lavender-dark', 'bg-navy']

function colorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

interface AvatarProps {
  name: string
  imageUrl?: string
  className?: string
}

export function Avatar({ name, imageUrl, className }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt={name}
        onError={() => setImageFailed(true)}
        className={`shrink-0 rounded-full object-cover ${className ?? 'h-9 w-9 text-sm'}`}
      />
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorFor(name)} ${className ?? 'h-9 w-9 text-sm'}`}
    >
      {initialsFor(name)}
    </div>
  )
}
