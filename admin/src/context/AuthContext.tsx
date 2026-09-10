import React, { createContext, useState, useEffect, useCallback } from "react"
import type { AdminUser, AuthState, LoginCredentials } from "../types/auth"
import { APP_CONFIG, DEFAULT_ROLE_PERMISSIONS } from "../constants"
import { apiClient } from "../lib/apiClient"

export interface AuthContextType extends AuthState {
  login: (
    credentials: LoginCredentials
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  hasPermission: (resource: string, action?: string) => boolean
  hasRole: (roleName: string) => boolean
  updateProfile: (data: {
    name?: string
    email?: string
    phone?: string
    age?: number
    address?: string
    emergencyContact?: string
  }) => Promise<{ success: boolean; error?: string }>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Authenticate with real backend login endpoint
  const authenticateWithBackend = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Perform backend login directly
      const data = await apiClient<{
        accessToken: string
        user?: {
          id?: string
          name?: string
          email?: string
          roles?: string[]
          permissions?: string[]
        }
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      if (data && data.accessToken) {
        const u = data.user || {}
        const roles = Array.isArray(u.roles) ? u.roles : []
        const primaryRole = roles[0] || "SUPER_ADMIN"
        const permissions =
          Array.isArray(u.permissions) && u.permissions.length > 0
            ? u.permissions
            : (DEFAULT_ROLE_PERMISSIONS as any)[primaryRole] || DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN

        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          u.name || email
        )}&background=6366f1&color=fff`

        const adminUser: AdminUser = {
          id: u.id || "admin-id",
          name: u.name || "Admin User",
          email: u.email || email,
          role: primaryRole as any,
          permissions,
          avatarUrl: defaultAvatar,
        }

        setToken(data.accessToken)
        setUser(adminUser)
        localStorage.setItem(
          APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN,
          data.accessToken
        )
        localStorage.setItem(
          APP_CONFIG.STORAGE_KEYS.AUTH_USER,
          JSON.stringify(adminUser)
        )
        return { success: true }
      }
      return {
        success: false,
        error: "Invalid response from authentication server",
      }
    } catch (error: any) {
      console.warn("Backend login failed:", error)
      return {
        success: false,
        error: error.message || "Failed to authenticate",
      }
    }
  }

  const refreshProfile = useCallback(async () => {
    const storedToken = localStorage.getItem(
      APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN
    )
    if (!storedToken) return

    try {
      const freshUser = await apiClient<any>("/auth/me")
      if (freshUser && freshUser.id) {
        const roles = Array.isArray(freshUser.roles) ? freshUser.roles : []
        const primaryRole = roles[0] || "SUPER_ADMIN"
        const permissions =
          Array.isArray(freshUser.permissions) && freshUser.permissions.length > 0
            ? freshUser.permissions
            : (DEFAULT_ROLE_PERMISSIONS as any)[primaryRole] || DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN

        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          freshUser.name || freshUser.email
        )}&background=6366f1&color=fff`

        const updatedAdminUser: AdminUser = {
          id: freshUser.id,
          name: freshUser.name || "Admin User",
          email: freshUser.email,
          role: primaryRole as any,
          permissions,
          avatarUrl: defaultAvatar,
        }
        setUser(updatedAdminUser)
        localStorage.setItem(
          APP_CONFIG.STORAGE_KEYS.AUTH_USER,
          JSON.stringify(updatedAdminUser)
        )
      }
    } catch (e) {
      console.warn("Failed to refresh user profile from backend:", e)
    }
  }, [])

  // Load session from localStorage on mount & sync with GET /auth/me
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(
          APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN
        )
        const storedUserRaw = localStorage.getItem(
          APP_CONFIG.STORAGE_KEYS.AUTH_USER
        )

        if (storedToken) {
          setToken(storedToken)
          if (storedUserRaw) {
            setUser(JSON.parse(storedUserRaw))
          }
          await refreshProfile()
        } else {
          setToken(null)
          setUser(null)
        }
      } catch {
        setToken(null)
        setUser(null)
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_USER)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [refreshProfile])

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const res = await authenticateWithBackend(
        credentials.email,
        credentials.password
      )

      return res
    } catch (err: any) {
      return { success: false, error: err.message || "Authentication failed" }
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (dto: {
    name?: string
    email?: string
    phone?: string
    age?: number
    address?: string
    emergencyContact?: string
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = await apiClient<any>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(dto),
      })
      if (updated && user) {
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          updated.name || updated.email
        )}&background=6366f1&color=fff`

        const newUser: AdminUser = {
          ...user,
          name: updated.name || user.name,
          email: updated.email || user.email,
          avatarUrl: defaultAvatar,
        }
        setUser(newUser)
        localStorage.setItem(
          APP_CONFIG.STORAGE_KEYS.AUTH_USER,
          JSON.stringify(newUser)
        )
        return { success: true }
      }
      return { success: false, error: "Failed to update profile" }
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update profile" }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_USER)
  }

  const hasPermission = useCallback(
    (resource: string, action?: string): boolean => {
      if (!user) return false
      if (user.role === "SUPER_ADMIN" || user.permissions.includes("*"))
        return true

      const targetPermission = action ? `${resource}:${action}` : resource
      const readPermission = `${resource}:read`

      return (
        user.permissions.includes(targetPermission) ||
        user.permissions.includes(readPermission) ||
        user.permissions.includes(`${resource}:manage`)
      )
    },
    [user]
  )

  const hasRole = useCallback(
    (roleName: string): boolean => {
      if (!user) return false
      return user.role === roleName
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
