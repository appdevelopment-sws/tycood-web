import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import {
  FormField,
  FormSelectField,
  FormCheckboxField,
} from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import { voucherService } from "@/services/voucherService"
import { tripService } from "@/services/tripService"
import type { Voucher, CreateVoucherPayload } from "@/types/voucher"
import sectionHeader from "@/components/sectionHeader"
import { VOUCHER_FORM_INITIAL_DATA } from "@/constants/page/super-admin/vouchers"

export interface VoucherDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  voucher?: (Voucher & { viewMode?: boolean }) | null
}

const formatDateForInput = (dateStr?: string) => {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ""
    return d.toISOString().split("T")[0]
  } catch {
    return ""
  }
}

export default function VoucherDrawer({
  open,
  onClose,
  voucher,
}: VoucherDrawerProps) {
  const isViewMode = !!voucher?.viewMode
  const isEditMode = !!voucher?.id
  const voucherId = voucher?.id

  const { data: tripsResponse } = useQuery({
    queryKey: queryKeys.trips.all,
    queryFn: () => tripService.getTrips(),
  })
  const tripsList = Array.isArray(tripsResponse) ? tripsResponse : (tripsResponse?.data || [])

  const { handleSubmit, control, reset } = useForm<CreateVoucherPayload>({
    defaultValues: VOUCHER_FORM_INITIAL_DATA,
    mode: "onChange",
  })

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          code: voucher?.code ?? "",
          title: voucher?.title ?? "",
          description: voucher?.description ?? "",
          discountType: voucher?.discountType ?? "FIXED",
          discountValue: voucher?.discountValue ?? 0,
          minBookingAmount: voucher?.minBookingAmount ?? 0,
          maxDiscountAmount: voucher?.maxDiscountAmount,
          validFrom: formatDateForInput(voucher?.validFrom),
          validUntil: formatDateForInput(voucher?.validUntil),
          usageLimit: voucher?.usageLimit,
          perUserLimit: voucher?.perUserLimit ?? 1,
          tripId: voucher?.tripId ?? "",
          isVisible: voucher?.isVisible ?? true,
          isActive: voucher?.isActive ?? true,
        })
      } else {
        reset(VOUCHER_FORM_INITIAL_DATA)
      }
    }
  }, [open, voucher, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateVoucherPayload) =>
      isEditMode && voucherId
        ? voucherService.updateVoucher(voucherId, data)
        : voucherService.createVoucher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.vouchers.all,
      })
      toast.success(
        isEditMode
          ? "Voucher updated successfully"
          : "Voucher created successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save voucher")
    },
  })

  const onSubmit: SubmitHandler<CreateVoucherPayload> = (data) => {
    const payload: CreateVoucherPayload = {
      code: data.code.toUpperCase().trim(),
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minBookingAmount: data.minBookingAmount ? Number(data.minBookingAmount) : 0,
      maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined,
      validFrom: data.validFrom ? new Date(data.validFrom).toISOString() : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
      perUserLimit: data.perUserLimit ? Number(data.perUserLimit) : 1,
      tripId: data.tripId || undefined,
      isVisible: !!data.isVisible,
      isActive: !!data.isActive,
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
          ? "View Voucher"
          : isEditMode
          ? "Edit Voucher"
          : "Add New Voucher"
      }
      description={
        isViewMode
          ? "Viewing coupon and promotional discount voucher configuration."
          : isEditMode
          ? "Update promotion rules and visibility status."
          : "Create a promotional code with custom discount and visibility rules."
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
              form="voucher-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update Voucher"
                : "Save Voucher"}
            </Button>
          )}
        </div>
      }
    >
      <form
        id="voucher-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* Section 01: Voucher Identity & Discount */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("01", "Voucher Identity & Discount Configuration")}

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={control}
              name="code"
              label="VOUCHER CODE"
              placeholder="e.g. WELCOME100"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="title"
              label="VOUCHER TITLE"
              placeholder="e.g. Flat ₹100 Off on First Booking"
              required
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="discountType"
              label="DISCOUNT TYPE"
              options={[
                { label: "Fixed Amount (₹)", value: "FIXED" },
                { label: "Percentage (%)", value: "PERCENTAGE" },
              ]}
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="discountValue"
              label="DISCOUNT VALUE"
              placeholder="e.g. 100 or 15"
              type="number"
              step="0.01"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="minBookingAmount"
              label="MIN BOOKING AMOUNT (₹)"
              placeholder="e.g. 500"
              type="number"
              step="0.01"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="maxDiscountAmount"
              label="MAX DISCOUNT CAP (₹) (FOR % TYPE)"
              placeholder="e.g. 200 (Optional)"
              type="number"
              step="0.01"
              readOnly={isViewMode}
            />

            <div className="sm:col-span-2">
              <FormField
                control={control}
                name="description"
                label="TERMS & DESCRIPTION"
                placeholder="Enter offer description and terms..."
                rows={2}
                readOnly={isViewMode}
              />
            </div>
          </div>
        </div>

        {/* Section 02: Limits & App Visibility */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("02", "Limits, Trip Assignment & Visibility Settings")}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormSelectField
                control={control}
                name="tripId"
                label="APPLICABLE TRIP / ROUTE SCOPE"
                options={[
                  { label: "All Trips (Universal Voucher - Valid on Any Bus Route)", value: "" },
                  ...tripsList.map((t: any) => ({
                    label: `Trip ${t.tripCode || t.id.slice(0, 8)}: ${t.route?.origin || 'Departure'} → ${t.route?.destination || 'Arrival'} (${t.bus?.name || 'Bus'})`,
                    value: t.id,
                  })),
                ]}
                readOnly={isViewMode}
              />
            </div>

            <FormField
              control={control}
              name="validFrom"
              label="VALID FROM DATE"
              type="date"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="validUntil"
              label="EXPIRY DATE (VALID UNTIL)"
              type="date"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="usageLimit"
              label="TOTAL USAGE LIMIT"
              placeholder="e.g. 1000 total redemptions"
              type="number"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="perUserLimit"
              label="PER USER LIMIT"
              placeholder="e.g. 1 redemption per user"
              type="number"
              readOnly={isViewMode}
            />

            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2 pt-2">
              <FormCheckboxField
                control={control}
                name="isVisible"
                label="Show Voucher in Mobile App"
                description="When checked, this voucher will be displayed in the user app vouchers list and checkout modal."
                readOnly={isViewMode}
              />

              <FormCheckboxField
                control={control}
                name="isActive"
                label="Active Status"
                description="Controls whether this voucher code can be redeemed during checkout."
                readOnly={isViewMode}
              />
            </div>
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
