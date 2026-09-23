export type CabCategoryEnum =
  | 'Hatchback'
  | 'Sedan'
  | 'SUV / XL'
  | 'Electric (EV)'
  | 'Luxury'

export type CabStatusEnum = 'ACTIVE' | 'MAINTENANCE' | 'BREAKDOWN' | 'RETIRED' | 'INACTIVE'

export interface CabVehicle {
  id: string
  ownerUserId?: string
  vehicleCategory: string
  name?: string
  similarModels?: string
  make?: string
  model?: string
  registrationNumber: string
  color?: string
  manufacturingYear?: string
  fuelType?: string
  seatingCapacity: number
  luggageCapacity: number
  rcNumber?: string
  insurancePolicyNumber?: string
  permitType?: string
  rcPhotoUploaded?: boolean
  insuranceDocUploaded?: boolean

  // Pricing Engine
  baseFare: number
  baseKm: number
  perKmCharge: number
  extraKmCharge: number
  roundoffCostPerKm: number
  outstationBaseCharge: number
  outstationPerKmCharge: number
  originalFare: number

  // App Card Presentation & Badges
  badgeTag?: string | null
  rating: number
  reviewsCount: number
  etaMinutes: number
  imageUrl?: string | null
  features: string[]
  hasAc: boolean
  tollIncluded: boolean
  freeCancellation: boolean
  isInstant: boolean

  status: CabStatusEnum
  createdAt?: string
  updatedAt?: string

  // Transient / Modal Mode
  viewMode?: boolean
}

export interface CreateCabPayload {
  vehicleCategory: string
  name?: string
  similarModels?: string
  make?: string
  model?: string
  registrationNumber?: string
  color?: string
  manufacturingYear?: string
  fuelType?: string
  seatingCapacity?: number
  luggageCapacity?: number
  rcNumber?: string
  insurancePolicyNumber?: string
  permitType?: string

  baseFare?: number
  baseKm?: number
  perKmCharge?: number
  extraKmCharge?: number
  roundoffCostPerKm?: number
  outstationBaseCharge?: number
  outstationPerKmCharge?: number
  originalFare?: number

  badgeTag?: string
  rating?: number
  reviewsCount?: number
  etaMinutes?: number
  imageUrl?: string
  features?: string[]
  hasAc?: boolean
  tollIncluded?: boolean
  freeCancellation?: boolean
  isInstant?: boolean

  status?: CabStatusEnum | string
}

export type UpdateCabPayload = Partial<CreateCabPayload>

export interface CabFilterParams {
  search?: string
  category?: string
  status?: string
  fuelType?: string
  page?: number
  limit?: number
}
