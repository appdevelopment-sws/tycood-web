import React, { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Menu, Bell, LogOut, User, Shield, Sun, Moon } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { useTheme } from "../theme-provider"
import { ROUTES, SIDEBAR_NAVIGATION } from "../../constants/routes"

interface HeaderProps {
  onToggleMobileSidebar: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  // Find current active menu title for breadcrumbs
  let currentTitle = "Dashboard"
  for (const sec of SIDEBAR_NAVIGATION) {
    const matched = sec.items.find((item) => item.path === location.pathname)
    if (matched) {
      currentTitle = matched.title
      break
    }
  }

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6 dark:border-slate-800/80 dark:bg-slate-900/80">
      {/* Left section: mobile menu toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            Admin
          </span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right section: Actions, Role Badge, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search Bar */}
        {/* <div className="relative hidden w-64 md:flex">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search bus, route, ticket..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-9 text-xs text-slate-900 transition outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
        </div> */}

        {/* User Role Badge */}
        <div className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
          <Shield className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            Role: {user?.role || "ADMIN"}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Toggle Theme"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
          </button>
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-full p-1 hover:ring-2 hover:ring-indigo-500/30"
          >
            <img
              src={
                user?.avatarUrl ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              }
              alt={user?.name || "Admin"}
              className="h-8 w-8 rounded-full border border-slate-300 object-cover dark:border-slate-700"
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200/80 px-3 py-2 dark:border-slate-800/80">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {user?.name}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {user?.email}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    navigate(ROUTES.SETTINGS)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <User className="h-4 w-4" /> Account Settings
                </button>
              </div>

              <div className="border-t border-slate-200/80 pt-1 dark:border-slate-800/80">
                <button
                  onClick={() => {
                    logout()
                    navigate(ROUTES.LOGIN)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
