/**
 * Authentication & Authorization Types
 */

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[] | string[]
}

export interface AdminUser {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  operatorId?: string
  operatorName?: string
  avatarUrl?: string
  permissions: string[]
  createdAt?: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthState {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
