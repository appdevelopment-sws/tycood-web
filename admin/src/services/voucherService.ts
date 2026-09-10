import { apiClient } from "../lib/apiClient"
import type { Voucher, CreateVoucherPayload, UpdateVoucherPayload } from "../types/voucher"

export const voucherService = {
  getVouchers: async (params?: { search?: string; status?: string; isVisible?: string }): Promise<Voucher[]> => {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append("search", params.search)
    if (params?.status) queryParams.append("status", params.status)
    if (params?.isVisible) queryParams.append("isVisible", params.isVisible)

    const queryString = queryParams.toString()
    return apiClient<Voucher[]>(`/vouchers${queryString ? `?${queryString}` : ""}`)
  },

  getVoucherById: async (id: string): Promise<Voucher> => {
    return apiClient<Voucher>(`/vouchers/${id}`)
  },

  createVoucher: async (payload: CreateVoucherPayload): Promise<Voucher> => {
    return apiClient<Voucher>("/vouchers", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateVoucher: async (id: string, payload: UpdateVoucherPayload): Promise<Voucher> => {
    return apiClient<Voucher>(`/vouchers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  toggleVisibility: async (id: string, isVisible?: boolean): Promise<Voucher> => {
    return apiClient<Voucher>(`/vouchers/${id}/toggle-visibility`, {
      method: "PATCH",
      body: JSON.stringify({ isVisible }),
    })
  },

  toggleActive: async (id: string, isActive?: boolean): Promise<Voucher> => {
    return apiClient<Voucher>(`/vouchers/${id}/toggle-active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    })
  },

  deleteVoucher: async (id: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/vouchers/${id}`, {
      method: "DELETE",
    })
  },
}
