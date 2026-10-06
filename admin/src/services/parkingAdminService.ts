import { apiClient } from "../lib/apiClient"

export interface ParkingOperatorItem {
  id: string
  userId?: string
  user?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  businessType?: string
  facilityName: string
  ownerName: string
  businessPhone: string
  businessEmail?: string
  gstin?: string
  ownershipProofUploaded?: boolean
  tradeLicenseUploaded?: boolean
  facilityPhotosUploaded?: boolean
  accountHolder?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | string
  locations?: any[]
  createdAt?: string
  updatedAt?: string
  viewMode?: boolean
}

export interface ParkingFilters {
  search?: string
  verificationStatus?: string
  city?: string
}

export const parkingAdminService = {
  getOperators: async (filters?: ParkingFilters): Promise<ParkingOperatorItem[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.verificationStatus) params.append("verificationStatus", filters.verificationStatus)

    const queryString = params.toString()
    const url = `/parking/operators${queryString ? `?${queryString}` : ""}`
    const response = await apiClient<any>(url)

    const items = Array.isArray(response)
      ? response
      : (response?.data || [])

    return items.map((op: any) => ({
      id: op.id,
      userId: op.userId,
      user: op.user,
      businessType: op.businessType || "Commercial Facility",
      facilityName: op.facilityName || `${op.ownerName}'s Parking Facility`,
      ownerName: op.ownerName || op.user?.name || "Owner",
      businessPhone: op.businessPhone || op.user?.phone || "—",
      businessEmail: op.businessEmail || op.user?.email || "—",
      gstin: op.gstin || "—",
      ownershipProofUploaded: !!op.ownershipProofUploaded,
      tradeLicenseUploaded: !!op.tradeLicenseUploaded,
      facilityPhotosUploaded: !!op.facilityPhotosUploaded,
      accountHolder: op.accountHolder,
      bankName: op.bankName,
      accountNumber: op.accountNumber,
      ifscCode: op.ifscCode,
      verificationStatus: op.verificationStatus || "PENDING",
      locations: Array.isArray(op.locations) ? op.locations : [],
      createdAt: op.createdAt,
      updatedAt: op.updatedAt,
    }))
  },

  verifyOperator: async (id: string, notes?: string): Promise<any> => {
    return apiClient<any>(`/parking/operators/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    })
  },

  rejectOperator: async (id: string, rejectionReason?: string): Promise<any> => {
    return apiClient<any>(`/parking/operators/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    })
  },
}
