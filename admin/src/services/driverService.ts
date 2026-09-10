import { apiClient } from "../lib/apiClient"
import type { Driver } from "../types/bus"

export interface CreateDriverPayload {
  operatorId: string
  name: string
  phone: string
  licenseNumber: string
  experienceYears?: number
  rating?: number
  status?: "ACTIVE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED"
  email?: string
  password?: string
}

export interface UpdateDriverPayload {
  operatorId?: string
  name?: string
  phone?: string
  licenseNumber?: string
  experienceYears?: number
  rating?: number
  status?: "ACTIVE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED"
}

export interface DriverFilters {
  search?: string
  operatorId?: string
  status?: string
}

export const driverService = {
  getDrivers: async (filters?: DriverFilters): Promise<Driver[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.operatorId) params.append("operatorId", filters.operatorId)
    if (filters?.status) params.append("status", filters.status)

    const queryString = params.toString()
    const url = `/driver${queryString ? `?${queryString}` : ""}`
    return apiClient<Driver[]>(url)
  },

  getDriverById: async (id: string): Promise<Driver> => {
    return apiClient<Driver>(`/driver/${id}`)
  },

  createDriver: async (payload: CreateDriverPayload): Promise<Driver> => {
    return apiClient<Driver>("/driver", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateDriver: async (
    id: string,
    payload: UpdateDriverPayload
  ): Promise<Driver> => {
    return apiClient<Driver>(`/driver/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  deleteDriver: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/driver/${id}`, {
      method: "DELETE",
    })
  },
}
