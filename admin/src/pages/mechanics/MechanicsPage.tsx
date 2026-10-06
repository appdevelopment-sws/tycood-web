import { useCallback, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Wrench, CheckCircle2, XCircle, Eye } from "lucide-react"
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

import { technicianService, type Technician } from "@/services/technicianService"
import TechnicianDrawer from "@/components/dialog/TechnicianDrawer"

const INITIAL_MECHANIC_FILTERS = {
  search: "",
  verificationStatus: "",
  availabilityStatus: "",
}

export const MechanicsPage = () => {
  const queryClient = useQueryClient()

  const drawerDisclosure = useDisclosure<Technician>()
  const rejectDisclosure = useDisclosure<Technician>()
  const [rejectReason, setRejectReason] = useState("")

  const { filter, handleFilter } = useSearchFilter(INITIAL_MECHANIC_FILTERS)

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ["technicians", filter],
    queryFn: async () => {
      return technicianService.getTechnicians({
        search: filter.search || undefined,
        verificationStatus: filter.verificationStatus || undefined,
        availabilityStatus: filter.availabilityStatus || undefined,
      })
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => technicianService.verifyTechnician(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] })
      drawerDisclosure.onClose()
      toast.success("Technician / Mechanic verified and activated successfully!")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to verify technician")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      technicianService.rejectTechnician(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] })
      rejectDisclosure.onClose()
      setRejectReason("")
      toast.success("Technician application rejected")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject technician")
    },
  })

  const handleOpen = (technician: Technician | null = null) => {
    drawerDisclosure.onOpen(technician ? { ...technician, viewMode: true } : null)
  }

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter(updates)
    },
    [handleFilter]
  )

  const columns: Column<Technician>[] = useMemo(() => {
    return [
      {
        header: "Technician & Workshop",
        accessorKey: "workshopName",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 font-bold text-amber-600">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {row.user?.name || "Mechanic"}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {row.workshopName || "Independent Workshop"}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Phone Contact",
        cell: (row) => (
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {row.user?.phone || "—"}
          </span>
        ),
      },
      {
        header: "Specializations",
        cell: (row) => (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {row.specializations && row.specializations.length > 0 ? (
              row.specializations.slice(0, 2).map((s, idx) => (
                <span
                  key={idx}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">General</span>
            )}
            {row.specializations && row.specializations.length > 2 && (
              <span className="text-[10px] text-slate-400">+{row.specializations.length - 2}</span>
            )}
          </div>
        ),
      },
      {
        header: "Coverage Area",
        cell: (row) => (
          <div>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {row.baseArea || "Citywide"}
            </span>
            <div className="text-[11px] text-slate-500">
              {row.serviceRadiusKm ? `${row.serviceRadiusKm} km radius` : ""}
            </div>
          </div>
        ),
      },
      {
        header: "Experience",
        cell: (row) => (
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.experienceYears || "—"}
          </span>
        ),
      },
      {
        header: "Status",
        cell: (row) => (
          <StatusBadge status={row.availabilityStatus || "OFFLINE"} />
        ),
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
      <TechnicianDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        technician={drawerDisclosure.data}
        onVerify={(id) => verifyMutation.mutate(id)}
        isVerifying={verifyMutation.isPending}
      />

      {/* Reject Confirmation */}
      <ConfirmDialog
        open={rejectDisclosure.isOpen}
        onOpenChange={rejectDisclosure.onClose}
        title="Reject Technician Registration"
        description={`Reject registration for "${rejectDisclosure.data?.user?.name || rejectDisclosure.data?.workshopName}"?`}
        onConfirm={() =>
          rejectMutation.mutate({
            id: rejectDisclosure.data?.id || "",
            reason: rejectReason || "Qualifications or trade license could not be confirmed",
          })
        }
        isLoading={rejectMutation.isPending}
        confirmText="Reject Registration"
        variant="danger"
      />

      <SectionCard
        title="Mechanics & Technicians"
        description="Verify and manage automotive breakdown technicians, mechanics, and roadside assistance partners"
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
              placeholder="Search by mechanic name, workshop, or phone..."
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

          <DataTable columns={columns} data={technicians} isLoading={isLoading} />
        </div>
      </SectionCard>
    </div>
  )
}

export default MechanicsPage
