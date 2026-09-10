export interface PassengerUser {
  id: string
  name: string
  email: string
  phone?: string
  age?: number
  address?: string
  emergencyContact?: string
  isActive?: boolean
  status: "ACTIVE" | "INACTIVE"
  totalTripsCount?: number
  walletBalance?: number
  roles?: string[]
  createdAt?: string
  updatedAt?: string
  viewMode?: boolean
}

export interface CreateUserPayload {
  name: string
  email: string
  phone?: string
  age?: number
  address?: string
  emergencyContact?: string
  password?: string
  isActive?: boolean
  status?: "ACTIVE" | "INACTIVE"
  roleName?: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  phone?: string
  age?: number
  address?: string
  emergencyContact?: string
  password?: string
  isActive?: boolean
  status?: "ACTIVE" | "INACTIVE"
  roleName?: string
}
