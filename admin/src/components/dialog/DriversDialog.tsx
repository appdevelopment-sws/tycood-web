import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import {
  FormField,
  FormSelectField,
} from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import { driverService, type CreateDriverPayload } from "@/services/driverService"
import { operatorService } from "@/services/operatorService"
import type { Driver } from "@/types/bus"
import sectionHeader from "@/components/sectionHeader"
import { DRIVER_FORM_INITIAL_DATA } from "@/constants/page/super-admin/drivers"

export interface DriverDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  driver?: (Driver & { viewMode?: boolean }) | null
}

export default function DriverDrawer({
  open,
  onClose,
  driver,
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
    enabled: open,
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
          name: driver?.name ?? "",
          phone: driver?.phone ?? "",
          licenseNumber: driver?.licenseNumber ?? "",
          experienceYears: driver?.experienceYears ?? 0,
          rating: driver?.rating ?? 5.0,
          status: (driver?.status && ["ACTIVE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"].includes(driver.status)
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

  return (
    <FormContainer
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => onClose(isOpen)}
      title={
        isViewMode
          ? "View Driver Details"
          : isEditMode
          ? "Edit Bus Driver"
          : "Add Bus Driver"
      }
      description={
        isViewMode
          ? "Viewing verified Commercial Driver License (CDL) details."
          : isEditMode
          ? "Update bus driver details and status."
          : "Register a new certified bus driver with app access."
      }
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
            disabled={mutation.isPending}
          >
            {isViewMode ? "Close" : "Cancel"}
          </Button>

          {!isViewMode && (
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
    </FormContainer>
  )
}
