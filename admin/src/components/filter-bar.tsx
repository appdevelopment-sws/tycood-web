import React from "react"
import { Search } from "lucide-react"

interface FilterBarProps {
  values: Record<string, any>
  onChange: (updates: Record<string, any>) => void
  children: React.ReactNode
}

export function FilterBar({ values, onChange, children }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child
        return React.cloneElement(child as React.ReactElement<any>, {
          values,
          onChange,
        })
      })}
    </div>
  )
}

interface FilterSearchProps {
  name: string
  placeholder?: string
  className?: string
  values?: Record<string, any>
  onChange?: (updates: Record<string, any>) => void
}

FilterBar.Search = function FilterSearch({
  name,
  placeholder = "Search...",
  className = "w-[300px]",
  values,
  onChange,
}: FilterSearchProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={values?.[name] || ""}
        onChange={(e) => onChange?.({ [name]: e.target.value })}
        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:bg-slate-950"
      />
    </div>
  )
}

interface FilterSelectProps {
  name: string
  placeholder?: string
  options: { label: string; value: string | number }[]
  className?: string
  values?: Record<string, any>
  onChange?: (updates: Record<string, any>) => void
}

FilterBar.Select = function FilterSelect({
  name,
  placeholder,
  options,
  className = "w-[180px]",
  values,
  onChange,
}: FilterSelectProps) {
  return (
    <select
      value={values?.[name] || ""}
      onChange={(e) => onChange?.({ [name]: e.target.value })}
      className={`rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:bg-slate-950 ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export default FilterBar

