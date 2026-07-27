export type TransportMode = 'flight' | 'train' | 'bus' | 'car'
export type DocumentType = 'hotel_confirmation' | 'flight_ticket' | 'train_ticket' | 'bus_ticket' | 'other'

export interface StayBooking {
  id: string
  trip: string
  hotelName: string
  address?: string
  checkIn: string
  checkOut: string
  confirmationNumber?: string
  notes?: string
  createdAt: string
}

export interface TransportBooking {
  id: string
  trip: string
  mode: TransportMode
  operator?: string
  fromLocation: string
  toLocation: string
  departureAt: string
  arrivalAt?: string
  confirmationNumber?: string
  notes?: string
  createdAt: string
}

export interface RestaurantReservation {
  id: string
  trip: string
  restaurantName: string
  address?: string
  reservationAt: string
  partySize?: number
  notes?: string
  createdAt: string
}

export interface TravelDocument {
  id: string
  trip: string
  title: string
  documentType: DocumentType
  file: string
  createdAt: string
}
