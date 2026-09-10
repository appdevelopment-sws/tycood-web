import { useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Eye, Trash2, Building, MapPin } from "lucide-react"
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

import { stationService } from "@/services/stationService"
import { queryKeys } from "@/lib/queryKeys"
import { INITIAL_STATION_FILTERS } from "@/constants/page/super-admin/stations"
import StationDrawer from "@/components/dialog/StationsDialog"
import type { Station } from "@/types/bus"

export const StationsPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<any>()
  const deleteDisclosure = useDisclosure<any>()

  const { filter, handleFilter } = useSearchFilter(INITIAL_STATION_FILTERS)

  const { data: stations = [], isLoading } = useQuery({
    queryKey: queryKeys.stations.list(filter),
    queryFn: async () => {
      return stationService.getStations({
        search: filter.search || undefined,
        isActive: filter.isActive !== "" ? filter.isActive : undefined,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stationService.deleteStation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.all })
      deleteDisclosure.onClose()
      toast.success("Bus station / terminal deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete station")
    },
  })

  const handleOpen = (
    station: Station | null = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    drawerDisclosure.onOpen(
      station ? { ...station, viewMode: mode === "view" } : null
    )
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  const columns: Column<Station>[] = useMemo(() => {
    return [
      {
        header: "Terminal Name",
        accessorKey: "name",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 font-bold shrink-0">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {row.name}
              </div>
              {row.terminalName && (
                <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  Terminal: {row.terminalName}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        header: "City & State",
        cell: (row) => (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {row.city}{row.state ? `, ${row.state}` : ""}
          </span>
        ),
      },
      {
        header: "GPS Coordinates",
        cell: (row) => {
          if (!row.latitude && !row.longitude) {
            return <span className="text-xs text-slate-400">—</span>
          }
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-300">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
              <span>{row.latitude}, {row.longitude}</span>
            </div>
          )
        },
      },
      {
        header: "Status",
        cell: (row) => {
          const statusStr = row.isActive !== false ? "ACTIVE" : "INACTIVE"
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
      <StationDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        station={drawerDisclosure.data}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Delete Station / Terminal"
        description={`Are you sure you want to delete terminal "${deleteDisclosure.data?.name}" (${deleteDisclosure.data?.city})?`}
        onConfirm={() => deleteMutation.mutate(deleteDisclosure.data?.id)}
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="danger"
      />

      <SectionCard
        title="Terminals & Stations"
        description="Manage passenger boarding hubs, drop-off terminals, cities, and GPS station coordinates"
        action={
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 size-4" />
            Add Terminal
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
              placeholder="Search station name, city, or terminal..."
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
            data={stations}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>
    </div>
  )
}

export default StationsPage
