import { apiClient } from "../lib/apiClient"

export interface Technician {
  id: string
  userId?: string
  user?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  workshopName?: string
  specializations: string[]
  experienceYears: string
  tradeQualification?: string
  bio?: string
  toolsAvailable?: string[]
  vehicleType?: string
  baseArea?: string
  serviceRadiusKm?: number
  operatingShift?: string
  idProofUploaded?: boolean
  certificateUploaded?: boolean
  policeClearanceAccepted?: boolean
  accountHolder?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  upiId?: string
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | string
  availabilityStatus: "AVAILABLE" | "ON_JOB" | "OFFLINE" | string
  rating?: number
  completedJobsCount?: number
  createdAt?: string
  updatedAt?: string
  viewMode?: boolean
}

export interface TechnicianFilters {
  search?: string
  verificationStatus?: string
  availabilityStatus?: string
  specialization?: string
}

export const technicianService = {
  getTechnicians: async (filters?: TechnicianFilters): Promise<Technician[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.verificationStatus) params.append("verificationStatus", filters.verificationStatus)
    if (filters?.availabilityStatus) params.append("availabilityStatus", filters.availabilityStatus)
    if (filters?.specialization) params.append("specialization", filters.specialization)

    const queryString = params.toString()
    const url = `/technicians${queryString ? `?${queryString}` : ""}`
    const response = await apiClient<any>(url)

    const items = Array.isArray(response)
      ? response
      : (response?.data || [])

    return items.map((t: any) => ({
      id: t.id,
      userId: t.userId,
      user: t.user,
      workshopName: t.workshopName || "Independent Workshop",
      specializations: Array.isArray(t.specializations) ? t.specializations : [],
      experienceYears: t.experienceYears || "—",
      tradeQualification: t.tradeQualification,
      bio: t.bio,
      toolsAvailable: Array.isArray(t.toolsAvailable) ? t.toolsAvailable : [],
      vehicleType: t.vehicleType || "Service Vehicle",
      baseArea: t.baseArea || "General Coverage Area",
      serviceRadiusKm: t.serviceRadiusKm ?? 15,
      operatingShift: t.operatingShift || "24x7 Emergency",
      idProofUploaded: !!t.idProofUploaded,
      certificateUploaded: !!t.certificateUploaded,
      policeClearanceAccepted: !!t.policeClearanceAccepted,
      accountHolder: t.accountHolder,
      bankName: t.bankName,
      accountNumber: t.accountNumber,
      ifscCode: t.ifscCode,
      upiId: t.upiId,
      verificationStatus: t.verificationStatus || "PENDING",
      availabilityStatus: t.availabilityStatus || "OFFLINE",
      rating: t.rating ?? 4.9,
      completedJobsCount: t.completedJobsCount ?? 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))
  },

  verifyTechnician: async (id: string, notes?: string): Promise<any> => {
    return apiClient<any>(`/technicians/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    })
  },

  rejectTechnician: async (id: string, rejectionReason?: string): Promise<any> => {
    return apiClient<any>(`/technicians/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    })
  },
}
