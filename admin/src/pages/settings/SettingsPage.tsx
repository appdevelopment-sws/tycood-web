import React, { useState, useEffect } from "react"
import { User, Mail, Shield, Save, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { Button } from "../../components/ui/button"
import { ROLE_BADGE_COLORS } from "../../constants/colors"

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, refreshProfile } = useAuth()

  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const res = await updateProfile({ name: name.trim(), email: email.trim() })
      if (res.success) {
        setMessage({ type: "success", text: "Profile details updated successfully!" })
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update profile." })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An unexpected error occurred." })
    } finally {
      setIsSaving(false)
    }
  }

  const roleStyle = user?.role
    ? ROLE_BADGE_COLORS[user.role] || {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-700 dark:text-slate-300",
      }
    : {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-700 dark:text-slate-300",
      }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Account Profile & Settings
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Manage your logged-in administrator profile credentials, active roles, and system preferences.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-xs font-medium ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* User Profile Card Header */}
      <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <img
            src={
              user?.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.name || "Admin"
              )}&background=6366f1&color=fff`
            }
            alt={user?.name || "User"}
            className="h-16 w-16 rounded-full border-2 border-indigo-500/40 object-cover shadow-md"
          />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {user?.name || "Admin User"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${roleStyle.bg} ${roleStyle.text}`}
              >
                <Shield className="h-3 w-3" />
                {user?.role || "SUPER_ADMIN"}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => refreshProfile()}
          className="flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Sync Profile
        </Button>
      </div>

      {/* Profile Form */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <h3 className="border-b border-slate-200 pb-4 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-slate-100">
          Personal Information
        </h3>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Profile Details
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Permissions Breakdown */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <h3 className="border-b border-slate-200 pb-4 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-slate-100">
          Assigned Permissions & Privileges
        </h3>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Active system privileges for resource operations on your account.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {user?.permissions && user.permissions.length > 0 ? (
            user.permissions.map((perm, idx) => (
              <span
                key={idx}
                className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                {perm}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">No custom permissions listed</span>
          )}
        </div>
      </div>
    </div>
  )
}
