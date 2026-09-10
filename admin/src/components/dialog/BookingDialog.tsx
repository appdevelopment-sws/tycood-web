import { useEffect, useMemo } from "react"
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import { FormField, FormSelectField } from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import { bookingService } from "@/services/bookingService"
import { tripService } from "@/services/tripService"
import { stationService } from "@/services/stationService"
import type { Booking, CreateBookingPayload } from "@/types/bus"
import sectionHeader from "@/components/sectionHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Ticket, User, Bus, MapPin, Printer, Plus, Trash2 } from "lucide-react"

export interface BookingDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  booking?: (Booking & { viewMode?: boolean }) | null
}

const BOOKING_FORM_INITIAL_DATA: CreateBookingPayload = {
  tripId: "",
  boardingPointLocation: "",
  droppingPointLocation: "",
  totalAmount: 0,
  paymentMethod: "UPI",
  passengers: [
    {
      fullName: "",
      age: 25,
      gender: "MALE",
      seatNumber: "L1",
      email: "",
      phone: "",
    },
  ],
}

export default function BookingDialog({
  open,
  onClose,
  booking,
}: BookingDrawerProps) {
  const isViewMode = !!booking?.viewMode
  const isEditMode = !!booking?.id && !isViewMode

  // Fetch available trips for counter booking creation
  const { data: tripsData } = useQuery({
    queryKey: queryKeys.trips.all,
    queryFn: () => tripService.getTrips({ limit: 50 }),
    enabled: open && !isViewMode,
  })

  // Fetch stations for boarding & dropping point options
  const { data: stationsList } = useQuery({
    queryKey: queryKeys.stations.all,
    queryFn: () => stationService.getStations(),
    enabled: open && !isViewMode,
  })

  const trips = tripsData?.data || []
  const stations = stationsList || []

  const boardingDroppingOptions = useMemo(() => {
    const defaultOptions = [
      {
        label: "Kashmere Gate ISBT, Delhi",
        value: "Kashmere Gate ISBT, Delhi",
      },
      { label: "Anand Vihar ISBT, Delhi", value: "Anand Vihar ISBT, Delhi" },
      { label: "Dadar TT Circle, Mumbai", value: "Dadar TT Circle, Mumbai" },
      { label: "Borivali East, Mumbai", value: "Borivali East, Mumbai" },
      {
        label: "Interstate Bus Terminal, Jaipur",
        value: "Interstate Bus Terminal, Jaipur",
      },
      {
        label: "Majestic Bus Terminus, Bengaluru",
        value: "Majestic Bus Terminus, Bengaluru",
      },
      { label: "Swargate Bus Stand, Pune", value: "Swargate Bus Stand, Pune" },
      {
        label: "Koyambedu Omni Bus Terminus, Chennai",
        value: "Koyambedu Omni Bus Terminus, Chennai",
      },
    ]

    if (!stations || stations.length === 0) return defaultOptions

    const dbOptions = stations.map((s) => ({
      label: `${s.name} (${s.city}${s.terminalName ? ` - ${s.terminalName}` : ""})`,
      value: `${s.name}, ${s.city}`,
    }))

    return dbOptions
  }, [stations])

  const { handleSubmit, control, reset, watch, setValue } =
    useForm<CreateBookingPayload>({
      defaultValues: BOOKING_FORM_INITIAL_DATA,
      mode: "onChange",
    })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "passengers",
  })

  const selectedTripId = watch("tripId")
  const selectedTrip = trips.find((t) => t.id === selectedTripId)

  // Update total amount automatically based on trip fare and passenger count
  useEffect(() => {
    if (selectedTrip && fields.length > 0) {
      const fare = Number(selectedTrip.farePrice || selectedTrip.minFare) || 500
      setValue("totalAmount", fare * fields.length)
    }
  }, [selectedTripId, fields.length, selectedTrip, setValue])

  useEffect(() => {
    if (open) {
      if (isViewMode || isEditMode) {
        reset({
          tripId: booking?.tripId || "",
          boardingPointLocation: booking?.fromStation || "",
          droppingPointLocation: booking?.toStation || "",
          totalAmount: booking?.totalAmount || 0,
          paymentMethod: booking?.paymentMethod || "CARD",
          passengers: booking?.passengers?.map((p) => ({
            fullName: p.name,
            age: p.age,
            gender: p.gender as any,
            seatNumber: p.seatNumber,
            email: booking.passengerEmail,
            phone: booking.passengerPhone,
          })) || [
            {
              fullName: booking?.passengerName || "",
              age: 25,
              gender: "MALE",
              seatNumber: booking?.seatNumbers?.[0] || "L1",
              email: booking?.passengerEmail || "",
              phone: booking?.passengerPhone || "",
            },
          ],
        })
      } else {
        reset(BOOKING_FORM_INITIAL_DATA)
      }
    }
  }, [open, booking, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateBookingPayload) =>
      bookingService.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.all,
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.all,
      })
      toast.success("Booking created successfully")
      reset()
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create booking")
    },
  })

  const onSubmit: SubmitHandler<CreateBookingPayload> = (data) => {
    if (!data.tripId) {
      toast.error("Please select a trip")
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
          ? `Booking Details - ${booking?.pnr || booking?.ticketNumber || ""}`
          : "Issue New Ticket Booking"
      }
      description={
        isViewMode
          ? "View complete passenger manifest and reservation ticket details."
          : "Create a counter/admin ticket reservation for passengers."
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
              <Printer className="h-4 w-4" /> Print / Save Ticket
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
              form="booking-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Creating Reservation..."
                : "Confirm & Issue Ticket"}
            </Button>
          )}
        </div>
      }
    >
      {isViewMode ? (
        /* VIEW MODE TICKET DISPLAY */
        <div className="space-y-6 text-slate-800 dark:text-slate-200">
          {/* Header Ticket Banner */}
          <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-slate-900/40 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/30">
                  <Ticket className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-indigo-400">
                      {booking?.pnr || booking?.ticketNumber}
                    </span>
                    <StatusBadge status={booking?.status || "CONFIRMED"} />
                  </div>
                  <p className="text-xs text-slate-400">
                    Booked on:{" "}
                    {booking?.bookedAt
                      ? new Date(booking.bookedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black tracking-tight">
                  ₹{booking?.totalAmount?.toFixed(2) || "0.00"}
                </div>
                <div className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                  Payment: {booking?.paymentStatus || "PAID"} (
                  {booking?.paymentMethod || "CARD"})
                </div>
              </div>
            </div>
          </div>

          {/* Section 01: Route & Journey Details */}
          <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
            {sectionHeader("01", "Route & Journey Overview")}

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-lg border bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                <MapPin className="mt-0.5 h-5 w-5 text-indigo-500" />
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Origin Station
                  </div>
                  <div className="text-sm font-semibold">
                    {booking?.fromCity}
                  </div>
                  <div className="text-xs text-slate-400">
                    {booking?.fromStation}
                  </div>
                  <div className="mt-1 font-mono text-xs font-medium text-indigo-400">
                    Dep: {booking?.departureTime} ({booking?.departureDate})
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                <MapPin className="mt-0.5 h-5 w-5 text-rose-500" />
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Destination Station
                  </div>
                  <div className="text-sm font-semibold">{booking?.toCity}</div>
                  <div className="text-xs text-slate-400">
                    {booking?.toStation}
                  </div>
                  <div className="mt-1 font-mono text-xs font-medium text-emerald-400">
                    Arr: {booking?.arrivalTime} ({booking?.arrivalDate})
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                <Bus className="mt-0.5 h-5 w-5 text-amber-500" />
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Bus & Operator
                  </div>
                  <div className="text-sm font-semibold">
                    {booking?.operatorName}
                  </div>
                  <div className="text-xs text-slate-400">
                    {booking?.busCategory}
                  </div>
                  <div className="mt-1 font-mono text-xs text-amber-400">
                    Reg: {booking?.busRegistration || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 02: Passenger Seat Manifest */}
          <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
            {sectionHeader("02", "Passenger Manifest & Seats")}

            <div className="mt-4 overflow-hidden rounded-lg border dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-semibold text-slate-500 uppercase dark:bg-slate-900/80">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Passenger Name</th>
                    <th className="p-3">Age / Gender</th>
                    <th className="p-3">Seat Number</th>
                    <th className="p-3 text-right">Fare Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {booking?.passengers && booking.passengers.length > 0 ? (
                    booking.passengers.map((p, idx) => (
                      <tr
                        key={p.id || idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                      >
                        <td className="p-3 font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-3 font-semibold text-slate-200">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-indigo-400" />
                            {p.name}
                          </div>
                        </td>
                        <td className="p-3">
                          {p.age} yrs / {p.gender}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 font-mono text-xs font-bold text-indigo-400">
                            {p.seatNumber}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          ₹
                          {p.farePaid
                            ? p.farePaid.toFixed(2)
                            : (
                                (booking?.totalAmount || 0) /
                                (booking?.passengers?.length || 1)
                              ).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3 font-mono text-slate-400">1</td>
                      <td className="p-3 font-semibold text-slate-200">
                        {booking?.passengerName}
                      </td>
                      <td className="p-3">25 yrs / MALE</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {booking?.seatNumbers?.map((st) => (
                            <span
                              key={st}
                              className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 font-mono text-xs font-bold text-indigo-400"
                            >
                              {st}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        ₹{booking?.totalAmount?.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Contact Details */}
            <div className="mt-4 flex flex-wrap gap-6 rounded-lg border bg-slate-50/50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900/40">
              <div>
                <span className="font-semibold text-slate-400 uppercase">
                  Contact Email:{" "}
                </span>
                <span className="font-medium text-slate-200">
                  {booking?.passengerEmail || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 uppercase">
                  Contact Phone:{" "}
                </span>
                <span className="font-medium text-slate-200">
                  {booking?.passengerPhone || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CREATE MODE FORM */
        <form
          id="booking-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8"
        >
          {/* Section 01: Select Trip & Route */}
          <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
            {sectionHeader("01", "Trip & Journey Selection")}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormSelectField
                  control={control}
                  name="tripId"
                  label="SELECT ACTIVE SCHEDULED TRIP"
                  required
                  options={trips.map((t) => ({
                    label: `${t.tripCode || t.id.slice(0, 8)} | ${t.routeName || "Route"} | Dep: ${new Date(t.departureTime).toLocaleString()} | ₹${t.farePrice || t.minFare || 500}`,
                    value: t.id,
                  }))}
                />
              </div>

              <FormSelectField
                control={control}
                name="boardingPointLocation"
                label="BOARDING POINT / STOP"
                placeholder="Select Boarding Station..."
                required
                options={boardingDroppingOptions}
              />

              <FormSelectField
                control={control}
                name="droppingPointLocation"
                label="DROPPING POINT / STOP"
                placeholder="Select Dropping Station..."
                required
                options={boardingDroppingOptions}
              />
            </div>
          </div>

          {/* Section 02: Passenger Information */}
          <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
            <div className="flex items-center justify-between">
              {sectionHeader("02", "Passenger Details")}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    fullName: "",
                    age: 25,
                    gender: "MALE",
                    seatNumber: `L${fields.length + 1}`,
                    email: "",
                    phone: "",
                  })
                }
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Passenger
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {fields.map((fieldItem, index) => (
                <div
                  key={fieldItem.id}
                  className="relative rounded-lg border bg-slate-50/50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="mb-3 flex items-center justify-between border-b pb-2 dark:border-slate-800">
                    <span className="text-xs font-semibold text-indigo-400">
                      Passenger #{index + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="h-6 w-6 p-0 text-rose-400 hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <FormField
                        control={control}
                        name={`passengers.${index}.fullName`}
                        label="PASSENGER FULL NAME"
                        placeholder="e.g. John Doe"
                        required
                      />
                    </div>

                    <FormField
                      control={control}
                      name={`passengers.${index}.age`}
                      label="AGE"
                      type="number"
                      placeholder="25"
                      required
                    />

                    <FormSelectField
                      control={control}
                      name={`passengers.${index}.gender`}
                      label="GENDER"
                      options={[
                        { label: "Male", value: "MALE" },
                        { label: "Female", value: "FEMALE" },
                        { label: "Other", value: "OTHER" },
                      ]}
                      required
                    />

                    <FormField
                      control={control}
                      name={`passengers.${index}.seatNumber`}
                      label="SEAT NUMBER"
                      placeholder="e.g. L1, L2, U5"
                      required
                    />

                    <FormField
                      control={control}
                      name={`passengers.${index}.phone`}
                      label="PHONE NUMBER"
                      placeholder="+1 (555) 000-1122"
                    />

                    <div className="sm:col-span-2">
                      <FormField
                        control={control}
                        name={`passengers.${index}.email`}
                        label="EMAIL ADDRESS"
                        type="email"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 03: Payment & Fare Breakdown */}
          <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-slate-800">
            {sectionHeader("03", "Payment & Counter Billing")}

            <div className="grid gap-6 sm:grid-cols-2">
              <FormSelectField
                control={control}
                name="paymentMethod"
                label="PAYMENT METHOD"
                options={[
                  { label: "UPI / QR Code", value: "UPI" },
                  { label: "Credit / Debit Card", value: "CARD" },
                  { label: "Cash (Counter Collection)", value: "CASH" },
                  { label: "Wallet Balance", value: "WALLET" },
                ]}
                required
              />

              <FormField
                control={control}
                name="totalAmount"
                label="TOTAL AMOUNT (₹ INR)"
                type="number"
                step="0.01"
                required
              />
            </div>
          </div>
        </form>
      )}
    </FormContainer>
  )
}
