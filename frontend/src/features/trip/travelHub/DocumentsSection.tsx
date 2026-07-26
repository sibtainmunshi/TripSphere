import { useEffect, useRef, useState } from 'react'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { deleteDocument, listDocuments, uploadDocument } from '@/services/travelApi'
import type { DocumentType, TravelDocument } from '@/types/travel'
import { SectionShell } from './SectionShell'

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'hotel_confirmation', label: 'Hotel Confirmation' },
  { value: 'flight_ticket', label: 'Flight Ticket' },
  { value: 'train_ticket', label: 'Train Ticket' },
  { value: 'bus_ticket', label: 'Bus Ticket' },
  { value: 'other', label: 'Other' },
]

interface DocumentsSectionProps {
  tripId: string
  onChange: () => void
}

export function DocumentsSection({ tripId, onChange }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<TravelDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>('other')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listDocuments(tripId)
      .then(setDocuments)
      .catch(() => setError('Could not load documents.'))
      .finally(() => setLoading(false))
  }, [tripId])

  const handleAdd = async () => {
    setError(null)
    if (!title.trim() || !file) {
      setError('A title and a file are required.')
      return
    }
    setSaving(true)
    try {
      const created = await uploadDocument(tripId, title, documentType, file)
      setDocuments((prev) => [created, ...prev])
      setTitle('')
      setDocumentType('other')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsAdding(false)
      onChange()
    } catch {
      setError('Could not upload this document. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this document?')) return
    await deleteDocument(id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    onChange()
  }

  return (
    <SectionShell icon={FileText} title="Travel Documents" isAdding={isAdding} onToggleAdd={() => setIsAdding((v) => !v)}>
      {isAdding && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-mist p-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <TextField id="title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Document type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full rounded-lg border border-mist bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">File</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-mist bg-white px-3.5 py-2.5 text-sm text-ink outline-none file:mr-3 file:rounded-md file:border-0 file:bg-cream file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
            />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Upload className="h-4 w-4" /> Upload Document</>)}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-slate">No documents added yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border border-mist px-4 py-3">
              <a
                href={doc.file}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-ink hover:text-ocean"
              >
                <FileText className="h-4 w-4 text-slate" />
                {doc.title}
              </a>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                aria-label="Remove document"
                className="text-slate hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}
