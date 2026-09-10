import { apiClient } from "../lib/apiClient"
import type { BusOperator } from "../types/bus"

export interface CreateOperatorPayload {
  name: string
  code: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  logoUrl?: string
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  rating?: number
}

export interface UpdateOperatorPayload {
  name?: string
  code?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  logoUrl?: string
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  rating?: number
}

export const operatorService = {
  getOperators: async (): Promise<BusOperator[]> => {
    return apiClient<BusOperator[]>("/operator")
  },

  getOperatorById: async (id: string): Promise<BusOperator> => {
    return apiClient<BusOperator>(`/operator/${id}`)
  },

  createOperator: async (
    payload: CreateOperatorPayload
  ): Promise<BusOperator> => {
    return apiClient<BusOperator>("/operator", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateOperator: async (
    id: string,
    payload: UpdateOperatorPayload
  ): Promise<BusOperator> => {
    return apiClient<BusOperator>(`/operator/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  deleteOperator: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/operator/${id}`, {
      method: "DELETE",
    })
  },
}
