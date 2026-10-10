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

  toggleOperatorStatus: async (id: string): Promise<any> => {
    return apiClient<any>(`/parking/operators/${id}/toggle-status`, {
      method: "PATCH",
    })
  },

  deleteOperator: async (id: string): Promise<any> => {
    return apiClient<any>(`/parking/operators/${id}`, {
      method: "DELETE",
    })
  },

  toggleLocationStatus: async (id: string): Promise<any> => {
    return apiClient<any>(`/parking/locations/${id}/toggle-status`, {
      method: "PATCH",
    })
  },

  deleteLocation: async (id: string): Promise<any> => {
    return apiClient<any>(`/parking/locations/${id}`, {
      method: "DELETE",
    })
  },

  getParkingSettings: async (): Promise<ParkingSettings> => {
    return apiClient<ParkingSettings>("/parking/admin/settings")
  },

  updateParkingSettings: async (settings: Partial<ParkingSettings>): Promise<any> => {
    return apiClient<any>("/parking/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    })
  },

  getAdminBookings: async (filters?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ data: ParkingBookingAdminItem[]; total: number }> => {
    const params = new URLSearchParams()
    if (filters?.status) params.append("status", filters.status)
    if (filters?.search) params.append("search", filters.search)
    if (filters?.page) params.append("page", String(filters.page))
    if (filters?.limit) params.append("limit", String(filters.limit))

    const queryString = params.toString()
    const url = `/parking/admin/bookings${queryString ? `?${queryString}` : ""}`
    return apiClient<{ data: ParkingBookingAdminItem[]; total: number }>(url)
  },

  getReconciliationReport: async (): Promise<any> => {
    return apiClient<any>("/parking/admin/reports/reconciliation")
  },
}

export interface ParkingSettings {
  enabled: boolean
  commissionType: "PERCENTAGE" | "FIXED"
  commissionValue: number
  advancePaymentType: "PERCENTAGE" | "FIXED"
  advancePaymentValue: number
  minAdvanceAmount: number
  maxAdvanceAmount: number
  cancellationWindowHours: number
  refundDeductionPercentage: number
  gracePeriodMinutes: number
  overtimeHourlyRateMultiplier: number
}

export interface ParkingBookingAdminItem {
  id: string
  bookingNumber: string
  vehicleType: string
  vehicleNumber: string
  allocatedFloor: string
  allocatedBay: string
  entryDateTime: string
  exitDateTime: string
  durationHours: number
  totalAmount: number
  advanceAmount: number
  remainingAmount: number
  platformCommission: number
  operatorPayout: number
  status: string
  paymentStatus: string
  refundStatus: string
  paymentMethod: string
  location?: {
    id: string
    name: string
    city: string
    address: string
  }
  user?: {
    id: string
    name: string
    phone: string
  }
  createdAt: string
}
