import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bus,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { ROUTES } from "../../constants/routes"
import { APP_CONFIG } from "../../constants/config"
import { Button } from "../../components/ui/button"

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD)
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setErrorMsg("Please enter a valid email address.")
      return
    }
    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      const res = await login({ email, password, rememberMe })
      if (res.success) {
        navigate(ROUTES.DASHBOARD)
      } else {
        setErrorMsg(res.error || "Invalid admin credentials. Please try again.")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication service unavailable.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 p-4 font-sans text-slate-900 antialiased transition-colors sm:p-6 lg:p-8 dark:bg-slate-950 dark:text-slate-100">
      {/* Dynamic Background Effects */}
      <div className="dark:/20 absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-600/20" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-indigo-500/30">
            <Bus className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {APP_CONFIG.LOGO_TEXT}
          </h1>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-2xl">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Admin Authentication
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in to manage fleet and reservations
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@busbooking.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-10 text-xs text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Secret Password
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-10 text-xs text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 bg-slate-50 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Remember session
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-500">
          {APP_CONFIG.COPYRIGHT}
        </p>
      </div>
    </div>
  )
}
