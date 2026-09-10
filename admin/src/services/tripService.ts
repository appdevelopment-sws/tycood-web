import { apiClient } from "../lib/apiClient"
import type { Trip } from "../types/bus"

export interface CreateTripPayload {
  busId: string
  routeId: string
  driverId?: string | null
  scheduleId?: string | null
  departureTime: string
  arrivalTime: string
  minFare: number
  tripCode?: string
  status?: "SCHEDULED" | "ON_TIME" | "IN_TRANSIT" | "DELAYED" | "CANCELLED" | "COMPLETED" | string
}

export interface UpdateTripPayload {
  busId?: string
  routeId?: string
  driverId?: string | null
  scheduleId?: string | null
  departureTime?: string
  arrivalTime?: string
  minFare?: number
  tripCode?: string
  status?: "SCHEDULED" | "ON_TIME" | "IN_TRANSIT" | "DELAYED" | "CANCELLED" | "COMPLETED" | string
}

export interface TripFilters {
  search?: string
  status?: string
  routeId?: string
  busId?: string
  driverId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface PaginatedTripsResponse {
  data: Trip[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const tripService = {
  getTrips: async (filters?: TripFilters): Promise<PaginatedTripsResponse> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.routeId) params.append("routeId", filters.routeId)
    if (filters?.busId) params.append("busId", filters.busId)
    if (filters?.driverId) params.append("driverId", filters.driverId)
    if (filters?.startDate) params.append("startDate", filters.startDate)
    if (filters?.endDate) params.append("endDate", filters.endDate)
    if (filters?.page) params.append("page", String(filters.page))
    if (filters?.limit) params.append("limit", String(filters.limit))

    const queryString = params.toString()
    const url = `/trip${queryString ? `?${queryString}` : ""}`
    const response = await apiClient<any>(url)

    // Handle array fallback if endpoint returns array directly
    if (Array.isArray(response)) {
      return {
        data: response,
        total: response.length,
        page: 1,
        limit: response.length || 10,
        totalPages: 1,
      }
    }

    return response as PaginatedTripsResponse
  },

  getTripById: async (id: string): Promise<Trip> => {
    return apiClient<Trip>(`/trip/${id}`)
  },

  createTrip: async (payload: CreateTripPayload): Promise<Trip> => {
    return apiClient<Trip>("/trip", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateTrip: async (
    id: string,
    payload: UpdateTripPayload
  ): Promise<Trip> => {
    return apiClient<Trip>(`/trip/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  deleteTrip: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/trip/${id}`, {
      method: "DELETE",
    })
  },
}
