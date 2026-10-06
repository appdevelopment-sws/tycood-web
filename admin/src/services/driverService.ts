import { apiClient } from "../lib/apiClient"
import type { Driver } from "../types/bus"

export interface CreateDriverPayload {
  operatorId?: string
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
  verificationStatus?: string
}

export const driverService = {
  getDrivers: async (filters?: DriverFilters): Promise<Driver[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.operatorId) params.append("operatorId", filters.operatorId)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.verificationStatus) params.append("verificationStatus", filters.verificationStatus)

    const queryString = params.toString()
    const url = `/drivers${queryString ? `?${queryString}` : ""}`
    const response = await apiClient<any>(url)

    const items = Array.isArray(response)
      ? response
      : (response?.data || [])

    return items.map((d: any) => ({
      id: d.id,
      userId: d.userId,
      user: d.user,
      name: d.user?.name || d.name || "Driver",
      phone: d.user?.phone || d.phone || "—",
      licenseNumber: d.licenseNumber,
      licenseType: d.licenseType,
      experienceYears: d.experienceYears ?? 0,
      rating: d.rating ?? 5.0,
      verificationStatus: d.verificationStatus || "PENDING",
      availabilityStatus: d.availabilityStatus || "OFFLINE",
      status: d.verificationStatus === "VERIFIED" ? "ACTIVE" : (d.status || d.verificationStatus || "PENDING"),
      driverVehicles: d.driverVehicles || [],
      operatorId: d.operatorId,
      operator: d.operator,
      operatorName: d.operator?.name || "Independent Partner",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }))
  },

  getDriverById: async (id: string): Promise<Driver> => {
    return apiClient<Driver>(`/drivers/${id}`)
  },

  createDriver: async (payload: CreateDriverPayload): Promise<Driver> => {
    return apiClient<Driver>("/drivers", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateDriver: async (
    id: string,
    payload: UpdateDriverPayload
  ): Promise<Driver> => {
    return apiClient<Driver>(`/drivers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  verifyDriver: async (id: string, notes?: string): Promise<any> => {
    return apiClient<any>(`/drivers/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    })
  },

  rejectDriver: async (id: string, rejectionReason?: string): Promise<any> => {
    return apiClient<any>(`/drivers/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    })
  },

  deleteDriver: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/drivers/${id}`, {
      method: "DELETE",
    })
  },
}
