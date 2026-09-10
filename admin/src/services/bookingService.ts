import { apiClient } from "../lib/apiClient"
import type { Booking, CreateBookingPayload } from "../types/bus"

export interface BookingFilters {
  search?: string
  status?: string
  paymentStatus?: string
  tripId?: string
  page?: number
  limit?: number
}

export interface PaginatedBookingsResponse {
  data: Booking[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const bookingService = {
  getBookings: async (filters?: BookingFilters): Promise<PaginatedBookingsResponse> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.paymentStatus) params.append("paymentStatus", filters.paymentStatus)
    if (filters?.tripId) params.append("tripId", filters.tripId)
    if (filters?.page) params.append("page", String(filters.page))
    if (filters?.limit) params.append("limit", String(filters.limit))

    const queryString = params.toString()
    const url = `/booking${queryString ? `?${queryString}` : ""}`
    const response = await apiClient<any>(url)

    if (Array.isArray(response)) {
      return {
        data: response,
        total: response.length,
        page: 1,
        limit: response.length || 10,
        totalPages: 1,
      }
    }

    return response as PaginatedBookingsResponse
  },

  getBookingById: async (id: string): Promise<Booking> => {
    return apiClient<Booking>(`/booking/${id}`)
  },

  createBooking: async (payload: CreateBookingPayload): Promise<any> => {
    return apiClient<any>("/booking", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  cancelBooking: async (id: string): Promise<Booking> => {
    return apiClient<Booking>(`/booking/${id}/cancel`, {
      method: "PATCH",
    })
  },
}
