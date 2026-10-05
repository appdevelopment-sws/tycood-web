import { apiClient } from "../lib/apiClient"
import type {
  Booking,
  CreateBookingPayload,
  BookingFilters,
  PaginatedBookingsResponse,
} from "../types/booking"

export type { BookingFilters, PaginatedBookingsResponse }

export const bookingService = {
  getBookings: async (filters?: BookingFilters): Promise<PaginatedBookingsResponse> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.serviceType) params.append("serviceType", filters.serviceType)
    if (filters?.page) params.append("page", String(filters.page))
    if (filters?.limit) params.append("limit", String(filters.limit))

    const queryString = params.toString()
    const url = `/bookings${queryString ? `?${queryString}` : ""}`
    const response = await apiClient<any>(url)

    if (Array.isArray(response)) {
      return {
        data: response,
        meta: {
          total: response.length,
          page: 1,
          limit: response.length || 10,
          totalPages: 1,
        },
      }
    }

    const items = response?.data || []
    return {
      data: items,
      meta: response?.meta || {
        total: items.length,
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        totalPages: Math.ceil(items.length / (filters?.limit || 10)) || 1,
      },
    }
  },

  getBookingById: async (id: string): Promise<Booking> => {
    return apiClient<Booking>(`/bookings/${id}`)
  },

  createBooking: async (payload: CreateBookingPayload): Promise<Booking> => {
    return apiClient<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  cancelBooking: async (
    id: string,
    reason = "Cancelled by admin"
  ): Promise<Booking> => {
    return apiClient<Booking>(`/bookings/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    })
  },

  updateStatus: async (
    id: string,
    status: string,
    otp?: string
  ): Promise<Booking> => {
    return apiClient<Booking>(`/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, otp }),
    })
  },
}
