import React, { useState, useRef } from "react"
import { toast } from "sonner"
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Copy,
  Check,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { fileUploadService, type UploadResponse } from "@/services/fileUploadService"

export interface FileUploadProps {
  value?: string | string[] | UploadResponse[]
  onChange?: (value: any) => void
  multiple?: boolean
  disabled?: boolean
  readOnly?: boolean
  label?: string
  helperText?: string
  accept?: string
  maxSizeMB?: number
  className?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  multiple = false,
  disabled = false,
  readOnly = false,
  label = "Upload File(s)",
  helperText = "Supports PDF, DOC, DOCX, CSV, XLSX, Images up to 10MB",
  accept = "*",
  maxSizeMB = 10,
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadResponse[]>(() => {
    if (!value) return []
    if (Array.isArray(value)) {
      return value.map((item) =>
        typeof item === "string"
          ? {
              url: item,
              filename: item.split("/").pop() || "file",
              originalName: item.split("/").pop() || "file",
              mimetype: "application/octet-stream",
              size: 0,
            }
          : item
      )
    }
    return [
      {
        url: value,
        filename: value.split("/").pop() || "file",
        originalName: value.split("/").pop() || "file",
        mimetype: "application/octet-stream",
        size: 0,
      },
    ]
  })

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return ""
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith("image/"))
      return <ImageIcon className="h-5 w-5 text-indigo-500" />
    if (
      mimetype.includes("spreadsheet") ||
      mimetype.includes("excel") ||
      mimetype.includes("csv")
    )
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
    if (
      mimetype.includes("pdf") ||
      mimetype.includes("word") ||
      mimetype.includes("document")
    )
      return <FileText className="h-5 w-5 text-blue-500" />
    return <File className="h-5 w-5 text-slate-500" />
  }

  const processUpload = async (files: File[]) => {
    if (disabled || readOnly || files.length === 0) return

    const maxSizeBytes = maxSizeMB * 1024 * 1024
    for (const f of files) {
      if (f.size > maxSizeBytes) {
        toast.error(`File '${f.name}' exceeds the maximum allowed size of ${maxSizeMB}MB.`)
        return
      }
    }

    try {
      setIsUploading(true)
      let results: UploadResponse[] = []

      if (multiple && files.length > 1) {
        results = await fileUploadService.uploadMultiple(files)
      } else {
        const res = await fileUploadService.uploadSingle(files[0])
        results = [res]
      }

      const updated = multiple ? [...uploadedFiles, ...results] : results
      setUploadedFiles(updated)

      if (onChange) {
        if (multiple) {
          onChange(updated.map((u) => u.url))
        } else {
          onChange(updated[0]?.url || "")
        }
      }

      toast.success(
        results.length > 1
          ? `${results.length} files uploaded successfully!`
          : "File uploaded successfully!"
      )
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload file(s).")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processUpload(Array.from(files))
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
      processUpload(Array.from(files))
    }
  }

  const handleRemoveFile = (index: number) => {
    if (disabled || readOnly) return
    const updated = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(updated)

    if (onChange) {
      if (multiple) {
        onChange(updated.map((u) => u.url))
      } else {
        onChange(updated[0]?.url || "")
      }
    }
  }

  const handleCopyUrl = (url: string, index: number) => {
    navigator.clipboard.writeText(url)
    setCopiedIndex(index)
    toast.success("File URL copied to clipboard!")
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      {/* Dropzone area */}
      {(!uploadedFiles.length || multiple) && !readOnly && !disabled && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/20"
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/40"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2 py-2">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Uploading files...
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

      {/* Hidden Native Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        disabled={disabled || readOnly || isUploading}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File List Preview */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800 flex-shrink-0">
                  {getFileIcon(file.mimetype)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                    {file.originalName || file.filename}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    {file.size > 0 && <span>{formatFileSize(file.size)}</span>}
                    {file.size > 0 && <span>•</span>}
                    <span className="truncate max-w-[200px]">{file.url}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                  title="Open file"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyUrl(file.url, idx)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                  title="Copy URL"
                >
                  {copiedIndex === idx ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>

                {!readOnly && !disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition"
                    title="Remove file"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
