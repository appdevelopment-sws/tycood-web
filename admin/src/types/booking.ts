export type BookingServiceType =
  | 'CAB'
  | 'PARKING'
  | 'TECHNICIAN'
  | 'RENTAL'
  | string

export type BookingTripType =
  | 'ONE_WAY'
  | 'ROUND_TRIP'
  | 'HOURLY_RENTAL'
  | 'AIRPORT_TRANSFER'
  | 'OUTSTATION'
  | string

export type BookingStatus =
  | 'ACTIVE'
  | 'UPCOMING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING'
  | 'CONFIRMED'
  | string

export type PaymentStatus =
  | 'PENDING'
  | 'ADVANCE_PAID'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | string

export interface Booking {
  id: string
  bookingNumber: string
  userId: string
  serviceType: BookingServiceType
  status: BookingStatus
  tripType: BookingTripType
  pickupLocation: string
  dropLocation?: string | null
  intermediateStop?: string | null
  scheduledDateTime: string
  returnDateTime?: string | null
  baseFare: number
  platformFee: number
  discountAmount: number
  totalAmount: number
  advanceAmount: number
  remainingAmount: number
  adminCommissionRate: number
  paymentMethod: string
  paymentStatus: PaymentStatus
  passengerName: string
  passengerPhone: string
  pickupNotes?: string | null
  otp: string
  cancellationReason?: string | null
  cancelledAt?: string | null
  vehicleId?: string | null
  driverProfileId?: string | null
  cabName?: string | null
  cabCategory?: string | null
  cabPlateNumber?: string | null
  driverName?: string | null
  driverPhone?: string | null
  driverRating?: number
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  vehicle?: any
  driverProfile?: any
  viewMode?: boolean
}

export interface CreateBookingPayload {
  serviceType?: BookingServiceType
  tripType?: BookingTripType
  pickupLocation: string
  dropLocation?: string
  intermediateStop?: string
  scheduledDateTime: string
  returnDateTime?: string
  cabId?: string
  cabName?: string
  cabCategory?: string
  cabPlateNumber?: string
  baseFare: number
  platformFee?: number
  discountAmount?: number
  totalAmount: number
  advanceAmount?: number
  remainingAmount?: number
  adminCommissionRate?: number
  paymentMethod?: string
  passengerName?: string
  passengerPhone?: string
  pickupNotes?: string
  appliedCoupon?: string
}

export interface BookingFilters {
  search?: string
  status?: string
  serviceType?: string
  paymentStatus?: string
  page?: number
  limit?: number
}

export interface PaginatedBookingsResponse {
  data: Booking[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
