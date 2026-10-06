import React from "react"
import { CheckCircle2, SquareParking } from "lucide-react"
import { FormContainer } from "@/components/formContainer"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/StatusBadge"
import sectionHeader from "@/components/sectionHeader"
import type { ParkingOperatorItem } from "@/services/parkingAdminService"

export interface ParkingDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  operator?: (ParkingOperatorItem & { viewMode?: boolean }) | null
  onVerify?: (id: string) => void
  isVerifying?: boolean
}

export const ParkingDrawer: React.FC<ParkingDrawerProps> = ({
  open,
  onClose,
  operator,
  onVerify,
  isVerifying,
}) => {
  if (!operator) return null

  const firstLocation = operator.locations && operator.locations.length > 0 ? operator.locations[0] : null

  return (
    <FormContainer
      open={open}
      onOpenChange={onClose}
      title={operator.facilityName || "Parking Operator Details"}
      description="Commercial parking facility specifications, bays, and rates"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="outline" onClick={() => onClose(false)}>
            Close
          </Button>
          {operator.verificationStatus !== "VERIFIED" && onVerify && (
            <Button
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onVerify(operator.id)}
              disabled={isVerifying}
            >
              <CheckCircle2 className="h-4 w-4" />
              Verify & Approve Operator
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6 py-2">
        {/* Verification Status Header */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 font-bold">
              <SquareParking className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {operator.facilityName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Owned by {operator.ownerName} • {operator.businessPhone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={operator.verificationStatus} />
          </div>
        </div>

        {/* Section 1: Business & Owner Details */}
        <div>
          {sectionHeader("01", "Business & Ownership Information")}
          <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Business Type</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {operator.businessType}
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">GSTIN / Tax ID</span>
              <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-slate-100">
                {operator.gstin}
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Contact Phone</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {operator.businessPhone}
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Email Address</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {operator.businessEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Facility Location & Capacity */}
        {firstLocation && (
          <div>
            {sectionHeader("02", "Facility Location & Bay Capacity")}
            <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2 rounded-lg border p-3 border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Address & Landmark</span>
                <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                  {firstLocation.address}, {firstLocation.city} {firstLocation.pincode ? `(${firstLocation.pincode})` : ""}
                </p>
                {firstLocation.landmark && (
                  <p className="text-[11px] text-slate-500 mt-0.5">Near: {firstLocation.landmark}</p>
                )}
              </div>
              <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Car Bays</span>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {firstLocation.carSlotsTotal ?? "—"} slots (₹{firstLocation.carHourlyRate || 30}/hr)
                </p>
              </div>
              <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Two-Wheeler Bays</span>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {firstLocation.bikeSlotsTotal ?? "—"} slots (₹{firstLocation.bikeHourlyRate || 15}/hr)
                </p>
              </div>
              <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">EV Charging Points</span>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {firstLocation.evChargingPoints ?? 0} Fast Chargers
                </p>
              </div>
              <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Operating Hours</span>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {firstLocation.operatingHours || "24x7 Open"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Payout Banking */}
        <div>
          {sectionHeader("03", "Payout Settlement Account")}
          <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Account Holder</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {operator.accountHolder || operator.ownerName || "—"}
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Bank Name</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {operator.bankName || "—"}
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Account Number</span>
              <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-slate-100">
                {operator.accountNumber || "—"}
              </p>
            </div>
            <div className="rounded-lg border p-3 border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">IFSC Code</span>
              <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-slate-100">
                {operator.ifscCode || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </FormContainer>
  )
}

export default ParkingDrawer
