import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import {
  FormField,
  FormSelectField,
  FormCheckboxField,
} from "@/components/ui/form-fields"
import sectionHeader from "@/components/sectionHeader"
import { queryKeys } from "@/lib/queryKeys"
import { logisticsService } from "@/services/logisticsService"
import type { Load, CreateLoadPayload } from "@/types/logistics"

export interface LoadDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  load?: (Load & { viewMode?: boolean }) | null
}

const PAYMENT_TERMS_OPTIONS = [
  { label: "To Pay (Full amount on unloading)", value: "To Pay" },
  { label: "Advance + Balance (Partial at loading)", value: "Advance + Balance" },
  { label: "Paid (Prepaid by shipper)", value: "Paid" },
]

const STATUS_OPTIONS = [
  { label: "Open (Available on Load Board)", value: "OPEN" },
  { label: "Assigned to Driver", value: "ASSIGNED" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
]

const INITIAL_DATA: CreateLoadPayload = {
  pickupCity: "Durgawati",
  pickupState: "Bihar",
  pickupAddress: "Durgawati Grain Mandi, NH-19",
  unloadingCity: "Bihta",
  unloadingState: "Bihar",
  unloadingAddress: "Bihta Logistics Park, Bihar",
  addressNote: "Address will be shared on call",
  distanceKm: 160,
  product: "Ata chokar",
  productCategory: "Agro / Grains",
  productLengthFt: 0,
  totalLoadTons: "29-30 ton",
  totalLoadNumber: 30,
  requiredTruckCategory: "Open",
  requiredTruckTypeDesc: "Open Half/Full Body",
  requiredWheels: "14 Wheeler",
  requiredMinLengthFt: 28,
  paymentTerms: "To Pay",
  ratePerTruck: 19000,
  isRateNegotiable: true,
  pricingNote: "Full amount will be paid to the driver at the unloading point",
  transporterName: "SKAND KUMAR",
  transporterCompany: "RAJASTHAN GUJARAT ROADWAYS",
  transporterPhone: "+91 94310 88291",
  transporterRating: 3.0,
  isTransporterVerified: true,
  status: "OPEN",
  instructions: "Standard tarp cover required.",
}

export default function LoadDrawer({ open, onClose, load }: LoadDrawerProps) {
  const isViewMode = !!load?.viewMode
  const isEditMode = !!load?.id
  const loadId = load?.id

  const queryClient = useQueryClient()

  const { handleSubmit, control, reset } = useForm<CreateLoadPayload>({
    defaultValues: INITIAL_DATA,
    mode: "onChange",
  })

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          pickupCity: load?.pickupCity ?? "",
          pickupState: load?.pickupState ?? "Bihar",
          pickupAddress: load?.pickupAddress ?? "",
          unloadingCity: load?.unloadingCity ?? "",
          unloadingState: load?.unloadingState ?? "Bihar",
          unloadingAddress: load?.unloadingAddress ?? "",
          addressNote: load?.addressNote ?? "Address will be shared on call",
          distanceKm: Number(load?.distanceKm ?? 160),
          product: load?.product ?? "",
          productCategory: load?.productCategory ?? "General",
          productLengthFt: Number(load?.productLengthFt ?? 0),
          totalLoadTons: load?.totalLoadTons ?? "29-30 ton",
          totalLoadNumber: Number(load?.totalLoadNumber ?? 30),
          truckTypeId: load?.truckTypeId ?? undefined,
          requiredTruckCategory: load?.requiredTruckCategory ?? "Open",
          requiredTruckTypeDesc: load?.requiredTruckTypeDesc ?? "Open Half/Full Body",
          requiredWheels: load?.requiredWheels ?? "14 Wheeler",
          requiredMinLengthFt: Number(load?.requiredMinLengthFt ?? 28),
          paymentTerms: load?.paymentTerms ?? "To Pay",
          ratePerTruck: Number(load?.ratePerTruck ?? 19000),
          isRateNegotiable: load?.isRateNegotiable ?? true,
          pricingNote: load?.pricingNote ?? "Full amount will be paid to the driver at the unloading point",
          transporterName: load?.transporterName ?? "",
          transporterCompany: load?.transporterCompany ?? "",
          transporterPhone: load?.transporterPhone ?? "",
          transporterRating: Number(load?.transporterRating ?? 3.0),
          isTransporterVerified: load?.isTransporterVerified ?? true,
          status: load?.status ?? "OPEN",
          instructions: load?.instructions ?? "",
        })
      } else {
        reset(INITIAL_DATA)
      }
    }
  }, [open, load, isEditMode, isViewMode, reset])

  const mutation = useMutation({
    mutationFn: (data: CreateLoadPayload) =>
      isEditMode && loadId
        ? logisticsService.updateLoad(loadId, data)
        : logisticsService.createLoad(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loads.all })
      toast.success(
        isEditMode ? "Cargo load updated successfully" : "Cargo load posted successfully"
      )
      onClose(false)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save cargo load")
    },
  })

  const onSubmit: SubmitHandler<CreateLoadPayload> = (formData) => {
    mutation.mutate({
      ...formData,
      distanceKm: Number(formData.distanceKm),
      totalLoadNumber: Number(formData.totalLoadNumber),
      ratePerTruck: Number(formData.ratePerTruck),
      requiredMinLengthFt: Number(formData.requiredMinLengthFt),
      productLengthFt: formData.productLengthFt ? Number(formData.productLengthFt) : 0,
      transporterRating: Number(formData.transporterRating || 3.0),
    })
  }

  return (
    <FormContainer
      open={open}
      onOpenChange={onClose}
      title={
        isViewMode
          ? `View Load: #${load?.loadNumber || ""}`
          : isEditMode
            ? `Edit Load: #${load?.loadNumber || ""}`
            : "Post New Freight Cargo Load"
      }
      description="Create or edit freight loads that appear on the driver Load Board in the user application."
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button type="button" variant="outline" onClick={() => onClose(false)}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button
              type="submit"
              form="load-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                  ? "Update Load"
                  : "Post Load to Board"}
            </Button>
          )}
        </div>
      }
    >
      <form id="load-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 01: Route */}
        <div>
          {sectionHeader("01", "Route & Locations")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
            <FormField
              control={control}
              name="pickupCity"
              label="Pickup City (Origin)"
              placeholder="e.g. Durgawati or Patna"
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="unloadingCity"
              label="Unloading City (Destination)"
              placeholder="e.g. Bihta or Hajipur"
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="pickupAddress"
              label="Pickup Address / Landmark"
              placeholder="e.g. Durgawati Grain Mandi, NH-19"
              readOnly={isViewMode}
            />
            <FormField
              control={control}
              name="unloadingAddress"
              label="Unloading Address / Facility"
              placeholder="e.g. Bihta Logistics Park"
              readOnly={isViewMode}
            />
            <FormField
              control={control}
              name="distanceKm"
              label="Distance (km)"
              type="number"
              placeholder="160"
              readOnly={isViewMode}
            />
            <FormField
              control={control}
              name="addressNote"
              label="Privacy / Address Note"
              placeholder="e.g. Address will be shared on call"
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Section 02: Goods & Cargo Specifications */}
        <div>
          {sectionHeader("02", "Cargo & Vehicle Requirements")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
            <FormField
              control={control}
              name="product"
              label="Product / Material Description"
              placeholder="e.g. Ata chokar, TMT 40ft Iron Rods"
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="productCategory"
              label="Product Category"
              placeholder="e.g. Agro / Grains, Iron & Steel"
              readOnly={isViewMode}
            />
            <FormField
              control={control}
              name="totalLoadTons"
              label="Total Weight (Tonnage)"
              placeholder="e.g. 29-30 ton"
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="productLengthFt"
              label="Cargo Length in Feet (e.g. 40ft rods)"
              type="number"
              placeholder="0 (Standard) or 40"
              readOnly={isViewMode}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-3">
            <FormField
              control={control}
              name="requiredTruckCategory"
              label="Truck Category"
              placeholder="Open, Trailer, Container"
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="requiredWheels"
              label="Wheels Required"
              placeholder="e.g. 14 Wheeler"
              readOnly={isViewMode}
            />
            <FormField
              control={control}
              name="requiredMinLengthFt"
              label="Min Bed Length (ft)"
              type="number"
              placeholder="28"
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Section 03: Rates & Payment */}
        <div>
          {sectionHeader("03", "Pricing, Payment Terms & Transporter")}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-3">
            <FormField
              control={control}
              name="ratePerTruck"
              label="Rate (₹ per truck)"
              type="number"
              placeholder="19000"
              readOnly={isViewMode}
              required
            />
            <FormSelectField
              control={control}
              name="paymentTerms"
              label="Payment Terms"
              options={PAYMENT_TERMS_OPTIONS}
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="transporterCompany"
              label="Transporter / Company Name"
              placeholder="e.g. RAJASTHAN GUJARAT ROADWAYS"
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="transporterName"
              label="Contact Person Name"
              placeholder="e.g. SKAND KUMAR"
              readOnly={isViewMode}
              required
            />
            <FormField
              control={control}
              name="transporterPhone"
              label="Transporter Phone Number (Calls)"
              placeholder="+91 94310 88291"
              readOnly={isViewMode}
              required
            />
            <FormSelectField
              control={control}
              name="status"
              label="Load Status"
              options={STATUS_OPTIONS}
              readOnly={isViewMode}
            />
          </div>

          <div className="mt-4">
            <FormField
              control={control}
              name="pricingNote"
              label="Payment Explanation Note"
              placeholder="e.g. Full amount will be paid to the driver at the unloading point"
              readOnly={isViewMode}
            />
          </div>

          <div className="mt-4 flex gap-6">
            <FormCheckboxField
              control={control}
              name="isRateNegotiable"
              label="Rate is Negotiable (Driver can submit bids)"
              readOnly={isViewMode}
            />
            <FormCheckboxField
              control={control}
              name="isTransporterVerified"
              label="Transporter Verified Badge"
              readOnly={isViewMode}
            />
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
