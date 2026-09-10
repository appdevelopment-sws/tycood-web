import { apiClient } from "../lib/apiClient"
import type { Station } from "../types/bus"

export interface CreateStationPayload {
  name: string
  city: string
  state?: string
  terminalName?: string
  latitude?: number
  longitude?: number
  isActive?: boolean
}

export interface UpdateStationPayload {
  name?: string
  city?: string
  state?: string
  terminalName?: string
  latitude?: number
  longitude?: number
  isActive?: boolean
}

export interface StationFilters {
  search?: string
  isActive?: boolean | string
}

export const stationService = {
  getStations: async (filters?: StationFilters): Promise<Station[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.isActive !== undefined && filters.isActive !== "")
      params.append("isActive", String(filters.isActive))

    const queryString = params.toString()
    const url = `/station${queryString ? `?${queryString}` : ""}`
    return apiClient<Station[]>(url)
  },

  getCities: async (): Promise<{ city: string; state: string }[]> => {
    return apiClient<{ city: string; state: string }[]>("/station/cities")
  },

  getStationById: async (id: string): Promise<Station> => {
    return apiClient<Station>(`/station/${id}`)
  },

  createStation: async (payload: CreateStationPayload): Promise<Station> => {
    return apiClient<Station>("/station", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateStation: async (
    id: string,
    payload: UpdateStationPayload
  ): Promise<Station> => {
    return apiClient<Station>(`/station/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  deleteStation: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/station/${id}`, {
      method: "DELETE",
    })
  },
}
