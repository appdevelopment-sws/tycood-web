import { useCallback, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus,
  Pencil,
  Eye,
  Trash2,
  UserCheck,
  Star,
  CheckCircle2,
  XCircle,
} from "lucide-react"
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

import { driverService } from "@/services/driverService"
import { queryKeys } from "@/lib/queryKeys"
import { INITIAL_DRIVER_FILTERS } from "@/constants/page/super-admin/drivers"
import DriverDrawer from "@/components/dialog/DriversDialog"
import type { Driver } from "@/types/bus"

export const DriversPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<any>()
  const deleteDisclosure = useDisclosure<any>()
  const rejectDisclosure = useDisclosure<any>()
  const [rejectReason, setRejectReason] = useState("")

  const { filter, handleFilter } = useSearchFilter(INITIAL_DRIVER_FILTERS)

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: queryKeys.drivers.list(filter),
    queryFn: async () => {
      return driverService.getDrivers({
        search: filter.search || undefined,
        status: filter.status || undefined,
      })
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => driverService.verifyDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all })
      toast.success("Driver verified and activated successfully!")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to verify driver")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      driverService.rejectDriver(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all })
      rejectDisclosure.onClose()
      setRejectReason("")
      toast.success("Driver application rejected")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject driver")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driverService.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all })
      deleteDisclosure.onClose()
      toast.success("Driver deleted successfully")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete driver")
    },
  })

  const handleOpen = (
    driver: Driver | null = null,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    drawerDisclosure.onOpen(
      driver ? { ...driver, viewMode: mode === "view" } : null
    )
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter({ ...updates, page: 1 })
    },
    [handleFilter]
  )

  const columns: Column<Driver>[] = useMemo(() => {
    return [
      {
        header: "Driver Name",
        accessorKey: "name",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 font-bold text-indigo-500">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {row.user?.name || row.name}
              </div>
              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                CDL: {row.licenseNumber}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Operator",
        cell: (row) => (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {row.operator?.name || row.operatorName || "—"}
          </span>
        ),
      },
      {
        header: "Phone Contact",
        cell: (row) => (
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {row.user?.phone || row.phone}
          </span>
        ),
      },
      {
        header: "Experience",
        cell: (row) => (
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.experienceYears ? `${row.experienceYears} Years` : "0 Years"}
          </span>
        ),
      },
      {
        header: "Rating",
        cell: (row) => (
          <div className="flex items-center gap-1 font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{row.rating ?? "5.0"}</span>
          </div>
        ),
      },
      {
        header: "Status",
        cell: (row) => <StatusBadge status={row.status || "PENDING"} />,
      },
      {
        header: "Verification",
        cell: (row) => (
          <StatusBadge status={row.verificationStatus || "PENDING"} />
        ),
      },
      {
        header: "Actions",
        className: "text-right",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            {row.verificationStatus !== "VERIFIED" ? (
              <>
                <Button
                  size="sm"
                  className="h-8 gap-1 bg-emerald-600 px-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                  onClick={() => verifyMutation.mutate(row.id)}
                  disabled={verifyMutation.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 border-rose-200 px-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  onClick={() => rejectDisclosure.onOpen(row)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified
              </span>
            )}

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
  }, [deleteDisclosure, rejectDisclosure, verifyMutation])

  return (
    <div className="space-y-6">
      <DriverDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        driver={drawerDisclosure.data}
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        open={rejectDisclosure.isOpen}
        onOpenChange={rejectDisclosure.onClose}
        title="Reject Driver Application"
        description={`Reject registration for driver "${rejectDisclosure.data?.name}" (${rejectDisclosure.data?.licenseNumber})?`}
        onConfirm={() =>
          rejectMutation.mutate({
            id: rejectDisclosure.data?.id || "",
            reason: rejectReason || "Documents could not be verified",
          })
        }
        isLoading={rejectMutation.isPending}
        confirmText="Reject Application"
        variant="danger"
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDisclosure.isOpen}
        onOpenChange={deleteDisclosure.onClose}
        title="Delete Driver"
        description={`Are you sure you want to delete driver "${deleteDisclosure.data?.name}" (${deleteDisclosure.data?.licenseNumber})?`}
        onConfirm={() => deleteMutation.mutate(deleteDisclosure.data?.id)}
        isLoading={deleteMutation.isPending}
        confirmText="Delete"
        variant="danger"
      />

      <SectionCard
        title="Drivers"
        description="Manage certified Commercial Driver Licenses (CDL), ratings, and operator assignments"
        action={
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 size-4" />
            Add Driver
          </Button>
        }
      >
        <div className="space-y-4">
          <FilterBar
            values={{
              search: filter.search || "",
              status: filter.status || "",
            }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search driver name, license, or operator..."
              className="w-[300px]"
            />
            <FilterBar.Select
              name="status"
              placeholder="All Statuses"
              options={[
                { label: "All Statuses", value: "" },
                { label: "Active", value: "ACTIVE" },
                { label: "On Trip", value: "ON_TRIP" },
                { label: "Off Duty", value: "OFF_DUTY" },
                { label: "Suspended", value: "SUSPENDED" },
              ]}
              className="w-45"
            />
          </FilterBar>

          <DataTable columns={columns} data={drivers} isLoading={isLoading} />
        </div>
      </SectionCard>
    </div>
  )
}

export default DriversPage
