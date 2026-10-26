import { apiClient } from "../lib/apiClient"
import type {
  TruckType,
  CreateTruckTypePayload,
  UpdateTruckTypePayload,
  TruckTypeFilterParams,
  Load,
  CreateLoadPayload,
  UpdateLoadPayload,
  LoadFilterParams,
} from "../types/logistics"

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const logisticsService = {
  // Truck Types CRUD
  getTruckTypes: async (filters?: TruckTypeFilterParams): Promise<TruckType[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.category && filters.category !== "ALL") params.append("category", filters.category)
    if (filters?.isActive && filters.isActive !== "ALL") params.append("isActive", filters.isActive)
    if (filters?.page) params.append("page", String(filters.page))
    if (filters?.limit) params.append("limit", String(filters.limit))

    const queryStr = params.toString()
    const url = queryStr ? `/logistics/truck-types?${queryStr}` : "/logistics/truck-types"
    const response = await apiClient<PaginatedResponse<TruckType> | TruckType[]>(url)

    if (Array.isArray(response)) {
      return response
    }
    return response.data || []
  },

  getTruckTypeById: async (id: string): Promise<TruckType> => {
    return apiClient<TruckType>(`/logistics/truck-types/${id}`)
  },

  createTruckType: async (payload: CreateTruckTypePayload): Promise<TruckType> => {
    return apiClient<TruckType>("/logistics/truck-types", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateTruckType: async (id: string, payload: UpdateTruckTypePayload): Promise<TruckType> => {
    return apiClient<TruckType>(`/logistics/truck-types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  deleteTruckType: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/logistics/truck-types/${id}`, {
      method: "DELETE",
    })
  },

  // Cargo Loads CRUD
  getLoads: async (filters?: LoadFilterParams): Promise<Load[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.pickupCity && filters.pickupCity !== "ALL") params.append("pickupCity", filters.pickupCity)
    if (filters?.unloadingCity && filters.unloadingCity !== "ALL") params.append("unloadingCity", filters.unloadingCity)
    if (filters?.truckCategory && filters.truckCategory !== "ALL") params.append("truckCategory", filters.truckCategory)
    if (filters?.status && filters.status !== "ALL") params.append("status", filters.status)
    if (filters?.page) params.append("page", String(filters.page))
    if (filters?.limit) params.append("limit", String(filters.limit))

    const queryStr = params.toString()
    const url = queryStr ? `/logistics/loads?${queryStr}` : "/logistics/loads"
    const response = await apiClient<PaginatedResponse<Load> | Load[]>(url)

    if (Array.isArray(response)) {
      return response
    }
    return response.data || []
  },

  getLoadById: async (id: string): Promise<Load> => {
    return apiClient<Load>(`/logistics/loads/${id}`)
  },

  createLoad: async (payload: CreateLoadPayload): Promise<Load> => {
    return apiClient<Load>("/logistics/loads", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateLoad: async (id: string, payload: UpdateLoadPayload): Promise<Load> => {
    return apiClient<Load>(`/logistics/loads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  deleteLoad: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/logistics/loads/${id}`, {
      method: "DELETE",
    })
  },
}
