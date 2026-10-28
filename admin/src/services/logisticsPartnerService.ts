import { apiClient } from "../lib/apiClient"

export interface LogisticsPartnerItem {
  id: string
  userId?: string
  user?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  businessName: string
  contactPerson: string
  phone: string
  email?: string
  operatingCity: string
  operatingHub: string
  businessType: string
  primaryCargoTypes: string[]
  requiredVehicleCategories: string[]
  gstin?: string
  pan?: string
  isGstVerified?: boolean
  isAadhaarVerified?: boolean
  idProofUploaded?: boolean
  businessProofUploaded?: boolean
  accountHolder?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  upiId?: string
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED" | string
  rejectionReason?: string
  reviewedBy?: string
  reviewedAt?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
  viewMode?: boolean
}

export interface LogisticsPartnerFilters {
  search?: string
  verificationStatus?: string
  city?: string
}

export const logisticsPartnerService = {
  getProviders: async (filters?: LogisticsPartnerFilters): Promise<LogisticsPartnerItem[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.verificationStatus && filters.verificationStatus !== "ALL") {
      params.append("verificationStatus", filters.verificationStatus)
    }
    if (filters?.city && filters.city !== "ALL") {
      params.append("city", filters.city)
    }

    const queryString = params.toString()
    const url = `/logistics/providers${queryString ? `?${queryString}` : ""}`
    const response = await apiClient<any>(url)

    const items = Array.isArray(response)
      ? response
      : (response?.data || [])

    return items.map((p: any) => ({
      id: p.id,
      userId: p.userId,
      user: p.user,
      businessName: p.businessName || "Freight Transporter",
      contactPerson: p.contactPerson || p.user?.name || "Transporter Partner",
      phone: p.phone || p.user?.phone || "—",
      email: p.email || p.user?.email || "—",
      operatingCity: p.operatingCity || "Patna",
      operatingHub: p.operatingHub || "Transport Nagar",
      businessType: p.businessType || "Transporter / Fleet Broker",
      primaryCargoTypes: Array.isArray(p.primaryCargoTypes) ? p.primaryCargoTypes : [],
      requiredVehicleCategories: Array.isArray(p.requiredVehicleCategories) ? p.requiredVehicleCategories : [],
      gstin: p.gstin || "—",
      pan: p.pan || "—",
      isGstVerified: !!p.isGstVerified,
      isAadhaarVerified: !!p.isAadhaarVerified,
      idProofUploaded: !!p.idProofUploaded,
      businessProofUploaded: !!p.businessProofUploaded,
      accountHolder: p.accountHolder || "—",
      bankName: p.bankName || "—",
      accountNumber: p.accountNumber || "—",
      ifscCode: p.ifscCode || "—",
      upiId: p.upiId || "—",
      verificationStatus: p.verificationStatus || "PENDING",
      rejectionReason: p.rejectionReason,
      reviewedBy: p.reviewedBy,
      reviewedAt: p.reviewedAt,
      notes: p.notes,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  },

  getProviderById: async (id: string): Promise<LogisticsPartnerItem> => {
    return apiClient<LogisticsPartnerItem>(`/logistics/providers/${id}`)
  },

  verifyProvider: async (id: string, notes?: string): Promise<any> => {
    return apiClient<any>(`/logistics/providers/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    })
  },

  rejectProvider: async (id: string, rejectionReason: string): Promise<any> => {
    return apiClient<any>(`/logistics/providers/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    })
  },
}
