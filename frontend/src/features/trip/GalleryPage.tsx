import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Images, Loader2, Play, Trash2, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'
import { listMedia, uploadMedia, setFavorite, deleteMedia } from '@/services/galleryApi'
import type { MediaItem } from '@/types/gallery'
import { groupByTripDay } from './tripDay'

type GalleryFilter = 'all' | 'photo' | 'video' | 'favorites' | 'mine'

const FILTERS: { value: GalleryFilter; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'mine', label: 'Mine' },
  { value: 'photo', label: 'Photos' },
  { value: 'video', label: 'Videos' },
  { value: 'favorites', label: 'Favorites' },
]

export function GalleryPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const user = useAuthStore((state) => state.user)
  const trip = useTripStore((state) => (tripId ? state.getTripById(tripId) : undefined))
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<GalleryFilter>('all')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tripId) return
    listMedia(tripId)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [tripId])

  if (!tripId || !trip) return null

  const myMemberId = trip.members?.find((member) => member.email === user?.email)?.id

  const filteredItems = items.filter((item) => {
    if (filter === 'photo') return item.mediaType === 'photo'
    if (filter === 'video') return item.mediaType === 'video'
    if (filter === 'favorites') return item.isFavorite
    if (filter === 'mine') return item.uploaderId === myMemberId
    return true
  })
  const dayGroups = groupByTripDay(filteredItems, (item) => item.createdAt, trip.startDate)
  const viewerItem = viewerIndex !== null ? filteredItems[viewerIndex] : null

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        const created = await uploadMedia(tripId, file)
        setItems((prev) => [created, ...prev])
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleToggleFavorite = async (item: MediaItem) => {
    const updated = await setFavorite(item.id, !item.isFavorite)
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
  }

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm('Remove this from the gallery?')) return
    await deleteMedia(item.id)
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setViewerIndex(null)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Gallery</p>
          <p className="mt-1 text-xs text-slate">Photos and videos everyone on this trip has shared.</p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Add Photos or Videos'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(event) => handleUpload(event.target.files)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === option.value ? 'bg-navy text-white' : 'bg-cream text-slate hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-mist p-10 text-center">
          <Images className="mx-auto mb-2 h-6 w-6 text-slate" />
          <p className="text-sm text-slate">
            {items.length === 0 ? 'No photos yet — add the first one.' : 'Nothing matches this filter yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {dayGroups.map((group) => (
            <div key={group.key}>
              <p className="mb-3 text-xs font-semibold tracking-wide text-slate uppercase">{group.label}</p>
              <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
                {group.items.map((item) => {
                  const flatIndex = filteredItems.indexOf(item)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setViewerIndex(flatIndex)}
                      className="group relative mb-3 block w-full overflow-hidden rounded-xl border border-mist"
                    >
                      {item.mediaType === 'video' ? (
                        <div className="relative">
                          <video src={item.file} className="w-full" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <img src={item.file} alt={item.caption || ''} className="w-full" loading="lazy" />
                      )}
                      {item.isFavorite && (
                        <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40">
                          <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {viewerItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/90"
          >
            <div className="flex items-center justify-between px-5 py-4 text-white">
              <div className="text-sm">
                <p className="font-medium">{viewerItem.uploaderName}</p>
                {viewerItem.caption && <p className="text-white/70">{viewerItem.caption}</p>}
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => handleToggleFavorite(viewerItem)} aria-label="Toggle favorite">
                  <Heart className={`h-5 w-5 ${viewerItem.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>
                <button type="button" onClick={() => handleDelete(viewerItem)} aria-label="Delete">
                  <Trash2 className="h-5 w-5 text-white" />
                </button>
                <button type="button" onClick={() => setViewerIndex(null)} aria-label="Close">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
              {viewerIndex !== null && viewerIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setViewerIndex((index) => (index !== null ? index - 1 : index))}
                  aria-label="Previous"
                  className="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {viewerItem.mediaType === 'video' ? (
                <video src={viewerItem.file} controls autoPlay className="max-h-full max-w-full rounded-lg" />
              ) : (
                <img
                  src={viewerItem.file}
                  alt={viewerItem.caption || ''}
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              )}

              {viewerIndex !== null && viewerIndex < filteredItems.length - 1 && (
                <button
                  type="button"
                  onClick={() => setViewerIndex((index) => (index !== null ? index + 1 : index))}
                  aria-label="Next"
                  className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
