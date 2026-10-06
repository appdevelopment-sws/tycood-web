import { useCallback, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SquareParking, CheckCircle2, XCircle, Eye } from "lucide-react"
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

import { parkingAdminService, type ParkingOperatorItem } from "@/services/parkingAdminService"
import ParkingDrawer from "@/components/dialog/ParkingDrawer"

const INITIAL_PARKING_FILTERS = {
  search: "",
  verificationStatus: "",
}

export const ParkingPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<ParkingOperatorItem>()
  const rejectDisclosure = useDisclosure<ParkingOperatorItem>()
  const [rejectReason, setRejectReason] = useState("")

  const { filter, handleFilter } = useSearchFilter(INITIAL_PARKING_FILTERS)

  const { data: operators = [], isLoading } = useQuery({
    queryKey: ["parking-operators", filter],
    queryFn: async () => {
      return parkingAdminService.getOperators({
        search: filter.search || undefined,
        verificationStatus: filter.verificationStatus || undefined,
      })
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => parkingAdminService.verifyOperator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-operators"] })
      drawerDisclosure.onClose()
      toast.success("Parking operator verified and facilities activated successfully!")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to verify parking operator")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      parkingAdminService.rejectOperator(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-operators"] })
      rejectDisclosure.onClose()
      setRejectReason("")
      toast.success("Parking operator application rejected")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject parking operator")
    },
  })

  const handleOpen = (operator: ParkingOperatorItem | null = null) => {
    drawerDisclosure.onOpen(operator ? { ...operator, viewMode: true } : null)
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter(updates)
    },
    [handleFilter]
  )

  const columns: Column<ParkingOperatorItem>[] = useMemo(() => {
    return [
      {
        header: "Facility & Owner",
        accessorKey: "facilityName",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 font-bold text-blue-600">
              <SquareParking className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {row.facilityName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Owner: {row.ownerName}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Contact Details",
        cell: (row) => (
          <div>
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
              {row.businessPhone}
            </div>
            {row.businessEmail && row.businessEmail !== "—" && (
              <div className="text-[11px] text-slate-500">{row.businessEmail}</div>
            )}
          </div>
        ),
      },
      {
        header: "Location & City",
        cell: (row) => {
          const loc = row.locations && row.locations.length > 0 ? row.locations[0] : null
          return (
            <div>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {loc ? loc.city : "Registered Site"}
              </span>
              <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                {loc ? loc.address : "Location details in review"}
              </div>
            </div>
          )
        },
      },
      {
        header: "Bay Capacity",
        cell: (row) => {
          const loc = row.locations && row.locations.length > 0 ? row.locations[0] : null
          if (!loc) return <span className="text-xs text-slate-400">—</span>
          return (
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {loc.capacity ?? (loc.carSlotsTotal + loc.bikeSlotsTotal)} Total Bays
              </span>
              <div className="text-[11px] text-slate-500">
                🚗 {loc.carSlotsTotal || 0} Cars • 🏍️ {loc.bikeSlotsTotal || 0} Bikes
              </div>
            </div>
          )
        },
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
                  className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 text-xs font-semibold shadow-xs"
                  onClick={() => verifyMutation.mutate(row.id)}
                  disabled={verifyMutation.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 px-2 text-xs font-medium"
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
              onClick={() => handleOpen(row)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]
  }, [verifyMutation, rejectDisclosure])

  return (
    <div className="space-y-6">
      <ParkingDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        operator={drawerDisclosure.data}
        onVerify={(id) => verifyMutation.mutate(id)}
        isVerifying={verifyMutation.isPending}
      />

      {/* Reject Confirmation */}
      <ConfirmDialog
        open={rejectDisclosure.isOpen}
        onOpenChange={rejectDisclosure.onClose}
        title="Reject Parking Operator"
        description={`Reject registration for "${rejectDisclosure.data?.facilityName}" (${rejectDisclosure.data?.ownerName})?`}
        onConfirm={() =>
          rejectMutation.mutate({
            id: rejectDisclosure.data?.id || "",
            reason: rejectReason || "Ownership proof or commercial permit could not be validated",
          })
        }
        isLoading={rejectMutation.isPending}
        confirmText="Reject Registration"
        variant="danger"
      />

      <SectionCard
        title="Parking Facilities & Operators"
        description="Verify commercial parking operators, approve inventory capacity, and oversee digital parking facilities"
      >
        <div className="space-y-4">
          <FilterBar
            values={{
              search: filter.search || "",
              verificationStatus: filter.verificationStatus || "",
            }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search by facility name, owner, or phone..."
              className="w-[300px]"
            />
            <FilterBar.Select
              name="verificationStatus"
              placeholder="All Verification States"
              options={[
                { label: "All Verification States", value: "" },
                { label: "Pending Verification", value: "PENDING" },
                { label: "Verified & Active", value: "VERIFIED" },
                { label: "Rejected", value: "REJECTED" },
              ]}
              className="w-48"
            />
          </FilterBar>

          <DataTable columns={columns} data={operators} isLoading={isLoading} />
        </div>
      </SectionCard>
    </div>
  )
}

export default ParkingPage
