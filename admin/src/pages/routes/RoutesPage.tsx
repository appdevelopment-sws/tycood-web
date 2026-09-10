import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Eye, Trash2, MapPin, ArrowRight, Clock } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/common/DataTable"
import type { Column } from "@/components/common/DataTable"
import { FilterBar } from "@/components/filter-bar"
import SectionCard from "@/components/SectionCard"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirmDialog"
import { useDisclosure } from "@/hooks/useDisclosure"
import useSearchFilter from "@/hooks/useSearchFilter"
import { StatusBadge } from "@/components/common/StatusBadge"

import { routeService } from "@/services/routeService"
import { queryKeys } from "@/lib/queryKeys"
import { INITIAL_ROUTE_FILTERS } from "@/constants/page/super-admin/routes"
import RouteDrawer from "@/components/dialog/RoutesDialog"
import type { Route } from "@/types/bus"

export const RoutesPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<any>()
  const deleteDisclosure = useDisclosure<any>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_ROUTE_FILTERS)

  const { data: routes = [], isLoading } = useQuery({
    queryKey: queryKeys.routes.list(filter),
    queryFn: async () => {
      return routeService.getRoutes({
        search: filter.search || undefined,
        isActive: filter.isActive !== "" ? filter.isActive : undefined,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routeService.deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes.all })
      deleteDisclosure.onClose()
      toast.success("Route corridor deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete route corridor")
    },
  })

  const handleOpen = (
    route: Route | null = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    drawerDisclosure.onOpen(
      route ? { ...route, viewMode: mode === "view" } : null
    )
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  const columns: Column<Route>[] = useMemo(() => {
    return [
      {
        header: "Route Corridor",
        accessorKey: "name",
        cell: (row) => {
          const name = row.name || row.routeName || "Unnamed Route"
          const origin =
            row.sourceStation?.city || row.sourceStation?.name || row.originCity || "Origin"
          const destination =
            row.destinationStation?.city || row.destinationStation?.name || row.destinationCity || "Destination"

          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{name}</div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>{origin}</span>
                  <ArrowRight className="h-3 w-3 text-indigo-400 shrink-0" />
                  <span>{destination}</span>
                </div>
              </div>
            </div>
          )
        },
      },
      {
        header: "Distance",
        cell: (row) => <span className="font-semibold">{row.distanceKm} km</span>,
      },
      {
        header: "Est. Travel Time",
        cell: (row) => {
          const mins =
            row.estimatedDurationMinutes ||
            (row.estimatedDurationHours ? Math.round(row.estimatedDurationHours * 60) : 0)
          const hrs = (mins / 60).toFixed(1)

          return (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{hrs} hrs ({mins} mins)</span>
            </div>
          )
        },
      },
      {
        header: "Intermediate Stops",
        cell: (row) => {
          const count = row.stops ? row.stops.length : row.intermediateStopsCount || 0
          return (
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-200">
              {count} stops
            </span>
          )
        },
      },
      {
        header: "Status",
        cell: (row) => {
          const statusStr = row.isActive !== false && row.status !== "INACTIVE" ? "ACTIVE" : "INACTIVE"
          return <StatusBadge status={statusStr} />
        },
      },
      {
        header: "Actions",
        className: "text-right",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => handleOpen(row, "view")}
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => handleOpen(row, "edit")}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600"
              onClick={() => deleteDisclosure.onOpen(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]
  }, [deleteDisclosure])

  return (
    <div className="space-y-6">
      <RouteDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        route={drawerDisclosure.data}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Delete Route Corridor"
        description={`Are you sure you want to delete route "${deleteDisclosure.data?.name || deleteDisclosure.data?.routeName}"?`}
        onConfirm={() => deleteMutation.mutate(deleteDisclosure.data?.id)}
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="danger"
      />

      <SectionCard
        title="Routes & Transit Network"
        description="Define transit corridors, distances, intermediate boarding/dropping points, and operational routes"
        action={
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 size-4" />
            Create Route
          </Button>
        }
      >
        <div className="space-y-4">
          <FilterBar
            values={{ search: filter.search || "", isActive: filter.isActive || "" }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search route corridor or city..."
              className="w-[300px]"
            />
            <FilterBar.Select
              name="isActive"
              placeholder="All Statuses"
              options={[
                { label: "All Statuses", value: "" },
                { label: "Active", value: "true" },
                { label: "Inactive", value: "false" },
              ]}
              className="w-[180px]"
            />
          </FilterBar>

          <DataTable
            columns={columns}
            data={routes}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>
    </div>
  )
}

export default RoutesPage
