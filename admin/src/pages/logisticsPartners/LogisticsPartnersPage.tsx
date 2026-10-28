import { useCallback, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Truck,
  CheckCircle2,
  XCircle,
  Eye,
  Building2,
  AlertCircle,
  Clock,
  ShieldCheck,
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

import {
  logisticsPartnerService,
  type LogisticsPartnerItem,
} from "@/services/logisticsPartnerService"
import { queryKeys } from "@/lib/queryKeys"
import LogisticsPartnerDrawer from "@/components/dialog/LogisticsPartnerDrawer"

const INITIAL_FILTERS = {
  search: "",
  verificationStatus: "",
  city: "",
}

export const LogisticsPartnersPage = () => {
  const queryClient = useQueryClient()

  // Disclosures
  const drawerDisclosure = useDisclosure<LogisticsPartnerItem>()
  const rejectDisclosure = useDisclosure<LogisticsPartnerItem>()
  const [rejectReason, setRejectReason] = useState("")

  const { filter, handleFilter } = useSearchFilter(INITIAL_FILTERS)

  // 1. Fetch Logistics Providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: queryKeys.logisticsPartners.list(filter),
    queryFn: async () => {
      return logisticsPartnerService.getProviders({
        search: filter.search || undefined,
        verificationStatus: filter.verificationStatus || undefined,
        city: filter.city || undefined,
      })
    },
  })

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: (id: string) => logisticsPartnerService.verifyProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.logisticsPartners.all })
      drawerDisclosure.onClose()
      toast.success("Transporter partner verified and approved! Load posting access unlocked.")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to verify logistics partner")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      logisticsPartnerService.rejectProvider(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.logisticsPartners.all })
      rejectDisclosure.onClose()
      setRejectReason("")
      toast.success("Logistics partner application rejected")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject logistics partner")
    },
  })

  const handleFilterChange = useCallback(
    (updates: Record<string, any>) => {
      handleFilter(updates)
    },
    [handleFilter]
  )

  const handleVerify = (id: string) => {
    verifyMutation.mutate(id)
  }

  const handleOpenReject = (partner: LogisticsPartnerItem) => {
    setRejectReason("Business registration or GST documents could not be verified")
    rejectDisclosure.onOpen(partner)
  }

  const handleConfirmReject = () => {
    if (!rejectDisclosure.data) return
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejecting the application")
      return
    }
    rejectMutation.mutate({
      id: rejectDisclosure.data.id,
      reason: rejectReason.trim(),
    })
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = providers.length
    const pending = providers.filter((p) => p.verificationStatus === "PENDING").length
    const verified = providers.filter((p) => p.verificationStatus === "VERIFIED").length
    const rejected = providers.filter((p) => p.verificationStatus === "REJECTED").length
    return { total, pending, verified, rejected }
  }, [providers])

  // Table Columns
  const columns: Column<LogisticsPartnerItem>[] = useMemo(
    () => [
      {
        header: "Transporter / Firm",
        accessorKey: "businessName",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 font-bold shrink-0">
              <Truck className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                {row.businessName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {row.operatingHub}, {row.operatingCity}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "Contact Person",
        accessorKey: "contactPerson",
        cell: (row) => (
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100 text-xs">
              {row.contactPerson}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {row.phone}
            </p>
          </div>
        ),
      },
      {
        header: "Business Category",
        accessorKey: "businessType",
        cell: (row) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {row.businessType}
          </span>
        ),
      },
      {
        header: "GSTIN & Tax KYC",
        accessorKey: "gstin",
        cell: (row) => (
          <div className="space-y-0.5 text-xs">
            <div className="font-mono text-slate-900 dark:text-slate-100">
              {row.gstin !== "—" ? row.gstin : "No GSTIN"}
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              {row.isGstVerified ? (
                <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> GST Verified
                </span>
              ) : (
                <span className="text-slate-400">Unverified Tax</span>
              )}
            </div>
          </div>
        ),
      },
      {
        header: "Verification",
        accessorKey: "verificationStatus",
        cell: (row) => <StatusBadge status={row.verificationStatus} />,
      },
      {
        header: "Submitted",
        accessorKey: "createdAt",
        cell: (row) => (
          <span className="text-xs text-slate-500">
            {row.createdAt
              ? new Date(row.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
      },
      {
        header: "Actions",
        id: "actions",
        cell: (row) => (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1"
              onClick={() => drawerDisclosure.onOpen({ ...row, viewMode: true })}
            >
              <Eye className="h-3.5 w-3.5" />
              Review
            </Button>
            {row.verificationStatus === "PENDING" && (
              <>
                <Button
                  size="sm"
                  className="h-8 px-2 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleVerify(row.id)}
                  disabled={verifyMutation.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs gap-1 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
                  onClick={() => handleOpenReject(row)}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [drawerDisclosure, verifyMutation.isPending, rejectMutation.isPending]
  )

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Applicants</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {metrics.total}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Pending Admin Review
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-200">
            {metrics.pending}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Verified Partners
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-200">
            {metrics.verified}
          </p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
              Rejected Registrations
            </span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-900 dark:text-rose-200">
            {metrics.rejected}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <SectionCard
        title="Logistics Load Providers & Transporters"
        description="Audit transporter GSTIN, PAN, bank settlement accounts, and approve partner access to the load board"
      >
        <div className="space-y-4">
          <FilterBar
            values={{
              search: filter.search || "",
              verificationStatus: filter.verificationStatus || "",
              city: filter.city || "",
            }}
            onChange={handleFilterChange}
          >
            <FilterBar.Search
              name="search"
              placeholder="Search by transporter, contact, phone, or GSTIN..."
              className="w-[320px]"
            />
            <FilterBar.Select
              name="verificationStatus"
              placeholder="All Verification States"
              options={[
                { label: "All Verification States", value: "ALL" },
                { label: "Pending Review ⏳", value: "PENDING" },
                { label: "Verified & Active ✅", value: "VERIFIED" },
                { label: "Rejected ❌", value: "REJECTED" },
              ]}
              className="w-48"
            />
          </FilterBar>

          <DataTable
            columns={columns}
            data={providers}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>

      {/* Logistics Partner Review Drawer */}
      <LogisticsPartnerDrawer
        open={drawerDisclosure.isOpen}
        onClose={drawerDisclosure.onClose}
        partner={drawerDisclosure.data}
        onVerify={handleVerify}
        isVerifying={verifyMutation.isPending}
        onReject={handleOpenReject}
      />

      {/* Reject Reason Dialog */}
      <ConfirmDialog
        open={rejectDisclosure.isOpen}
        onOpenChange={(open) => !open && rejectDisclosure.onClose()}
        onConfirm={handleConfirmReject}
        title="Reject Logistics Partner Application"
        description={`Are you sure you want to reject the application for ${rejectDisclosure.data?.businessName}? This will mark their application as Rejected until updated documents are submitted.`}
        confirmText="Confirm Rejection"
        variant="danger"
        isLoading={rejectMutation.isPending}
      />
    </div>
  )
}

export default LogisticsPartnersPage
