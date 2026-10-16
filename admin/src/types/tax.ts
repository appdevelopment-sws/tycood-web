export type TaxType = 'PERCENTAGE' | 'FIXED'

export type TaxScope =
  | 'ALL_SERVICES'
  | 'ALL_RIDES'
  | 'TECHNICIAN'
  | 'PARKING'
  | 'INTERCITY_ONLY'
  | 'AIRPORT_RIDES'
  | 'NIGHT_RIDES'
  | 'OUTSTATION'

export interface Tax {
  id: string
  name: string
  code: string
  taxType: TaxType
  rate: number
  description?: string
  applicableOn: TaxScope
  isIncludedInFare: boolean
  isActive: boolean
  priority: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateTaxPayload {
  name: string
  code: string
  taxType: TaxType
  rate: number
  description?: string
  applicableOn: TaxScope
  isIncludedInFare: boolean
  isActive: boolean
  priority?: number
}

export type UpdateTaxPayload = Partial<CreateTaxPayload>

export interface TaxFilterParams {
  search?: string
  taxType?: string
  isActive?: string
  applicableOn?: string
  page?: number
  limit?: number
}
