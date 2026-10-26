import React, { useState, useRef } from "react"
import { toast } from "sonner"
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Copy,
  Check,
  Loader2,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react"
import { fileUploadService } from "@/services/fileUploadService"
import { resolveCabImageUrl } from "@/lib/utils"

export interface ImageUploadProps {
  value?: string
  onChange?: (url: string) => void
  onRemove?: () => void
  disabled?: boolean
  readOnly?: boolean
  label?: string
  helperText?: string
  className?: string
  maxSizeMB?: number
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value = "",
  onChange,
  onRemove,
  disabled = false,
  readOnly = false,
  label = "Upload Image",
  helperText = "Supports JPEG, PNG, WEBP, GIF, SVG up to 10MB",
  className = "",
  maxSizeMB = 10,
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [manualUrl, setManualUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (disabled || readOnly) return

    // File type validation
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format. Please upload an image file.")
      return
    }

    // File size validation
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error(`File size exceeds limit (${maxSizeMB}MB).`)
      return
    }

    try {
      setIsUploading(true)
      const res = await fileUploadService.uploadImage(file)
      toast.success("Image uploaded successfully!")
      if (onChange) {
        onChange(res.url)
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !readOnly) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || readOnly) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleClear = () => {
    if (disabled || readOnly) return
    if (onChange) {
      onChange("")
    }
    if (onRemove) {
      onRemove()
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCopyUrl = () => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success("Image URL copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualUrl.trim()) return
    if (onChange) {
      onChange(manualUrl.trim())
    }
    setShowUrlInput(false)
    setManualUrl("")
    toast.success("Image URL updated!")
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            {label}
          </label>
          {!readOnly && !disabled && (
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
            >
              <LinkIcon className="h-3 w-3" />
              {showUrlInput ? "Dropzone upload" : "Paste URL"}
            </button>
          )}
        </div>
      )}

      {/* Manual URL Input Form */}
      {showUrlInput ? (
        <form onSubmit={handleManualUrlSubmit} className="flex gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"
          >
            Apply
          </button>
        </form>
      ) : value ? (
        /* Image Preview Box */
        <div className="relative group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/50 transition">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
              <img
                src={resolveCabImageUrl(value)}
                alt="Uploaded preview"
                className="h-full w-full object-cover transition group-hover:scale-105 duration-200"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = "none"
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition">
                <a
                  href={resolveCabImageUrl(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/80 p-1 text-slate-900 hover:bg-white transition"
                  title="View full image"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                {value.split("/").pop()}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {value}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                {!readOnly && !disabled && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Change</span>
                  </button>
                )}
              </div>
            </div>

            {!readOnly && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Dropzone Box */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !readOnly && !isUploading && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/20"
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/40"
          } ${disabled || readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2 py-2">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Uploading image...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="rounded-full bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    Click to upload
                  </span>{" "}
                  or drag & drop
                </p>
                <p className="text-[11px] text-slate-400">{helperText}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        disabled={disabled || readOnly || isUploading}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
