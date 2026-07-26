import { useParams } from 'react-router-dom'
import { DocumentsSection } from './DocumentsSection'

export function TravelDocumentsPage() {
  const { tripId } = useParams<{ tripId: string }>()

  if (!tripId) return null

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-8">
      <div>
        <p className="text-sm font-semibold text-ink">Travel Documents</p>
        <p className="mt-1 text-xs text-slate">
          Hotel confirmations, tickets and other files — stored in one place, easy to find.
        </p>
      </div>

      <DocumentsSection tripId={tripId} onChange={() => {}} />
    </div>
  )
}
