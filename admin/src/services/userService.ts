import { apiClient } from "../lib/apiClient"
import type { PassengerUser, CreateUserPayload, UpdateUserPayload } from "../types/user"

export const userService = {
  getUsers: async (filters?: { search?: string; status?: string; role?: string }): Promise<PassengerUser[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.role) params.append("role", filters.role)
    const queryStr = params.toString() ? `?${params.toString()}` : ""
    return apiClient<PassengerUser[]>(`/users${queryStr}`)
  },

  getUserById: async (id: string): Promise<PassengerUser> => {
    return apiClient<PassengerUser>(`/users/${id}`)
  },

  createUser: async (payload: CreateUserPayload): Promise<PassengerUser> => {
    return apiClient<PassengerUser>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<PassengerUser> => {
    return apiClient<PassengerUser>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(`/users/${id}`, {
      method: "DELETE",
    })
  },
}
