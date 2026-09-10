import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import { FormField, FormSelectField } from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import { busService, type CreateBusPayload } from "@/services/busService"
import { operatorService } from "@/services/operatorService"
import type { Bus } from "@/types/bus"
import sectionHeader from "@/components/sectionHeader"

import {
  BUS_FORM_INITIAL_DATA,
  BUS_TYPE_OPTIONS,
  BUS_CATEGORY_OPTIONS,
  BUS_STATUS_OPTIONS,
  LAYOUT_TYPE_OPTIONS,
} from "@/constants/page/super-admin/buses"

export interface BusDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  bus?: (Bus & { viewMode?: boolean }) | null
}

export default function BusDrawer({ open, onClose, bus }: BusDrawerProps) {
  const isViewMode = !!bus?.viewMode
  const isEditMode = !!bus?.id
  const busId = bus?.id

  // Fetch operators for selection
  const { data: operators = [] } = useQuery({
    queryKey: queryKeys.operators.all,
    queryFn: () => operatorService.getOperators(),
    enabled: open,
  })

  const operatorOptions = [
    { label: "Select Operator...", value: "" },
    ...operators.map((op) => ({
      label: `${op.name} (${op.code})`,
      value: op.id,
    })),
  ]

  const { handleSubmit, control, reset } = useForm<CreateBusPayload>({
    defaultValues: BUS_FORM_INITIAL_DATA,
    mode: "onChange",
  })

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          registrationNumber: bus?.registrationNumber ?? "",
          internalCode: bus?.internalCode ?? "",
          busName: bus?.busName ?? "",
          busType: bus?.busType ?? "SEATER",
          category: bus?.category ?? "STANDARD",
          manufacturer: bus?.manufacturer ?? "",
          model: bus?.model ?? "",
          manufacturingYear: bus?.manufacturingYear ?? new Date().getFullYear(),
          seatingCapacity: bus?.seatingCapacity ?? 36,
          layoutType: bus?.layoutType ?? "2x2",
          isAC: bus?.isAC ?? true,
          status: bus?.status ?? "ACTIVE",
          operatorId: bus?.operatorId ?? bus?.operator?.id ?? "",
        })
      } else {
        reset(BUS_FORM_INITIAL_DATA)
      }
    }
  }, [open, bus, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateBusPayload) =>
      isEditMode && busId
        ? busService.updateBus(busId, data)
        : busService.createBus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.buses.all,
      })
      toast.success(
        isEditMode
          ? "Bus updated successfully"
          : "Bus registered successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save bus details")
    },
  })

  const onSubmit: SubmitHandler<CreateBusPayload> = (data) => {
    const payload: CreateBusPayload = {
      registrationNumber: data.registrationNumber,
      internalCode: data.internalCode || undefined,
      busName: data.busName,
      busType: data.busType,
      category: data.category,
      manufacturer: data.manufacturer || undefined,
      model: data.model || undefined,
      manufacturingYear: data.manufacturingYear ? Number(data.manufacturingYear) : undefined,
      seatingCapacity: data.seatingCapacity ? Number(data.seatingCapacity) : 36,
      layoutType: data.layoutType,
      isAC: String(data.isAC) === "true" || data.isAC === true,
      status: data.status,
      operatorId: data.operatorId || undefined,
    }
    mutation.mutate(payload)
  }

  return (
    <FormContainer
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => onClose(isOpen)}
      title={
        isViewMode ? "View Bus Vehicle" : isEditMode ? "Edit Bus Vehicle" : "Add Bus Vehicle"
      }
      description={
        isViewMode
          ? "Viewing vehicle details, layout configuration, and assigned operator."
          : isEditMode
          ? "Update vehicle specifications, status, or operator assignment."
          : "Register a new vehicle into the fleet database."
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
              form="bus-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update Bus"
                : "Save Bus"}
            </Button>
          )}
        </div>
      }
    >
      <form id="bus-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 01: Vehicle & Operator Info */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("01", "Vehicle & Operator Information")}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={control}
              name="registrationNumber"
              label="REGISTRATION NUMBER"
              placeholder="e.g. DL-01-AB-1234"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="internalCode"
              label="INTERNAL FLEET CODE"
              placeholder="e.g. BUS-001"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="busName"
              label="BUS NAME / TITLE"
              placeholder="e.g. Volvo B11R Multi-Axle"
              required
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="operatorId"
              label="ASSIGNED OPERATOR"
              options={operatorOptions}
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="busType"
              label="BUS TYPE"
              options={BUS_TYPE_OPTIONS}
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="category"
              label="CATEGORY"
              options={BUS_CATEGORY_OPTIONS}
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="status"
              label="STATUS"
              options={BUS_STATUS_OPTIONS}
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="isAC"
              label="AIR CONDITIONING (AC)"
              options={[
                { label: "AC (Air Conditioned)", value: "true" },
                { label: "Non-AC (Regular)", value: "false" },
              ]}
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Section 02: Specifications & Seat Layout */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("02", "Specifications & Seat Configuration")}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={control}
              name="manufacturer"
              label="MANUFACTURER"
              placeholder="e.g. Volvo, Scania, Mercedes"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="model"
              label="MODEL NAME"
              placeholder="e.g. B11R, Metrolink HD"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="manufacturingYear"
              label="MANUFACTURING YEAR"
              type="number"
              placeholder="e.g. 2023"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="seatingCapacity"
              label="SEATING CAPACITY"
              type="number"
              placeholder="e.g. 36"
              readOnly={isViewMode}
            />

            <div className="sm:col-span-2">
              <FormSelectField
                control={control}
                name="layoutType"
                label="SEAT LAYOUT PATTERN"
                options={LAYOUT_TYPE_OPTIONS}
                readOnly={isViewMode}
              />
            </div>
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
