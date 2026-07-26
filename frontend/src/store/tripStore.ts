import { create } from 'zustand'
import type { Trip } from '@/types'
import {
  createTrip as createTripApi,
  deleteTripApi,
  listTrips,
  setTripArchived,
  updateTrip as updateTripApi,
  type CreateTripPayload,
} from '@/services/tripsApi'

interface TripState {
  trips: Trip[]
  currentTrip: Trip | null
  isLoading: boolean
  hasLoaded: boolean
  fetchTrips: () => Promise<void>
  createTrip: (trip: CreateTripPayload) => Promise<Trip>
  getTripById: (id: string) => Trip | undefined
  setArchived: (id: string, archived: boolean) => Promise<void>
  updateTrip: (id: string, patch: Parameters<typeof updateTripApi>[1]) => Promise<Trip>
  deleteTrip: (id: string) => Promise<void>
  reset: () => void
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  currentTrip: null,
  isLoading: false,
  hasLoaded: false,
  fetchTrips: async () => {
    set({ isLoading: true })
    try {
      const trips = await listTrips()
      set({ trips, isLoading: false, hasLoaded: true })
    } catch {
      set({ isLoading: false, hasLoaded: true })
    }
  },
  createTrip: async (trip) => {
    const newTrip = await createTripApi(trip)
    set((state) => ({ trips: [newTrip, ...state.trips], currentTrip: newTrip }))
    return newTrip
  },
  getTripById: (id) => get().trips.find((trip) => trip.id === id),
  setArchived: async (id, archived) => {
    const updated = await setTripArchived(id, archived)
    set((state) => ({ trips: state.trips.map((trip) => (trip.id === id ? updated : trip)) }))
  },
  updateTrip: async (id, patch) => {
    const updated = await updateTripApi(id, patch)
    set((state) => ({ trips: state.trips.map((trip) => (trip.id === id ? updated : trip)) }))
    return updated
  },
  deleteTrip: async (id) => {
    await deleteTripApi(id)
    set((state) => ({ trips: state.trips.filter((trip) => trip.id !== id) }))
  },
  reset: () => set({ trips: [], currentTrip: null, isLoading: false, hasLoaded: false }),
}))
