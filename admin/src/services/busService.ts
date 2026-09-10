import { apiClient } from "../lib/apiClient"
import type { Bus, BusTypeEnum, BusCategoryEnum, BusStatusEnum } from "../types/bus"

export interface CreateBusPayload {
  registrationNumber: string
  internalCode?: string
  busName: string
  busType?: BusTypeEnum | string
  category?: BusCategoryEnum | string
  manufacturer?: string
  model?: string
  manufacturingYear?: number
  seatingCapacity?: number
  layoutType?: string
  isAC?: boolean
  status?: BusStatusEnum | string
  operatorId?: string
}

export interface UpdateBusPayload {
  registrationNumber?: string
  internalCode?: string
  busName?: string
  busType?: BusTypeEnum | string
  category?: BusCategoryEnum | string
  manufacturer?: string
  model?: string
  manufacturingYear?: number
  seatingCapacity?: number
  layoutType?: string
  isAC?: boolean
  status?: BusStatusEnum | string
  operatorId?: string
}

export interface BusFilterParams {
  search?: string
  busType?: string
  status?: string
  isAC?: boolean | string
  operatorId?: string
  page?: number
  perPage?: number
}

export const busService = {
  getBuses: async (filters?: BusFilterParams): Promise<Bus[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.busType && filters.busType !== "ALL") params.append("busType", filters.busType)
    if (filters?.status && filters.status !== "ALL") params.append("status", filters.status)
    if (filters?.isAC !== undefined && filters.isAC !== "ALL") params.append("isAC", String(filters.isAC))
    if (filters?.operatorId && filters.operatorId !== "ALL") params.append("operatorId", filters.operatorId)

    const queryStr = params.toString()
    const url = queryStr ? `/bus?${queryStr}` : "/bus"
    return apiClient<Bus[]>(url)
  },

  getBusById: async (id: string): Promise<Bus> => {
    return apiClient<Bus>(`/bus/${id}`)
  },

  createBus: async (payload: CreateBusPayload): Promise<Bus> => {
    return apiClient<Bus>("/bus", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateBus: async (id: string, payload: UpdateBusPayload): Promise<Bus> => {
    return apiClient<Bus>(`/bus/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  deleteBus: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/bus/${id}`, {
      method: "DELETE",
    })
  },

  generateSeatLayout: async (id: string, layoutPattern: string): Promise<any> => {
    return apiClient<any>(`/bus/${id}/generate-seats`, {
      method: "POST",
      body: JSON.stringify({ layoutPattern }),
    })
  },
}
