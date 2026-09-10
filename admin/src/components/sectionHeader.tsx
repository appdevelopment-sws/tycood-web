export default function sectionHeader(number: string, title: string) {
  return (
    <div className="mb-6 flex items-center gap-3 border-b pb-3 dark:border-slate-800">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400">
        {number}
      </span>
      <h4 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h4>
    </div>
  )
}
