export interface TruckType {
  id: string
  name: string
  category: string
  bodyType: string
  lengthFt: number
  widthFt: number
  heightFt: number
  dimensionLabel?: string
  minTons: number
  maxTons: number
  capacityRange: string
  wheelsNumber: number
  wheelCount: string
  suitableMaterials: string[]
  iconUrl?: string
  description?: string
  sortOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateTruckTypePayload {
  name: string
  category: string
  bodyType?: string
  lengthFt?: number
  widthFt?: number
  heightFt?: number
  dimensionLabel?: string
  minTons?: number
  maxTons?: number
  capacityRange: string
  wheelsNumber?: number
  wheelCount?: string
  suitableMaterials?: string[]
  iconUrl?: string
  description?: string
  sortOrder?: number
  isActive?: boolean
}

export type UpdateTruckTypePayload = Partial<CreateTruckTypePayload>

export interface TruckTypeFilterParams {
  search?: string
  category?: string
  isActive?: string
  page?: number
  limit?: number
}

export interface Load {
  id: string
  loadNumber: string
  pickupCity: string
  pickupState: string
  pickupAddress?: string
  unloadingCity: string
  unloadingState: string
  unloadingAddress?: string
  addressNote?: string
  distanceKm: number
  product: string
  productCategory: string
  productLengthFt?: number
  totalLoadTons: string
  totalLoadNumber: number
  truckTypeId?: string
  truckType?: TruckType
  requiredTruckCategory: string
  requiredTruckTypeDesc: string
  requiredWheels: string
  requiredMinLengthFt: number
  paymentTerms: string
  ratePerTruck: number
  isRateNegotiable: boolean
  pricingNote?: string
  transporterName: string
  transporterCompany: string
  transporterPhone: string
  transporterRating: number
  isTransporterVerified: boolean
  status: "OPEN" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED"
  instructions?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateLoadPayload {
  loadNumber?: string
  pickupCity: string
  pickupState?: string
  pickupAddress?: string
  unloadingCity: string
  unloadingState?: string
  unloadingAddress?: string
  addressNote?: string
  distanceKm?: number
  product: string
  productCategory?: string
  productLengthFt?: number
  totalLoadTons?: string
  totalLoadNumber?: number
  truckTypeId?: string
  requiredTruckCategory?: string
  requiredTruckTypeDesc?: string
  requiredWheels?: string
  requiredMinLengthFt?: number
  paymentTerms?: string
  ratePerTruck: number
  isRateNegotiable?: boolean
  pricingNote?: string
  transporterName?: string
  transporterCompany?: string
  transporterPhone?: string
  transporterRating?: number
  isTransporterVerified?: boolean
  status?: "OPEN" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED"
  instructions?: string
}

export type UpdateLoadPayload = Partial<CreateLoadPayload>

export interface LoadFilterParams {
  search?: string
  pickupCity?: string
  unloadingCity?: string
  truckCategory?: string
  status?: string
  page?: number
  limit?: number
}
