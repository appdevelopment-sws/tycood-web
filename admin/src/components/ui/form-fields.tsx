import { Controller, type Control, type FieldValues, type Path } from "react-hook-form"
import { ImageUpload } from "@/components/common/ImageUpload"
import { FileUpload } from "@/components/common/FileUpload"

interface FormFieldProps<TFieldValues extends FieldValues = any> {
  control: Control<TFieldValues> | any
  name: Path<TFieldValues> | string
  label: string
  placeholder?: string
  required?: boolean
  readOnly?: boolean
  type?: string
  step?: string
  rows?: number
}

export const FormField = <TFieldValues extends FieldValues = any>({
  control,
  name,
  label,
  placeholder,
  required,
  readOnly,
  type = "text",
  step,
  rows,
}: FormFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name as any}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field, fieldState: { error } }) => (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>

          {rows ? (
            <textarea
              {...field}
              rows={rows}
              readOnly={readOnly}
              placeholder={placeholder}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:bg-slate-950"
            />
          ) : (
            <input
              {...field}
              type={type}
              step={step}
              readOnly={readOnly}
              placeholder={placeholder}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:bg-slate-950"
            />
          )}

          {error && <p className="text-[11px] text-rose-500">{error.message}</p>}
        </div>
      )}
    />
  )
}

interface FormSelectFieldProps<TFieldValues extends FieldValues = any> {
  control: Control<TFieldValues> | any
  name: Path<TFieldValues> | string
  label: string
  options: { label: string; value: string | number }[]
  placeholder?: string
  readOnly?: boolean
  disabled?: boolean
  required?: boolean
}

export const FormSelectField = <TFieldValues extends FieldValues = any>({
  control,
  name,
  label,
  options,
  placeholder,
  readOnly,
  disabled,
  required,
}: FormSelectFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name as any}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field, fieldState: { error } }) => (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <select
            {...field}
            disabled={disabled || readOnly}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:bg-slate-950"
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && <p className="text-[11px] text-rose-500">{error.message}</p>}
        </div>
      )}
    />
  )
}

interface FormFileUploadProps<TFieldValues extends FieldValues = any> {
  control: Control<TFieldValues> | any
  name: Path<TFieldValues> | string
  label: string
  accept?: string
  maxSizeText?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  multiple?: boolean
  fileType?: "image" | "file" | "auto"
}

export const FormFileUpload = <TFieldValues extends FieldValues = any>({
  control,
  name,
  label,
  accept = "image/*",
  maxSizeText,
  disabled,
  readOnly,
  required,
  multiple = false,
  fileType = "auto",
}: FormFileUploadProps<TFieldValues>) => {
  const isImage =
    fileType === "image" ||
    (fileType === "auto" && accept.startsWith("image/") && !multiple)

  const defaultHelperText = isImage
    ? "Supports JPEG, PNG, WEBP, GIF, SVG up to 10MB"
    : "Supports PDF, DOC, DOCX, CSV, XLSX, Images up to 10MB"

  return (
    <Controller
      control={control}
      name={name as any}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <div className="space-y-1">
          {isImage ? (
            <ImageUpload
              label={label}
              value={value || ""}
              onChange={onChange}
              onRemove={() => onChange("")}
              disabled={disabled}
              readOnly={readOnly}
              helperText={maxSizeText || defaultHelperText}
            />
          ) : (
            <FileUpload
              label={label}
              value={value}
              onChange={onChange}
              multiple={multiple}
              disabled={disabled}
              readOnly={readOnly}
              accept={accept}
              helperText={maxSizeText || defaultHelperText}
            />
          )}
          {error && <p className="text-[11px] text-rose-500 mt-1">{error.message}</p>}
        </div>
      )}
    />
  )
}

interface FormCheckboxFieldProps<TFieldValues extends FieldValues = any> {
  control: Control<TFieldValues> | any
  name: Path<TFieldValues> | string
  label: string
  description?: string
  disabled?: boolean
  readOnly?: boolean
}

export const FormCheckboxField = <TFieldValues extends FieldValues = any>({
  control,
  name,
  label,
  description,
  disabled,
  readOnly,
}: FormCheckboxFieldProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name as any}
      render={({ field: { value, onChange } }) => (
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
          <input
            type="checkbox"
            checked={!!value}
            disabled={disabled || readOnly}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
          />
          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">
              {label}
            </label>
            {description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
    />
  )
}



