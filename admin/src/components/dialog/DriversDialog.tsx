import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  UserCheck,
  Car,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import { FormField, FormSelectField } from "@/components/ui/form-fields"
import { StatusBadge } from "@/components/common/StatusBadge"
import { queryKeys } from "@/lib/queryKeys"
import {
  driverService,
  type CreateDriverPayload,
} from "@/services/driverService"
import { operatorService } from "@/services/operatorService"
import type { Driver } from "@/types/bus"
import sectionHeader from "@/components/sectionHeader"
import { DRIVER_FORM_INITIAL_DATA } from "@/constants/page/super-admin/drivers"

export interface DriverDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  driver?: (Driver & { viewMode?: boolean }) | null
  onVerify?: (id: string) => void
  onReject?: (driver: Driver) => void
  isVerifying?: boolean
}

export default function DriverDrawer({
  open,
  onClose,
  driver,
  onVerify,
  onReject,
  isVerifying,
}: DriverDrawerProps) {
  const isViewMode = !!driver?.viewMode
  const isEditMode = !!driver?.id
  const driverId = driver?.id

  const { handleSubmit, control, reset } = useForm<CreateDriverPayload>({
    defaultValues: DRIVER_FORM_INITIAL_DATA,
    mode: "onChange",
  })

  // Fetch operators list for dropdown
  const { data: operators = [] } = useQuery({
    queryKey: queryKeys.operators.all,
    queryFn: () => operatorService.getOperators(),
    enabled: open && !isViewMode,
  })

  const operatorOptions = operators.map((op) => ({
    label: `${op.name} (${op.code})`,
    value: op.id,
  }))

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          operatorId: driver?.operatorId ?? "",
          name: (driver?.user?.name || driver?.name) ?? "",
          phone: (driver?.user?.phone || driver?.phone) ?? "",
          licenseNumber: driver?.licenseNumber ?? "",
          experienceYears: driver?.experienceYears ?? 0,
          rating: driver?.rating ?? 5.0,
          status: (driver?.status &&
          ["ACTIVE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"].includes(driver.status)
            ? driver.status
            : "ACTIVE") as "ACTIVE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED",
        })
      } else {
        reset(DRIVER_FORM_INITIAL_DATA)
      }
    }
  }, [open, driver, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateDriverPayload) =>
      isEditMode && driverId
        ? driverService.updateDriver(driverId, data)
        : driverService.createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.drivers.all,
      })
      toast.success(
        isEditMode
          ? "Driver updated successfully"
          : "Driver created successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save driver")
    },
  })

  const onSubmit: SubmitHandler<CreateDriverPayload> = (data) => {
    const payload: CreateDriverPayload = {
      operatorId: data.operatorId,
      name: data.name,
      phone: data.phone,
      licenseNumber: data.licenseNumber,
      experienceYears: Number(data.experienceYears) || 0,
      rating: Number(data.rating) || 5.0,
      status: data.status,
      email: data.email || undefined,
      password: data.password || undefined,
    }
    mutation.mutate(payload)
  }

  // Primary vehicle details if registered
  const assignedVehicle = driver?.driverVehicles?.[0]?.vehicle

  return (
    <FormContainer
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => onClose(isOpen)}
      title={
        isViewMode
          ? "Driver Onboarding Verification & Details"
          : isEditMode
            ? "Edit Driver"
            : "Add Driver"
      }
      description={
        isViewMode
          ? "Review driver application data, verify driving license, and inspect vehicle documents"
          : isEditMode
            ? "Update driver details and operational status"
            : "Register a new driver with mobile app access"
      }
      size={isViewMode ? "xl" : "lg"}
      footer={
        <div className="flex w-full flex-col-reverse items-center justify-between gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
            disabled={mutation.isPending || isVerifying}
          >
            {isViewMode ? "Close" : "Cancel"}
          </Button>

          {isViewMode ? (
            <div className="flex items-center gap-2">
              {driver?.verificationStatus !== "VERIFIED" && onReject && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40"
                  onClick={() => {
                    onClose(false)
                    onReject(driver)
                  }}
                  disabled={isVerifying}
                >
                  <XCircle className="h-4 w-4" />
                  Reject Application
                </Button>
              )}
              {driver?.verificationStatus !== "VERIFIED" && onVerify && (
                <Button
                  type="button"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    onVerify(driver.id)
                    onClose(false)
                  }}
                  disabled={isVerifying}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isVerifying ? "Verifying..." : "Verify & Approve Driver"}
                </Button>
              )}
            </div>
          ) : (
            <Button
              type="submit"
              form="driver-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                  ? "Update Driver"
                  : "Save Driver"}
            </Button>
          )}
        </div>
      }
    >
      {isViewMode && driver ? (
        <div className="space-y-6 py-2">
          {/* Header Card */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 font-bold text-teal-600">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {driver.user?.name || driver.name || "Driver Partner"}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="h-3.5 w-3.5" />
                    {driver.user?.phone || driver.phone || "No phone registered"}
                  </span>
                  {driver.user?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {driver.user.email}
                    </span>
                  )}
                  {driver.user?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {driver.user.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <StatusBadge status={driver.verificationStatus || "PENDING"} />
              <StatusBadge status={driver.availabilityStatus || "OFFLINE"} />
            </div>
          </div>

          {/* Rejection Alert Box */}
          {(driver.verificationStatus === "REJECTED" || driver.rejectionReason) && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Application Rejection Reason (Provided by Admin)
                </p>
                <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                  {driver.rejectionReason || "Documents or details could not be verified by platform administrator."}
                </p>
              </div>
            </div>
          )}

          {/* Section 01: Driver & Contact Info */}
          <div>
            {sectionHeader("01", "Driver Profile & Contact Information")}
            <div className="mt-3 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">Full Name</span>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {driver.user?.name || driver.name || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">Phone Contact</span>
                <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {driver.user?.phone || driver.phone || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">Email Address</span>
                <p className="mt-1 truncate font-semibold text-slate-900 dark:text-slate-100">
                  {driver.user?.email || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">Driving Experience</span>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {driver.experienceYears ? `${driver.experienceYears} Years` : "Experienced"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:col-span-2">
                <span className="text-slate-500">Address / City</span>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {driver.user?.address
                    ? `${driver.user.address}, ${driver.user?.city || ""}`
                    : (driver.user?.city || "Registered Area")}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">Spoken Languages</span>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {Array.isArray(driver.languages) && driver.languages.length > 0
                    ? driver.languages.join(", ")
                    : "Hindi, English"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">Rating</span>
                <p className="mt-1 font-semibold text-amber-600">
                  ★ {driver.rating ?? "5.0"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 02: Driving License & KYC Verification */}
          <div>
            {sectionHeader("02", "Driving License & KYC Documents")}
            <div className="mt-3 grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">License Number (CDL)</span>
                <p className="mt-1 font-mono font-bold text-slate-900 dark:text-slate-100">
                  {driver.licenseNumber || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">License Type</span>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {driver.licenseType || "Commercial LMV Transport"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">License Expiry</span>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {driver.licenseExpiry || "Valid"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">DL Front Photo</span>
                <div className="mt-1 flex items-center gap-1.5">
                  {driver.dlFrontUploaded ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Uploaded & Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <AlertCircle className="h-4 w-4" /> Not Uploaded
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">DL Back Photo</span>
                <div className="mt-1 flex items-center gap-1.5">
                  {driver.dlBackUploaded ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Uploaded & Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <AlertCircle className="h-4 w-4" /> Not Uploaded
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">Aadhaar / ID Verification</span>
                <div className="mt-1 flex items-center gap-1.5">
                  {driver.aadhaarVerified ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <ShieldCheck className="h-4 w-4" /> Aadhaar Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                      Self-declared
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">Police Record Declaration</span>
                <div className="mt-1">
                  {driver.policeDeclarationAccepted ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Accepted & Clean
                    </span>
                  ) : (
                    <span className="text-slate-400">Pending</span>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-slate-500">Driver Code of Conduct</span>
                <div className="mt-1">
                  {driver.codeOfConductAccepted ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Accepted
                    </span>
                  ) : (
                    <span className="text-slate-400">Pending</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 03: Vehicle Details & Commercial Permits */}
          <div>
            {sectionHeader("03", "Registered Vehicle & Commercial Permits")}
            {assignedVehicle ? (
              <div className="mt-3 grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-slate-500">Vehicle Make & Model</span>
                  <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">
                    {assignedVehicle.make} {assignedVehicle.model}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-slate-500">Plate Number</span>
                  <p className="mt-1 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {assignedVehicle.registrationNumber || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-slate-500">Category</span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                    {assignedVehicle.vehicleCategory || "Sedan Prime"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-slate-500">Manufacturing Year</span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                    {assignedVehicle.manufacturingYear || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-slate-500">Fuel Type & Seats</span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                    {assignedVehicle.fuelType || "Petrol/CNG"} • {assignedVehicle.seatingCapacity || 4} Seater
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-slate-500">RC Number</span>
                  <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {assignedVehicle.rcNumber || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-slate-500">Insurance Policy</span>
                  <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {assignedVehicle.insurancePolicyNumber || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-slate-500">Commercial Permit</span>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                    {assignedVehicle.permitType || "All India Tourist Permit"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-slate-500">RC & Insurance Docs</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-semibold text-emerald-600">
                      {assignedVehicle.rcPhotoUploaded ? "RC ✓" : "RC ✗"}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-600">
                      {assignedVehicle.insuranceDocUploaded ? "Insurance ✓" : "Insurance ✗"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                <Car className="h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">No vehicle assigned yet</p>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                    Driver registered as independent applicant or waiting for vehicle fleet assignment.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form
          id="driver-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8"
        >
          {/* Section 01: Driver Information */}
          <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
            {sectionHeader("01", "Driver Information")}

            <div className="grid gap-6 sm:grid-cols-2">
              <FormSelectField
                control={control}
                name="operatorId"
                label="BUS OPERATOR"
                placeholder="Select bus operator..."
                options={operatorOptions}
                required
                disabled={isViewMode}
              />

              <FormField
                control={control}
                name="name"
                label="DRIVER NAME"
                placeholder="e.g. Rajesh Kumar"
                required
                readOnly={isViewMode}
              />

              <FormField
                control={control}
                name="phone"
                label="PHONE CONTACT"
                placeholder="e.g. +919876543211"
                required
                readOnly={isViewMode}
              />

              <FormField
                control={control}
                name="licenseNumber"
                label="LICENSE NUMBER (CDL)"
                placeholder="e.g. DL-1420110012345"
                required
                readOnly={isViewMode}
              />

              <FormField
                control={control}
                name="experienceYears"
                label="EXPERIENCE (YEARS)"
                placeholder="e.g. 10"
                type="number"
                readOnly={isViewMode}
              />

              <FormSelectField
                control={control}
                name="status"
                label="STATUS"
                options={[
                  { label: "Active", value: "ACTIVE" },
                  { label: "On Trip", value: "ON_TRIP" },
                  { label: "Off Duty", value: "OFF_DUTY" },
                  { label: "Suspended", value: "SUSPENDED" },
                ]}
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Section 02: Mobile App Login Credentials */}
          {!isEditMode && !isViewMode && (
            <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
              {sectionHeader("02", "Driver Mobile App Access (Optional)")}
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="email"
                  label="LOGIN EMAIL ADDRESS"
                  placeholder="email"
                />
                <FormField
                  control={control}
                  name="password"
                  label="LOGIN PASSWORD"
                  type="password"
                  placeholder="Default: Driver@123"
                />
              </div>
            </div>
          )}
        </form>
      )}
    </FormContainer>
  )
}
