import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import { FormField, FormSelectField } from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import { bookingService } from "@/services/bookingService"
import { cabService } from "@/services/cabService"
import type { Booking, CreateBookingPayload } from "@/types/booking"
import sectionHeader from "@/components/sectionHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import {
  Car,
  User,
  MapPin,
  Calendar,
  Clock,
  Printer,
  ShieldCheck,
  CreditCard,
  Phone,
  AlertCircle,
} from "lucide-react"

export interface BookingDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  booking?: (Booking & { viewMode?: boolean }) | null
}

const BOOKING_FORM_INITIAL_DATA: CreateBookingPayload = {
  serviceType: "CAB",
  tripType: "ONE_WAY",
  pickupLocation: "",
  dropLocation: "",
  intermediateStop: "",
  scheduledDateTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  returnDateTime: "",
  cabId: "",
  cabName: "Maruti Suzuki Dzire",
  cabCategory: "Sedan",
  cabPlateNumber: "",
  baseFare: 499,
  platformFee: 49,
  discountAmount: 0,
  totalAmount: 548,
  advanceAmount: 110,
  paymentMethod: "UPI",
  passengerName: "",
  passengerPhone: "",
  pickupNotes: "",
}

export default function BookingDialog({
  open,
  onClose,
  booking,
}: BookingDrawerProps) {
  const isViewMode = !!booking?.viewMode
  const isEditMode = !!booking?.id && !isViewMode

  // Fetch active fleet cabs for vehicle selection dropdown
  const { data: fleetCabs } = useQuery({
    queryKey: queryKeys.cabs.all,
    queryFn: () => cabService.getCabs({ status: "ACTIVE" }),
    enabled: open && !isViewMode,
  })

  const cabsList = fleetCabs || []

  const { handleSubmit, control, reset, watch, setValue } =
    useForm<CreateBookingPayload>({
      defaultValues: BOOKING_FORM_INITIAL_DATA,
      mode: "onChange",
    })

  const watchedCabId = watch("cabId")
  const watchedBaseFare = watch("baseFare")
  const watchedPlatformFee = watch("platformFee")
  const watchedDiscountAmount = watch("discountAmount")

  // Auto-fill cab model and category when a vehicle is selected from the fleet
  useEffect(() => {
    if (watchedCabId && cabsList.length > 0) {
      const selected = cabsList.find((c) => c.id === watchedCabId)
      if (selected) {
        setValue("cabName", `${selected.make || ""} ${selected.model || selected.name || "Cab"}`.trim())
        setValue("cabCategory", selected.vehicleCategory || "Sedan")
        setValue("cabPlateNumber", selected.registrationNumber || "")
        if (selected.baseFare && Number(selected.baseFare) > 0) {
          setValue("baseFare", Number(selected.baseFare))
        }
      }
    }
  }, [watchedCabId, cabsList, setValue])

  // Automatically recalculate totalAmount and advanceAmount
  useEffect(() => {
    const base = Number(watchedBaseFare) || 0
    const platform = Number(watchedPlatformFee) || 0
    const discount = Number(watchedDiscountAmount) || 0
    const calculatedTotal = Math.max(0, base + platform - discount)
    setValue("totalAmount", calculatedTotal)
    setValue("advanceAmount", Math.round(calculatedTotal * 0.2))
  }, [watchedBaseFare, watchedPlatformFee, watchedDiscountAmount, setValue])

  useEffect(() => {
    if (open) {
      if (isViewMode || isEditMode) {
        const schedTime = booking?.scheduledDateTime
          ? new Date(booking.scheduledDateTime).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16)

        const retTime = booking?.returnDateTime
          ? new Date(booking.returnDateTime).toISOString().slice(0, 16)
          : ""

        reset({
          serviceType: booking?.serviceType || "CAB",
          tripType: booking?.tripType || "ONE_WAY",
          pickupLocation: booking?.pickupLocation || "",
          dropLocation: booking?.dropLocation || "",
          intermediateStop: booking?.intermediateStop || "",
          scheduledDateTime: schedTime,
          returnDateTime: retTime,
          cabId: booking?.vehicleId || "",
          cabName: booking?.cabName || "Cab",
          cabCategory: booking?.cabCategory || "Sedan",
          cabPlateNumber: booking?.cabPlateNumber || "",
          baseFare: booking?.baseFare || 499,
          platformFee: booking?.platformFee ?? 49,
          discountAmount: booking?.discountAmount ?? 0,
          totalAmount: booking?.totalAmount || 548,
          advanceAmount: booking?.advanceAmount ?? 110,
          paymentMethod: booking?.paymentMethod || "UPI",
          passengerName: booking?.passengerName || "",
          passengerPhone: booking?.passengerPhone || "",
          pickupNotes: booking?.pickupNotes || "",
        })
      } else {
        reset(BOOKING_FORM_INITIAL_DATA)
      }
    }
  }, [open, booking, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateBookingPayload) =>
      bookingService.createBooking({
        ...data,
        baseFare: Number(data.baseFare),
        platformFee: Number(data.platformFee ?? 49),
        discountAmount: Number(data.discountAmount ?? 0),
        totalAmount: Number(data.totalAmount),
        advanceAmount: Number(data.advanceAmount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.all,
      })
      toast.success("Cab ride booking created successfully")
      reset()
      onClose(false)
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create booking")
    },
  })

  const onSubmit: SubmitHandler<CreateBookingPayload> = (data) => {
    if (!data.pickupLocation) {
      toast.error("Please enter a pickup address")
      return
    }
    if (!data.passengerName) {
      toast.error("Please enter passenger full name")
      return
    }
    if (!data.passengerPhone) {
      toast.error("Please enter passenger phone number")
      return
    }
    mutation.mutate(data)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <FormContainer
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => onClose(isOpen)}
      title={
        isViewMode
          ? `Ride Booking #${booking?.bookingNumber || booking?.id?.slice(0, 8) || ""}`
          : "Issue New Ride Booking"
      }
      description={
        isViewMode
          ? "Complete ride manifest, route tracking, assigned driver, and payment details."
          : "Schedule and dispatch a cab ride directly from the management console."
      }
      size="xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {isViewMode && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="h-4 w-4" /> Print Ride Receipt
            </Button>
          )}

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
              form="cab-booking-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating Booking..." : "Confirm & Dispatch"}
            </Button>
          )}
        </div>
      }
    >
      {isViewMode && booking ? (
        /* VIEW MODE: LUXURY CAB RIDE SUMMARY */
        <div className="space-y-6 text-slate-800 dark:text-slate-200">
          {/* Header Banner */}
          <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-slate-900/40 p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/30">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-indigo-500 dark:text-indigo-400">
                      {booking.bookingNumber || `#CAB-${booking.id?.slice(0, 8)}`}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                      {booking.serviceType || "CAB"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-500/20 px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase">
                      {(booking.tripType || "ONE_WAY").replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {booking.scheduledDateTime
                        ? new Date(booking.scheduledDateTime).toLocaleString()
                        : "Scheduled"}
                    </span>
                    {booking.otp && (
                      <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-mono font-bold text-amber-500 border border-amber-500/20">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Ride PIN: {booking.otp}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:text-right">
                <div>
                  <div className="text-[11px] font-medium text-slate-400">
                    Status
                  </div>
                  <StatusBadge status={booking.status || "ACTIVE"} />
                </div>
              </div>
            </div>
          </div>

          {/* Route & Trip Details */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Trip Route & Schedule
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                    Pickup Location
                  </div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {booking.pickupLocation}
                  </div>
                </div>
              </div>

              {booking.intermediateStop && (
                <div className="ml-3 flex items-start gap-3 border-l-2 border-dashed border-indigo-400/40 pl-6">
                  <div>
                    <div className="text-[10px] font-semibold uppercase text-indigo-400">
                      Waypoint / Intermediate Stop
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      {booking.intermediateStop}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-500">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase text-rose-600 dark:text-rose-400">
                    Dropoff Location
                  </div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {booking.dropLocation || "As Directed / Hourly Rental"}
                  </div>
                </div>
              </div>
            </div>

            {booking.returnDateTime && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-indigo-500/10 p-2 text-xs text-indigo-400">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Return Scheduled: {new Date(booking.returnDateTime).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Passenger & Vehicle Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Passenger Info */}
            <div className="rounded-xl border border-slate-200/80 p-4 dark:border-slate-800">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <User className="h-4 w-4 text-indigo-500" /> Passenger Details
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {booking.passengerName}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Phone className="h-3 w-3" />
                  <span className="font-mono">{booking.passengerPhone}</span>
                </div>
                {booking.user?.email && (
                  <div className="text-xs text-slate-400">
                    Email: {booking.user.email}
                  </div>
                )}
                {booking.pickupNotes && (
                  <div className="mt-2 rounded bg-amber-500/10 p-2 text-xs text-amber-500 border border-amber-500/20">
                    <strong>Note:</strong> {booking.pickupNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Cab & Driver Info */}
            <div className="rounded-xl border border-slate-200/80 p-4 dark:border-slate-800">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Car className="h-4 w-4 text-indigo-500" /> Vehicle & Assigned Driver
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {booking.cabName || "Cab Vehicle"}
                  </span>
                  <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-bold text-indigo-400">
                    {booking.cabCategory || "Sedan"}
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  Plate: {booking.cabPlateNumber || "Unassigned"}
                </div>
                <div className="border-t border-slate-200/60 pt-2 dark:border-slate-800">
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    Driver: <span className="font-semibold">{booking.driverName || "Pending Dispatch"}</span>
                  </div>
                  {booking.driverPhone && (
                    <div className="text-xs font-mono text-slate-400">
                      Phone: {booking.driverPhone}
                    </div>
                  )}
                  {booking.driverRating && (
                    <div className="text-xs text-amber-400 font-semibold">
                      Rating: ★ {booking.driverRating}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Fare Breakdown */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <CreditCard className="h-4 w-4 text-emerald-500" /> Fare Breakdown & Payment
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500 border border-emerald-500/20 uppercase">
                {booking.paymentStatus || "COMPLETED"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200/60 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-slate-400">Base Fare</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  ₹{Number(booking.baseFare || 0).toFixed(2)}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200/60 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-slate-400">Platform Fee</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  ₹{Number(booking.platformFee ?? 49).toFixed(2)}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200/60 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-slate-400">Advance Paid</div>
                <div className="font-bold text-emerald-500">
                  ₹{Number(booking.advanceAmount || 0).toFixed(2)}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200/60 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-slate-400">Balance Due</div>
                <div className="font-bold text-amber-500">
                  ₹{Number(booking.remainingAmount || 0).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-3 dark:border-slate-800">
              <div className="text-xs text-slate-400">
                Method: <span className="font-bold text-slate-700 dark:text-slate-300">{booking.paymentMethod || "UPI"}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 mr-2">Total Amount:</span>
                <span className="text-lg font-bold text-emerald-500">
                  ₹{Number(booking.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Info if cancelled */}
          {booking.status === "CANCELLED" && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400">
              <div className="flex items-center gap-2 font-bold uppercase">
                <AlertCircle className="h-4 w-4" /> Ride Cancelled
              </div>
              <p className="mt-1">
                Reason: {booking.cancellationReason || "No cancellation reason provided"}
              </p>
              {booking.cancelledAt && (
                <div className="mt-1 text-[11px] text-rose-400/80">
                  Cancelled on: {new Date(booking.cancelledAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* CREATE MODE: DISPATCH NEW RIDE */
        <form id="cab-booking-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 01: Journey Route & Schedule */}
          {sectionHeader("01", "Journey Route & Schedule")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="pickupLocation"
              label="Pickup Location"
              placeholder="e.g. Terminal 3, Airport Road"
              required
            />

            <FormField
              control={control}
              name="dropLocation"
              label="Dropoff Location"
              placeholder="e.g. City Center, Connaught Place"
              required
            />

            <FormField
              control={control}
              name="intermediateStop"
              label="Intermediate Stop (Optional)"
              placeholder="e.g. Metro Station Gate 2"
            />

            <FormSelectField
              control={control}
              name="tripType"
              label="Trip Type"
              options={[
                { label: "One Way", value: "ONE_WAY" },
                { label: "Round Trip", value: "ROUND_TRIP" },
                { label: "Outstation", value: "OUTSTATION" },
                { label: "Hourly Rental", value: "HOURLY_RENTAL" },
                { label: "Airport Transfer", value: "AIRPORT_TRANSFER" },
              ]}
            />

            <FormField
              control={control}
              name="scheduledDateTime"
              label="Scheduled Date & Time"
              type="datetime-local"
              required
            />

            <FormField
              control={control}
              name="returnDateTime"
              label="Return Date & Time (Round Trip)"
              type="datetime-local"
            />
          </div>

          {/* Section 02: Cab Vehicle & Fleet Selection */}
          {sectionHeader("02", "Cab Category & Fleet Selection")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {cabsList.length > 0 && (
              <FormSelectField
                control={control}
                name="cabId"
                label="Assign Registered Fleet Cab"
                options={[
                  { label: "— Choose from active cabs —", value: "" },
                  ...cabsList.map((c) => ({
                    label: `${c.make || ""} ${c.model || c.name || "Cab"} (${c.registrationNumber || "No Plate"}) - ${c.vehicleCategory}`,
                    value: c.id,
                  })),
                ]}
              />
            )}

            <FormSelectField
              control={control}
              name="cabCategory"
              label="Cab Category"
              options={[
                { label: "Sedan", value: "Sedan" },
                { label: "SUV / XL", value: "SUV / XL" },
                { label: "Hatchback", value: "Hatchback" },
                { label: "Electric (EV)", value: "Electric (EV)" },
                { label: "Luxury", value: "Luxury" },
              ]}
            />

            <FormField
              control={control}
              name="cabName"
              label="Vehicle Model Name"
              placeholder="e.g. Maruti Suzuki Dzire"
            />

            <FormField
              control={control}
              name="cabPlateNumber"
              label="Registration Plate #"
              placeholder="e.g. DL 01 AB 1234"
            />
          </div>

          {/* Section 03: Passenger Contact Details */}
          {sectionHeader("03", "Passenger Information")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="passengerName"
              label="Passenger Full Name"
              placeholder="e.g. Rahul Sharma"
              required
            />

            <FormField
              control={control}
              name="passengerPhone"
              label="Contact Phone Number"
              placeholder="e.g. +91 98765 43210"
              required
            />

            <div className="md:col-span-2">
              <FormField
                control={control}
                name="pickupNotes"
                label="Driver Pickup Notes"
                placeholder="e.g. Near main gate, passenger with 2 suitcases"
              />
            </div>
          </div>

          {/* Section 04: Fare & Payment Details */}
          {sectionHeader("04", "Fare Pricing & Payment Method")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <FormField
              control={control}
              name="baseFare"
              label="Base Fare (₹)"
              type="number"
              required
            />

            <FormField
              control={control}
              name="platformFee"
              label="Platform Fee (₹)"
              type="number"
            />

            <FormField
              control={control}
              name="discountAmount"
              label="Discount (₹)"
              type="number"
            />

            <FormField
              control={control}
              name="totalAmount"
              label="Total Calculated Fare (₹)"
              type="number"
              readOnly
            />

            <FormSelectField
              control={control}
              name="paymentMethod"
              label="Payment Method"
              options={[
                { label: "UPI", value: "UPI" },
                { label: "Cash to Driver", value: "CASH" },
                { label: "Credit/Debit Card", value: "CARD" },
                { label: "In-App Wallet", value: "WALLET" },
              ]}
            />
          </div>
        </form>
      )}
    </FormContainer>
  )
}
