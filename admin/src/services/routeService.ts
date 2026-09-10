import { apiClient } from "../lib/apiClient"
import type { Route, StopTypeEnum } from "../types/bus"

export interface RouteStopPayload {
  stationId: string
  stopOrder: number
  stopType?: StopTypeEnum
  timeOffsetMinutes?: number
  fareMarkup?: number
}

export interface CreateRoutePayload {
  name: string
  sourceStationId: string
  destinationStationId: string
  distanceKm: number
  estimatedDurationMinutes: number
  isActive?: boolean
  stops?: RouteStopPayload[]
}

export interface UpdateRoutePayload {
  name?: string
  sourceStationId?: string
  destinationStationId?: string
  distanceKm?: number
  estimatedDurationMinutes?: number
  isActive?: boolean
  stops?: RouteStopPayload[]
}

export interface RouteFilters {
  search?: string
  sourceStationId?: string
  destinationStationId?: string
  isActive?: boolean | string
}

export const routeService = {
  getRoutes: async (filters?: RouteFilters): Promise<Route[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.sourceStationId)
      params.append("sourceStationId", filters.sourceStationId)
    if (filters?.destinationStationId)
      params.append("destinationStationId", filters.destinationStationId)
    if (filters?.isActive !== undefined && filters.isActive !== "")
      params.append("isActive", String(filters.isActive))

    const queryString = params.toString()
    const url = `/route${queryString ? `?${queryString}` : ""}`
    return apiClient<Route[]>(url)
  },

  getRouteById: async (id: string): Promise<Route> => {
    return apiClient<Route>(`/route/${id}`)
  },

  createRoute: async (payload: CreateRoutePayload): Promise<Route> => {
    return apiClient<Route>("/route", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateRoute: async (
    id: string,
    payload: UpdateRoutePayload
  ): Promise<Route> => {
    return apiClient<Route>(`/route/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  deleteRoute: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/route/${id}`, {
      method: "DELETE",
    })
  },
}
