import React from "react"
import { CheckCircle2, Wrench } from "lucide-react"
import { FormContainer } from "@/components/formContainer"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/StatusBadge"
import sectionHeader from "@/components/sectionHeader"
import type { Technician } from "@/services/technicianService"

export interface TechnicianDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  technician?: (Technician & { viewMode?: boolean }) | null
  onVerify?: (id: string) => void
  isVerifying?: boolean
}

export const TechnicianDrawer: React.FC<TechnicianDrawerProps> = ({
  open,
  onClose,
  technician,
  onVerify,
  isVerifying,
}) => {
  if (!technician) return null

  return (
    <FormContainer
      open={open}
      onOpenChange={onClose}
      title={technician.workshopName || "Technician Profile"}
      description="Roadside mechanical assistance & diagnostic technician details"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="outline" onClick={() => onClose(false)}>
            Close
          </Button>
          {technician.verificationStatus !== "VERIFIED" && onVerify && (
            <Button
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onVerify(technician.id)}
              disabled={isVerifying}
            >
              <CheckCircle2 className="h-4 w-4" />
              Verify & Approve Technician
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6 py-2">
        {/* Verification Status Header */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 font-bold">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {technician.user?.name || "Technician"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {technician.user?.phone || "No phone registered"} • {technician.user?.email || "No email"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={technician.verificationStatus} />
          </div>
        </div>

        {/* Section 1: Workshop & Service Zone */}
        <div>
          {sectionHeader("01", "Workshop & Service Coverage")}
          <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Workshop Name</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {technician.workshopName || "—"}
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Experience</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {technician.experienceYears}
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Base Coverage Area</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {technician.baseArea} ({technician.serviceRadiusKm} km radius)
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Vehicle / Transport</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {technician.vehicleType}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Specializations & Equipment */}
        <div>
          {sectionHeader("02", "Specializations & Tools")}
          <div className="mt-3 space-y-3">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Skills & Services:</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {technician.specializations.length > 0 ? (
                  technician.specializations.map((spec, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
                    >
                      {spec}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No specializations listed</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tools Available:</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {technician.toolsAvailable && technician.toolsAvailable.length > 0 ? (
                  technician.toolsAvailable.map((tool, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {tool}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Standard Emergency Kit</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Bank & Settlement Information */}
        <div>
          {sectionHeader("03", "Payout & Banking Details")}
          <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Account Holder</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {technician.accountHolder || technician.user?.name || "—"}
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Bank Name</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {technician.bankName || "—"}
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Account Number</span>
              <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-slate-100">
                {technician.accountNumber || "—"}
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">IFSC / UPI</span>
              <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-slate-100">
                {technician.ifscCode || technician.upiId || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </FormContainer>
  )
}

export default TechnicianDrawer
