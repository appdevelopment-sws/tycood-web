import { apiClient } from "../lib/apiClient"
import type { CabVehicle, CreateCabPayload, UpdateCabPayload, CabFilterParams } from "../types/cab"

export interface PaginatedCabsResponse {
  data: CabVehicle[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const cabService = {
  getCabs: async (filters?: CabFilterParams): Promise<CabVehicle[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.category && filters.category !== "ALL") params.append("category", filters.category)
    if (filters?.status && filters.status !== "ALL") params.append("status", filters.status)
    if (filters?.fuelType && filters.fuelType !== "ALL") params.append("fuelType", filters.fuelType)
    if (filters?.page) params.append("page", String(filters.page))
    if (filters?.limit) params.append("limit", String(filters.limit))

    const queryStr = params.toString()
    const url = queryStr ? `/drivers/vehicles?${queryStr}` : "/drivers/vehicles"
    const response = await apiClient<PaginatedCabsResponse | CabVehicle[]>(url)

    // Handle paginated or plain array response cleanly
    if (Array.isArray(response)) {
      return response
    }
    return response.data || []
  },

  getCabById: async (id: string): Promise<CabVehicle> => {
    return apiClient<CabVehicle>(`/drivers/vehicles/${id}`)
  },

  createCab: async (payload: CreateCabPayload): Promise<CabVehicle> => {
    return apiClient<CabVehicle>("/drivers/vehicles", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateCab: async (id: string, payload: UpdateCabPayload): Promise<CabVehicle> => {
    return apiClient<CabVehicle>(`/drivers/vehicles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  deleteCab: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/drivers/vehicles/${id}`, {
      method: "DELETE",
    })
  },
}
