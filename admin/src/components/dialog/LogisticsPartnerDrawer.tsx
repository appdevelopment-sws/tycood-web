import { CheckCircle2, XCircle, Truck, AlertCircle } from "lucide-react"
import { FormContainer } from "@/components/formContainer"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/StatusBadge"
import sectionHeader from "@/components/sectionHeader"
import type { LogisticsPartnerItem } from "@/services/logisticsPartnerService"

export interface LogisticsPartnerDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  partner?: (LogisticsPartnerItem & { viewMode?: boolean }) | null
  onVerify?: (id: string) => void
  isVerifying?: boolean
  onReject?: (partner: LogisticsPartnerItem) => void
}

export const LogisticsPartnerDrawer: React.FC<LogisticsPartnerDrawerProps> = ({
  open,
  onClose,
  partner,
  onVerify,
  isVerifying,
  onReject,
}) => {
  if (!partner) return null

  return (
    <FormContainer
      open={open}
      onOpenChange={onClose}
      title={partner.businessName || "Transporter Profile"}
      description="Freight Logistics Load Provider KYC, transport business credentials, and verification review"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="outline" onClick={() => onClose(false)}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            {partner.verificationStatus !== "REJECTED" && onReject && (
              <Button
                variant="outline"
                className="gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 text-xs"
                onClick={() => onReject(partner)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject Application
              </Button>
            )}
            {partner.verificationStatus !== "VERIFIED" && onVerify && (
              <Button
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={() => onVerify(partner.id)}
                disabled={isVerifying}
              >
                <CheckCircle2 className="h-4 w-4" />
                Verify & Approve Transporter
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6 py-2">
        {/* Verification Status Header */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 font-bold">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {partner.businessName}
              </h4>
              <p className="text-xs text-slate-500">
                Contact: {partner.contactPerson} • {partner.phone}
              </p>
            </div>
          </div>
          <StatusBadge status={partner.verificationStatus} />
        </div>

        {/* Rejection Notice if rejected */}
        {partner.rejectionReason && (
          <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-4 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                Rejection Reason (Admin Review)
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                {partner.rejectionReason}
              </p>
            </div>
          </div>
        )}

        {/* 01. Transporter & Business Profile */}
        <div className="space-y-3">
          {sectionHeader("01", "Transporter & Business Info")}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500">Business / Firm Name</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{partner.businessName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Business Category</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{partner.businessType}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Operating City</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{partner.operatingCity}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Logistics Hub / Mandi</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{partner.operatingHub}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Official Phone</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{partner.phone}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Official Email</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{partner.email || "—"}</p>
            </div>
          </div>
        </div>

        {/* 02. Cargo & Fleet Categories */}
        <div className="space-y-3">
          {sectionHeader("02", "Cargo & Vehicle Categories")}
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block mb-1.5">Primary Cargo Dispatched</span>
              <div className="flex flex-wrap gap-1.5">
                {partner.primaryCargoTypes.length > 0 ? (
                  partner.primaryCargoTypes.map((cargo, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {cargo}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">General Cargo</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-slate-500 block mb-1.5">Required Truck / Vehicle Types</span>
              <div className="flex flex-wrap gap-1.5">
                {partner.requiredVehicleCategories.length > 0 ? (
                  partner.requiredVehicleCategories.map((veh, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    >
                      {veh}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">All Truck Types</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 03. KYC & Regulatory Verification */}
        <div className="space-y-3">
          {sectionHeader("03", "KYC & Regulatory Compliance")}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500">GSTIN Number</span>
              <p className="font-medium font-mono text-slate-900 dark:text-slate-100">
                {partner.gstin || "—"}
              </p>
              {partner.isGstVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> GST Portal Verified
                </span>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Business PAN</span>
              <p className="font-medium font-mono text-slate-900 dark:text-slate-100">
                {partner.pan || "—"}
              </p>
              {partner.isAadhaarVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Aadhaar OTP Verified
                </span>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Transporter ID Proof</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {partner.idProofUploaded ? (
                  <span className="text-emerald-600 font-medium">Document Uploaded ✅</span>
                ) : (
                  <span className="text-slate-400">Pending</span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Business Tax / Mandi Proof</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {partner.businessProofUploaded ? (
                  <span className="text-emerald-600 font-medium">Document Uploaded ✅</span>
                ) : (
                  <span className="text-slate-400">Pending</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 04. Commercial Banking & Payout */}
        <div className="space-y-3">
          {sectionHeader("04", "Commercial Banking & Freight Settlement")}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500">Account Holder</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {partner.accountHolder || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Bank Name</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {partner.bankName || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Account Number</span>
              <p className="font-medium font-mono text-slate-900 dark:text-slate-100">
                {partner.accountNumber || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">IFSC Code</span>
              <p className="font-medium font-mono text-slate-900 dark:text-slate-100">
                {partner.ifscCode || "—"}
              </p>
            </div>
            <div className="col-span-2 space-y-1">
              <span className="text-slate-500">UPI Settlement ID</span>
              <p className="font-medium font-mono text-slate-900 dark:text-slate-100">
                {partner.upiId || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </FormContainer>
  )
}

export default LogisticsPartnerDrawer
