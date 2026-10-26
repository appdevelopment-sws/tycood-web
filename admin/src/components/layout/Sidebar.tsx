import React from "react"
import { NavLink } from "react-router-dom"
import * as Icons from "lucide-react"
import { ChevronLeft, ChevronRight, Bus, ShieldCheck } from "lucide-react"
import { SIDEBAR_NAVIGATION } from "../../constants/routes"
import { APP_CONFIG } from "../../constants/config"
import { useAuth } from "../../hooks/useAuth"
import { ROLE_BADGE_COLORS } from "../../constants/colors"

interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const { user, hasPermission } = useAuth()

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
    <aside
      className={`fixed top-0 left-0 z-30 flex h-screen flex-col border-r border-slate-200/80 bg-white text-slate-700 transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="d rounded-x flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-white shadow-md shadow-indigo-500/20">
            <Bus className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-bold tracking-tight dark:text-white">
                {APP_CONFIG.LOGO_TEXT}
              </span>
              {/* <span className="truncate text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                {APP_CONFIG.SUBTITLE}
              </span> */}
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:flex dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 scrollbar-thin scrollbar-thumb-slate-200 space-y-6 overflow-y-auto px-3 py-4 dark:scrollbar-thumb-slate-800">
        {SIDEBAR_NAVIGATION.map((section, idx) => {
          // Filter items based on user permissions
          const visibleItems = section.items.filter((item) => {
            if (!item.resourcePermission) return true
            const [resource, action] = item.resourcePermission.split(":")
            return hasPermission(resource, action || "read")
          })

          if (visibleItems.length === 0) return null

          return (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <h4 className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                  {section.sectionTitle}
                </h4>
              )}

              <nav className="space-y-1">
                {visibleItems.map((item) => {
                  const IconComponent =
                    (Icons as unknown as Record<string, React.ElementType>)[
                      item.iconName
                    ] || Icons.HelpCircle

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                          isActive
                            ? "shadow-primary-600/30 bg-primary text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
                        } ${isCollapsed ? "justify-center px-0" : ""}`
                      }
                    >
                      <IconComponent className="h-4 w-4 shrink-0" />
                      {!isCollapsed && (
                        <span className="flex-1 truncate">{item.title}</span>
                      )}
                      {!isCollapsed && item.badge && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          )
        })}
      </div>

      {/* Footer User Profile Widget */}
      <div className="border-t border-slate-200/80 p-3 dark:border-slate-800/80">
        <div
          className={`flex items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50 p-2.5 dark:border-slate-800/80 dark:bg-slate-950/60 ${isCollapsed ? "justify-center" : ""}`}
        >
          <img
            src={
              user?.avatarUrl ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            }
            alt={user?.name || "User"}
            className="h-8 w-8 rounded-full border border-indigo-500/40 object-cover"
          />
          {!isCollapsed && (
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                {user?.name}
              </span>
              <div className="mt-0.5 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                <span
                  className={`py-0.2 truncate rounded px-1.5 text-[10px] font-bold ${roleStyle.bg} ${roleStyle.text}`}
                >
                  {user?.role}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
