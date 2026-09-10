import React from "react"
import { MetricCard } from "../../components/common/MetricCard"
import { Download } from "lucide-react"
import { Button } from "../../components/ui/button"

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Analytics & Revenue Reports
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Financial auditing, trip yield performance, commission breakdowns,
            and occupancy analytics.
          </p>
        </div>

        <Button className="gap-1.5 text-xs font-semibold text-white">
          <Download className="h-4 w-4" /> Export CSV Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Gross Sales YTD"
          value="$1,420,800.00"
          changePercent={18.4}
          trend="up"
          description="Total online ticket sales across all operators"
          iconName="DollarSign"
        />
        <MetricCard
          title="Platform Commission"
          value="$142,080.00"
          changePercent={18.4}
          trend="up"
          description="Average 10% platform service fee"
          iconName="TrendingUp"
        />
        <MetricCard
          title="Avg Seat Load Factor"
          value="84.2%"
          changePercent={4.1}
          trend="up"
          description="Occupancy per dispatched trip"
          iconName="BarChart3"
        />
      </div>

      {/* Analytics Breakdown Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Corridor Revenue Distribution
        </h3>
        <div className="space-y-3">
          {[
            {
              route: "New York ↔ Boston Corridor",
              revenue: "$540,200",
              share: "38%",
            },
            {
              route: "Washington D.C. ↔ Philadelphia",
              revenue: "$410,500",
              share: "29%",
            },
            {
              route: "Chicago ↔ Detroit Corridor",
              revenue: "$320,100",
              share: "22%",
            },
            {
              route: "Los Angeles ↔ Las Vegas Express",
              revenue: "$150,000",
              share: "11%",
            },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.route}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {item.revenue} ({item.share})
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full dark:bg-indigo-500"
                  style={{ width: item.share }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
