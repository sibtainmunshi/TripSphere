import { Briefcase, Heart, MoreHorizontal, TreePalm, Tent, Users } from 'lucide-react'
import { TextField } from '@/components/TextField'
import { DestinationSearchField } from './DestinationSearchField'

const TRIP_TYPES = [
  { label: 'Leisure', icon: TreePalm },
  { label: 'Adventure', icon: Tent },
  { label: 'Family', icon: Heart },
  { label: 'Friends', icon: Users },
  { label: 'Workation', icon: Briefcase },
  { label: 'Other', icon: MoreHorizontal },
]

export interface TripDetailsValue {
  name: string
  destination: string
  destinationLat?: number
  destinationLon?: number
  startDate: string
  endDate: string
  tripType: string
  description: string
}

interface TripDetailsStepProps {
  value: TripDetailsValue
  onChange: (patch: Partial<TripDetailsValue>) => void
  errors: Partial<Record<keyof TripDetailsValue, string>>
}

export function TripDetailsStep({ value, onChange, errors }: TripDetailsStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink">Trip Details</p>
        <p className="-mt-3 mb-4 text-xs text-slate">Let&rsquo;s start with the basic details of your trip.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink">Trip Name</label>
          <span className="text-xs text-slate">{value.name.length}/60</span>
        </div>
        <TextField
          label=""
          id="name"
          placeholder="e.g. Goa Getaway, Manali Adventure, Dubai Trip"
          value={value.name}
          maxLength={60}
          error={errors.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </div>

      <DestinationSearchField
        value={value.destination}
        onChange={(destination, coords) =>
          onChange({ destination, destinationLat: coords?.lat, destinationLon: coords?.lon })
        }
        error={errors.destination}
      />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Start Date"
          id="startDate"
          type="date"
          value={value.startDate}
          error={errors.startDate}
          onChange={(event) => onChange({ startDate: event.target.value })}
        />
        <TextField
          label="End Date"
          id="endDate"
          type="date"
          value={value.endDate}
          error={errors.endDate}
          onChange={(event) => onChange({ endDate: event.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Trip Type (Optional)</label>
        <div className="grid grid-cols-3 gap-2.5">
          {TRIP_TYPES.map((type) => {
            const isSelected = value.tripType === type.label
            return (
              <button
                key={type.label}
                type="button"
                onClick={() => onChange({ tripType: isSelected ? '' : type.label })}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'border-ocean bg-ocean/5 text-ocean'
                    : 'border-mist text-slate hover:border-ocean/50'
                }`}
              >
                <type.icon className="h-5 w-5" />
                {type.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink">Short Description (Optional)</label>
          <span className="text-xs text-slate">{value.description.length}/200</span>
        </div>
        <textarea
          value={value.description}
          maxLength={200}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Add a short description about your trip..."
          rows={3}
          className="w-full resize-none rounded-lg border border-mist px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-slate/60 focus:border-ocean focus:ring-1 focus:ring-ocean"
        />
      </div>
    </div>
  )
}
