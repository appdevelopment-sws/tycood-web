import { useEffect, useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Star, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import {
  FormField,
  FormSelectField,
  FormCheckboxField,
} from "@/components/ui/form-fields"
import sectionHeader from "@/components/sectionHeader"
import { queryKeys } from "@/lib/queryKeys"
import { cabService } from "@/services/cabService"
import type { CabVehicle, CreateCabPayload } from "@/types/cab"
import {
  CAB_FORM_INITIAL_DATA,
  CAB_CATEGORY_OPTIONS,
  CAB_STATUS_OPTIONS,
  CAB_FUEL_OPTIONS,
  BADGE_TAG_OPTIONS,
} from "@/constants/page/super-admin/cabs"

export interface CabDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  cab?: (CabVehicle & { viewMode?: boolean }) | null
}

export default function CabDrawer({ open, onClose, cab }: CabDrawerProps) {
  const isViewMode = !!cab?.viewMode
  const isEditMode = !!cab?.id
  const cabId = cab?.id

  const [featuresList, setFeaturesList] = useState<string[]>([
    "Compact & Fast",
    "AC Included",
    "Best City Commute",
    "Instant Dispatch",
  ])
  const [featureInput, setFeatureInput] = useState("")

  const { handleSubmit, control, reset, watch, setValue } = useForm<CreateCabPayload>({
    defaultValues: CAB_FORM_INITIAL_DATA,
    mode: "onChange",
  })

  // Watch form fields to display live real-time card preview
  const watchedValues = watch()

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        const initialFeatures =
          Array.isArray(cab?.features) && cab!.features.length > 0
            ? cab!.features
            : ["Compact & Fast", "AC Included", "Best City Commute", "Instant Dispatch"]

        setFeaturesList(initialFeatures)

        reset({
          make: cab?.make ?? "Maruti Suzuki",
          model: cab?.model ?? "WagonR ZXI",
          registrationNumber: cab?.registrationNumber ?? "",
          vehicleCategory: cab?.vehicleCategory ?? "Hatchback",
          color: cab?.color ?? "Silky Silver",
          manufacturingYear: cab?.manufacturingYear ?? "2023",
          fuelType: cab?.fuelType ?? "CNG + Petrol",
          seatingCapacity: cab?.seatingCapacity ?? 4,
          luggageCapacity: cab?.luggageCapacity ?? 1,
          rcNumber: cab?.rcNumber ?? "",
          insurancePolicyNumber: cab?.insurancePolicyNumber ?? "",
          permitType: cab?.permitType ?? "All India Tourist Permit",

          // Pricing
          baseFare: cab?.baseFare ?? 699,
          baseKm: cab?.baseKm ?? 10,
          perKmCharge: cab?.perKmCharge ?? 12,
          extraKmCharge: cab?.extraKmCharge ?? 15,
          roundoffCostPerKm: cab?.roundoffCostPerKm ?? 11,
          outstationBaseCharge: cab?.outstationBaseCharge ?? 2299,
          outstationPerKmCharge: cab?.outstationPerKmCharge ?? 13.5,
          originalFare: cab?.originalFare ?? 839,

          // Card Presentation
          badgeTag: cab?.badgeTag ?? "FASTEST",
          rating: cab?.rating ?? 4.8,
          reviewsCount: cab?.reviewsCount ?? 412,
          etaMinutes: cab?.etaMinutes ?? 6,
          imageUrl: cab?.imageUrl ?? "assets/car.png",
          features: initialFeatures,

          hasAc: cab?.hasAc ?? true,
          tollIncluded: cab?.tollIncluded ?? true,
          freeCancellation: cab?.freeCancellation ?? true,
          isInstant: cab?.isInstant ?? true,
          status: cab?.status ?? "ACTIVE",
        })
      } else {
        const defaultFeats = [
          "Compact & Fast",
          "AC Included",
          "Best City Commute",
          "Instant Dispatch",
        ]
        setFeaturesList(defaultFeats)
        reset({ ...CAB_FORM_INITIAL_DATA, features: defaultFeats })
      }
    }
  }, [open, cab, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateCabPayload) =>
      isEditMode && cabId
        ? cabService.updateCab(cabId, data)
        : cabService.createCab(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cabs.all })
      toast.success(
        isEditMode
          ? "Cab vehicle & pricing updated successfully"
          : "New cab vehicle registered successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save cab details")
    },
  })

  const addFeature = () => {
    const trimmed = featureInput.trim()
    if (trimmed && !featuresList.includes(trimmed)) {
      const updated = [...featuresList, trimmed]
      setFeaturesList(updated)
      setValue("features", updated)
      setFeatureInput("")
    }
  }

  const removeFeature = (indexToRemove: number) => {
    if (isViewMode) return
    const updated = featuresList.filter((_, i) => i !== indexToRemove)
    setFeaturesList(updated)
    setValue("features", updated)
  }

  const onSubmit: SubmitHandler<CreateCabPayload> = (data) => {
    const payload: CreateCabPayload = {
      make: data.make,
      model: data.model,
      registrationNumber: data.registrationNumber.toUpperCase(),
      vehicleCategory: data.vehicleCategory,
      color: data.color || undefined,
      manufacturingYear: data.manufacturingYear || undefined,
      fuelType: data.fuelType,
      seatingCapacity: Number(data.seatingCapacity) || 4,
      luggageCapacity: Number(data.luggageCapacity) || 1,
      rcNumber: data.rcNumber || undefined,
      insurancePolicyNumber: data.insurancePolicyNumber || undefined,
      permitType: data.permitType || undefined,

      // Pricing Engine
      baseFare: Number(data.baseFare) || 0,
      baseKm: Number(data.baseKm) || 10,
      perKmCharge: Number(data.perKmCharge) || 0,
      extraKmCharge: Number(data.extraKmCharge) || 0,
      roundoffCostPerKm: Number(data.roundoffCostPerKm) || 0,
      outstationBaseCharge: Number(data.outstationBaseCharge) || 0,
      outstationPerKmCharge: Number(data.outstationPerKmCharge) || 0,
      originalFare: Number(data.originalFare) || 0,

      // Card Presentation
      badgeTag: data.badgeTag || undefined,
      rating: Number(data.rating) || 4.8,
      reviewsCount: Number(data.reviewsCount) || 100,
      etaMinutes: Number(data.etaMinutes) || 5,
      imageUrl: data.imageUrl || "assets/car.png",
      features: featuresList,

      hasAc: !!data.hasAc,
      tollIncluded: !!data.tollIncluded,
      freeCancellation: !!data.freeCancellation,
      isInstant: !!data.isInstant,
      status: data.status,
    }

    mutation.mutate(payload)
  }

  const savings = Math.max(
    0,
    Number(watchedValues.originalFare || 0) - Number(watchedValues.baseFare || 0)
  )

  return (
    <FormContainer
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => onClose(isOpen)}
      title={
        isViewMode
          ? "View Cab Type & Pricing Specs"
          : isEditMode
          ? "Edit Cab Type & Pricing Logic"
          : "Add New Cab Type & Fleet Vehicle"
      }
      description={
        isViewMode
          ? "Viewing vehicle identity, real-time app card specifications, and transparent fare rules."
          : isEditMode
          ? "Modify vehicle specifications, app card attributes, and per-KM rate formulas."
          : "Register a new vehicle with fare algorithms and real-time app presentation."
      }
      size="xl"
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
            <Button type="submit" form="cab-form" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update Cab Type"
                : "Save Cab Type"}
            </Button>
          )}
        </div>
      }
    >
      {/* Real-time Interactive Card Preview Header matching User App */}
      <div className="mb-6 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 p-5 shadow-sm dark:border-slate-800 dark:from-slate-900/50 dark:via-slate-900/80 dark:to-slate-950">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Live App Card Preview (User View)
          </span>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Syncs to Mobile App
          </span>
        </div>

        {/* Card UI replicating User App Screenshot */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Top Badges & Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300">
                {watchedValues.vehicleCategory || "HATCHBACK"}
              </span>
              {watchedValues.badgeTag && (
                <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                  {watchedValues.badgeTag}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{watchedValues.rating || 4.8}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({watchedValues.reviewsCount || 412})
              </span>
            </div>
          </div>

          {/* Vehicle Info & Specs */}
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <img
                src={
                  watchedValues.imageUrl?.startsWith("http")
                    ? watchedValues.imageUrl
                    : "/assets/car.png"
                }
                alt="Car"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = "none"
                }}
              />
            </div>

            <div className="flex-1">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                {watchedValues.make || "Maruti Suzuki"} {watchedValues.model || "WagonR ZXI"}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {watchedValues.vehicleCategory || "Hatchback"} •{" "}
                {watchedValues.fuelType || "CNG + Petrol"} •{" "}
                {watchedValues.seatingCapacity || 4} Seats
              </div>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
                <span>💺 {watchedValues.seatingCapacity || 4} Seats</span>
                <span>🧳 {watchedValues.luggageCapacity || 1} Bags</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  ⏱ {watchedValues.etaMinutes || 6} mins away
                </span>
              </div>
            </div>
          </div>

          {/* Feature Checkmarks Strip */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {featuresList.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                ✓ {f}
              </span>
            ))}
          </div>

          {/* Footer Pricing & CTA */}
          <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  ₹{watchedValues.baseFare || 699}
                </span>
                {watchedValues.originalFare && watchedValues.originalFare > (watchedValues.baseFare || 0) && (
                  <>
                    <span className="text-xs text-slate-400 line-through">
                      ₹{watchedValues.originalFare}
                    </span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Save ₹{savings}
                    </span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                {watchedValues.tollIncluded
                  ? "Tolls & taxes included"
                  : "Tolls extra • Excl. GST"}
              </div>
            </div>

            <div className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm">
              BOOK NOW →
            </div>
          </div>
        </div>
      </div>

      <form id="cab-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 01: Vehicle Identity & Hardware */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("01", "Vehicle Identity & Model Details")}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={control}
              name="make"
              label="VEHICLE MAKE / BRAND"
              placeholder="e.g. Maruti Suzuki, Toyota, Hyundai"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="model"
              label="MODEL & TRIM"
              placeholder="e.g. WagonR ZXI, Dzire VXi, Innova Crysta"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="registrationNumber"
              label="REGISTRATION PLATE"
              placeholder="e.g. BR 01 HB 3319"
              required
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="vehicleCategory"
              label="VEHICLE CATEGORY"
              options={CAB_CATEGORY_OPTIONS}
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="fuelType"
              label="FUEL & PROPULSION"
              options={CAB_FUEL_OPTIONS}
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="color"
              label="VEHICLE COLOR"
              placeholder="e.g. Silky Silver, Arctic White"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="manufacturingYear"
              label="MANUFACTURING YEAR"
              placeholder="e.g. 2023"
              readOnly={isViewMode}
            />

            <FormSelectField
              control={control}
              name="status"
              label="FLEET STATUS"
              options={CAB_STATUS_OPTIONS}
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="permitType"
              label="PERMIT TYPE"
              placeholder="e.g. All India Tourist Permit"
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Section 02: Pricing Engine (Base, Per KM, Extra KM, Outstation & Roundoff) */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("02", "Dynamic Pricing Engine & Fare Logic")}
          <p className="mb-4 text-xs text-slate-500">
            Configure transparent local and outstation rates used by the fare calculator in the booking flow.
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={control}
              name="baseFare"
              label="BASE FARE (₹)"
              type="number"
              placeholder="e.g. 699"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="originalFare"
              label="STRIKE-THROUGH FARE (₹)"
              type="number"
              placeholder="e.g. 839"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="baseKm"
              label="BASE INCLUDED DISTANCE (KM)"
              type="number"
              placeholder="e.g. 10"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="perKmCharge"
              label="PER KM CHARGE (₹/KM)"
              type="number"
              step="0.5"
              placeholder="e.g. 12.0"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="extraKmCharge"
              label="EXTRA KM CHARGE (₹/KM)"
              type="number"
              step="0.5"
              placeholder="e.g. 15.0"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="roundoffCostPerKm"
              label="ROUND TRIP COST (₹/KM)"
              type="number"
              step="0.5"
              placeholder="e.g. 11.0"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="outstationBaseCharge"
              label="OUTSTATION BASE CHARGE (₹)"
              type="number"
              placeholder="e.g. 2299"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="outstationPerKmCharge"
              label="OUTSTATION RATE (₹/KM)"
              type="number"
              step="0.5"
              placeholder="e.g. 13.5"
              readOnly={isViewMode}
            />
          </div>
        </div>

        {/* Section 03: App Presentation & Badges (Card Design) */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("03", "Mobile App Card Presentation & Ratings")}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FormSelectField
              control={control}
              name="badgeTag"
              label="HIGHLIGHT BADGE TAG"
              options={BADGE_TAG_OPTIONS}
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="rating"
              label="VEHICLE / RIDE RATING"
              type="number"
              step="0.1"
              placeholder="e.g. 4.8"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="reviewsCount"
              label="REVIEWS COUNT"
              type="number"
              placeholder="e.g. 412"
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="etaMinutes"
              label="ESTIMATED PICKUP ETA (MINS)"
              type="number"
              placeholder="e.g. 6"
              readOnly={isViewMode}
            />

            <div className="sm:col-span-2 lg:col-span-4">
              <FormField
                control={control}
                name="imageUrl"
                label="VEHICLE IMAGE URL / ASSET PATH"
                placeholder="e.g. assets/car.png or https://example.com/wagonr.png"
                readOnly={isViewMode}
              />
            </div>
          </div>
        </div>

        {/* Section 04: Capacities, Inclusions & Feature Checkmarks */}
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
          {sectionHeader("04", "Capacities, Inclusions & Feature Checkmarks")}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={control}
              name="seatingCapacity"
              label="SEATING CAPACITY (SEATS)"
              type="number"
              placeholder="e.g. 4"
              required
              readOnly={isViewMode}
            />

            <FormField
              control={control}
              name="luggageCapacity"
              label="LUGGAGE BAGS CAPACITY"
              type="number"
              placeholder="e.g. 1"
              required
              readOnly={isViewMode}
            />

            <div className="sm:col-span-2">
              <div className="grid grid-cols-2 gap-3 pt-1">
                <FormCheckboxField
                  control={control}
                  name="hasAc"
                  label="AC Included"
                  readOnly={isViewMode}
                />
                <FormCheckboxField
                  control={control}
                  name="tollIncluded"
                  label="Tolls Included"
                  readOnly={isViewMode}
                />
                <FormCheckboxField
                  control={control}
                  name="freeCancellation"
                  label="Free Cancellation"
                  readOnly={isViewMode}
                />
                <FormCheckboxField
                  control={control}
                  name="isInstant"
                  label="Instant Dispatch"
                  readOnly={isViewMode}
                />
              </div>
            </div>
          </div>

          {/* Feature Tag Badges Editor */}
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              FEATURE CHECKMARKS (SHOWN ON APP CARD)
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {featuresList.map((feature, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  ✓ {feature}
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {!isViewMode && (
              <div className="mt-3 flex max-w-md items-center gap-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addFeature()
                    }
                  }}
                  placeholder="e.g. Best City Commute, Silent Drive"
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
                />
                <Button type="button" size="sm" variant="outline" onClick={addFeature}>
                  Add Tag
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>
    </FormContainer>
  )
}
