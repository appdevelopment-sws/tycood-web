import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves an image URL safely for the admin console.
 * Handles full HTTP URLs, backend `/uploads` relative paths, and bundled `/assets` paths.
 */
export function resolveCabImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "/assets/car.png"
  const trimmed = url.trim()
  if (!trimmed) return "/assets/car.png"

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed
  }

  // Handle uploaded images (e.g. /uploads/... or uploads/...)
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
    const baseApi = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL
    if (baseApi && typeof baseApi === "string" && baseApi.startsWith("http")) {
      const baseUrl = baseApi.replace(/\/api\/?$/, "")
      return `${baseUrl.replace(/\/$/, "")}${cleanPath}`
    }
    return cleanPath
  }

  // Handle bundled public assets (e.g. /assets/... or assets/...)
  if (trimmed.startsWith("/assets/") || trimmed.startsWith("assets/")) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}
