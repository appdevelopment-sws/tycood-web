import { apiClient } from "../lib/apiClient"

export interface UploadResponse {
  url: string
  filename: string
  originalName: string
  mimetype: string
  size: number
}

export const fileUploadService = {
  /**
   * Upload a single file (image, document, etc.)
   */
  uploadSingle: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)

    return apiClient<UploadResponse>("/upload/single", {
      method: "POST",
      body: formData,
    })
  },

  /**
   * Upload an image file specifically (JPEG, PNG, WEBP, GIF, SVG)
   */
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)

    return apiClient<UploadResponse>("/upload/image", {
      method: "POST",
      body: formData,
    })
  },

  /**
   * Upload multiple files at once
   */
  uploadMultiple: async (files: File[]): Promise<UploadResponse[]> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append("files", file)
    })

    return apiClient<UploadResponse[]>("/upload/multiple", {
      method: "POST",
      body: formData,
    })
  },

  /**
   * Delete an uploaded file by filename
   */
  deleteFile: async (
    filename: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(
      `/upload/${encodeURIComponent(filename)}`,
      {
        method: "DELETE",
      }
    )
  },
}
