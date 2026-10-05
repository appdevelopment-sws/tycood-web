import { apiClient } from "../lib/apiClient"
import type { PassengerUser, CreateUserPayload, UpdateUserPayload } from "../types/user"

export interface PaginatedUsersResponse {
  data: PassengerUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const userService = {
  getUsers: async (filters?: {
    search?: string
    status?: string
    role?: string
    page?: number
    limit?: number
  }): Promise<PaginatedUsersResponse> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.role) {
      params.append("role", filters.role === "USER" ? "CUSTOMER" : filters.role)
    }
    if (filters?.page) params.append("page", String(filters.page))
    if (filters?.limit) params.append("limit", String(filters.limit))

    const queryStr = params.toString() ? `?${params.toString()}` : ""
    const response = await apiClient<any>(`/users${queryStr}`)

    const items = Array.isArray(response)
      ? response
      : (response?.data || [])

    const normalizedData: PassengerUser[] = items.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      age: u.age,
      address: u.address,
      emergencyContact: u.emergencyContact,
      isActive: u.isActive !== undefined ? u.isActive : (u.status !== 'INACTIVE'),
      status: u.status || (u.isActive === false ? 'INACTIVE' : 'ACTIVE'),
      totalTripsCount: u.totalTripsCount ?? 0,
      walletBalance: typeof u.walletBalance === 'number' ? u.walletBalance : parseFloat(u.walletBalance || 0),
      roles: u.roles || (u.userRoles || []).map((ur: any) => ur.role?.name).filter(Boolean) || ['CUSTOMER'],
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }))

    return {
      data: normalizedData,
      total: response?.meta?.total ?? normalizedData.length,
      page: response?.meta?.page ?? 1,
      limit: response?.meta?.limit ?? normalizedData.length,
      totalPages: response?.meta?.totalPages ?? 1,
    }
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
