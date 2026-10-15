import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  RotateCw,
  Car,
  Users,
  Wrench,
  SquareParking,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Search,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  FolderOpen,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"

import { MetricCard } from "../../components/common/MetricCard"
import { StatusBadge } from "../../components/common/StatusBadge"
import { Button } from "../../components/ui/button"
import { useDashboard } from "../../hooks/useDashboard"
import { ROUTES } from "../../constants/routes"

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d">("7d")
  const [chartMetric, setChartMetric] = useState<"revenue" | "volume">("revenue")
  const [searchQuery, setSearchQuery] = useState("")

  const {
    summary,
    metrics,
    revenueTrend,
    serviceDistribution,
    fleetBreakdown,
    partnerSummary,
    recentBookings,
    isLoading,
    error,
    refetch,
  } = useDashboard(timeRange)

  // Filter dynamic recent bookings based on search query
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return recentBookings
    const q = searchQuery.toLowerCase()
    return recentBookings.filter(
      (b) =>
        b.bookingNumber?.toLowerCase().includes(q) ||
        b.passengerName?.toLowerCase().includes(q) ||
        b.pickupLocation?.toLowerCase().includes(q) ||
        (b.dropLocation && b.dropLocation.toLowerCase().includes(q)) ||
        b.serviceType?.toLowerCase().includes(q)
    )
  }, [recentBookings, searchQuery])

  // Service Type badge helper
  const renderServiceBadge = (type: string) => {
    switch (type?.toUpperCase()) {
      case "CAB":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Car className="h-3 w-3" />
            Cab Ride
          </span>
        )
      case "PARKING":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <SquareParking className="h-3 w-3" />
            Smart Parking
          </span>
        )
      case "TECHNICIAN":
      case "MECHANIC":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Wrench className="h-3 w-3" />
            Roadside Assist
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {type || "Service"}
          </span>
        )
    }
  }

  // Dynamic Partner capacity data
  const partnerCapacityData = useMemo(
    () => [
      {
        name: "Cabs",
        Active: summary.activeCabs,
        Total: summary.totalCabs,
      },
      {
        name: "Drivers",
        Active: partnerSummary.drivers.online,
        Total: partnerSummary.drivers.total,
      },
      {
        name: "Mechanics",
        Active: partnerSummary.technicians.available,
        Total: partnerSummary.technicians.total,
      },
      {
        name: "Parking Lots",
        Active: partnerSummary.parking.verified,
        Total: partnerSummary.parking.total,
      },
    ],
    [summary, partnerSummary]
  )

  const fulfillmentRate = useMemo(() => {
    if (summary.totalBookings === 0) return "100%"
    return `${Math.round((summary.completedRides / summary.totalBookings) * 100)}%`
  }, [summary.totalBookings, summary.completedRides])

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Operations Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Database Connected
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time cab dispatch, roadside assistance response, smart parking reservations, and platform revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            {(["today", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  if (timeRange === r) {
                    refetch()
                  } else {
                    setTimeRange(r)
                  }
                }}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  timeRange === r
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                {r === "today" ? "Today" : r === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-1.5 text-xs font-medium shadow-sm bg-white dark:bg-slate-900"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => navigate(ROUTES.BOOKINGS)}
            className="gap-1.5 text-xs font-semibold shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Car className="h-4 w-4" />
            Live Bookings
          </Button>
        </div>
      </div>

      {/* Backend Communication Alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-600 dark:border-amber-500/20 dark:text-amber-400">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Backend Connection Notice</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-amber-500/40 text-xs hover:bg-amber-500/20"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 2. Key Operational Metrics Grid (100% Dynamic) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100 p-5 dark:border-slate-800 dark:bg-slate-800/50"
              />
            ))
          : metrics.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>

      {/* 3. Secondary Dynamic Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Registered Users</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {summary.totalUsers.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Completed Trips</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {summary.completedRides.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Ready Mechanics</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {summary.availableTechnicians}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <SquareParking className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Parking Facilities</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {summary.totalParkingFacilities}
            </div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Completion Rate</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {fulfillmentRate}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Dynamic Trend Chart (2 columns) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {chartMetric === "revenue" ? "Platform Revenue Trend" : "Booking Volume Trend"}
                </h3>
                <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {timeRange.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dynamic database aggregation for cab trips, roadside mechanic calls, and parking.
              </p>
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs dark:border-slate-800 dark:bg-slate-800/60">
              <button
                onClick={() => setChartMetric("revenue")}
                className={`rounded px-2.5 py-1 font-medium transition-all ${
                  chartMetric === "revenue"
                    ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setChartMetric("volume")}
                className={`rounded px-2.5 py-1 font-medium transition-all ${
                  chartMetric === "volume"
                    ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Trips & Jobs
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full pt-2">
            {revenueTrend.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <FolderOpen className="h-8 w-8 mb-2 opacity-50" />
                No time-series booking records found for the selected window.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) =>
                      chartMetric === "revenue"
                        ? `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                        : `${val}`
                    }
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                              {label}
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-between gap-4 font-semibold text-indigo-600 dark:text-indigo-400">
                                <span>Revenue:</span>
                                <span>₹{Number(data.revenue || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-slate-600 dark:text-slate-400">
                                <span>Total Bookings:</span>
                                <span className="font-semibold">{data.bookings}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-slate-500 text-[11px]">
                                <span>Cab Rides:</span>
                                <span>{data.cabs}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-slate-500 text-[11px]">
                                <span>Technician Calls:</span>
                                <span>{data.technicians}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-slate-500 text-[11px]">
                                <span>Parking Slots:</span>
                                <span>{data.parking}</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  {chartMetric === "revenue" ? (
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                  ) : (
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#volumeGrad)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dynamic Service Stream Distribution Donut (1 column) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Service Distribution
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Live Share
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live database counts across cab rides, parking, and roadside emergency assistance.
            </p>

            <div className="relative h-[200px] w-full my-2">
              {summary.totalBookings === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <FolderOpen className="h-8 w-8 mb-2 opacity-50" />
                  No bookings registered yet.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceDistribution}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {serviceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [`${value} bookings`, name]}
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          borderRadius: "8px",
                          border: "none",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-medium text-slate-400">Total</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {summary.totalBookings}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {serviceDistribution.map((s) => (
              <div key={s.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {s.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-500 dark:text-slate-400">{s.count} bkg</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {s.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Dynamic Fleet Readiness & Partner Network Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fleet Breakdown Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Car className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Fleet Readiness by Category
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live active vs total vehicles recorded per category
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(ROUTES.CABS_TYPE)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Manage Fleet <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {fleetBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No vehicles registered in fleet catalog yet.
              </div>
            ) : (
              fleetBreakdown.map((item, idx) => {
                const pct =
                  item.count > 0 ? Math.round((item.available / item.count) * 100) : 0
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {item.category}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {item.available}
                        </strong>{" "}
                        active of {item.count} total ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Dynamic Partner Capacity Bar Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Partner Capacity & Field Deployment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Actual database verified inventory vs active available partners
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-indigo-500" /> Active
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-slate-300 dark:bg-slate-700" /> Total
              </span>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partnerCapacityData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="Active" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Total" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. Quick Module Navigation Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => navigate(ROUTES.CABS_TYPE)}
          className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-105 transition-transform">
            <Car className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              Cabs & Fleet
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {summary.totalCabs} registered cabs
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate(ROUTES.DRIVERS)}
          className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <Users className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              Drivers & Pilots
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {partnerSummary.drivers.verified} verified drivers
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate(ROUTES.MECHANICS)}
          className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-800"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              Roadside Mechanics
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {summary.totalTechnicians} roadside technicians
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate(ROUTES.PARKING)}
          className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-cyan-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-800"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 group-hover:scale-105 transition-transform">
            <SquareParking className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              Parking Facilities
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {summary.totalParkingFacilities} parking facilities
            </div>
          </div>
        </button>
      </div>

      {/* 7. Live Multi-Service Recent Bookings Table (100% Dynamic) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Live Reservation & Dispatch Feed
              </h3>
              <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                Live Data
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Recent bookings placed across mobile passenger apps, roadside callouts, and parking
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket, customer, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.BOOKINGS)}
              className="gap-1.5 text-xs font-medium"
            >
              View All <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Booking # & Service</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Route / Location</th>
                <th className="py-3 px-4">Assigned Vehicle / Partner</th>
                <th className="py-3 px-4">Fare & Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Scheduled / Booked Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    {searchQuery
                      ? `No bookings found matching "${searchQuery}"`
                      : "No recent bookings recorded in the system yet."}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => navigate(ROUTES.BOOKINGS)}
                  >
                    {/* Booking Number & Service Badge */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {b.bookingNumber}
                      </div>
                      <div className="mt-1">{renderServiceBadge(b.serviceType)}</div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {b.passengerName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {b.passengerPhone}
                      </div>
                    </td>

                    {/* Route Corridor */}
                    <td className="py-3 px-4 max-w-[240px]">
                      <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100 truncate">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span className="truncate">{b.pickupLocation}</span>
                      </div>
                      {b.dropLocation && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                          <span className="truncate">{b.dropLocation}</span>
                        </div>
                      )}
                    </td>

                    {/* Assigned Cab / Partner */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {b.cabName || "—"}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {b.cabPlateNumber || b.driverName || "—"}
                      </div>
                    </td>

                    {/* Total Amount & Payment */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        ₹
                        {Number(b.totalAmount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <span className="inline-block rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-0.5">
                        {b.paymentStatus || "PENDING"}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} />
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {b.scheduledDateTime
                        ? new Date(b.scheduledDateTime).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default DashboardPage
