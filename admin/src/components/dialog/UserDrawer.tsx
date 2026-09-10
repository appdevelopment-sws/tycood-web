import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FormContainer } from "@/components/formContainer"
import { FormField, FormSelectField } from "@/components/ui/form-fields"
import { queryKeys } from "@/lib/queryKeys"
import { userService } from "@/services/userService"
import type { PassengerUser, CreateUserPayload } from "@/types/user"
import sectionHeader from "@/components/sectionHeader"
import { USER_FORM_INITIAL_DATA } from "@/constants/page/super-admin/users"

export interface UserDrawerProps {
  open: boolean
  onClose: (open: boolean) => void
  user?: (PassengerUser & { viewMode?: boolean }) | null
}

export default function UserDrawer({
  open,
  onClose,
  user,
}: UserDrawerProps) {
  const isViewMode = !!user?.viewMode
  const isEditMode = !!user?.id
  const userId = user?.id

  const { handleSubmit, control, reset } = useForm<CreateUserPayload>({
    defaultValues: USER_FORM_INITIAL_DATA,
    mode: "onChange",
  })

  useEffect(() => {
    if (open) {
      if (isEditMode || isViewMode) {
        reset({
          name: user?.name ?? "",
          email: user?.email ?? "",
          phone: user?.phone ?? "",
          age: user?.age ? Number(user.age) : undefined,
          address: user?.address ?? "",
          emergencyContact: user?.emergencyContact ?? "",
          password: "",
          roleName: user?.roles?.[0] ?? "USER",
          status: user?.status === "INACTIVE" || user?.isActive === false ? "INACTIVE" : "ACTIVE",
          isActive: user?.isActive ?? true,
        })
      } else {
        reset(USER_FORM_INITIAL_DATA)
      }
    }
  }, [open, user, reset, isEditMode, isViewMode])

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateUserPayload) =>
      isEditMode && userId
        ? userService.updateUser(userId, data)
        : userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      })
      toast.success(
        isEditMode
          ? "User account updated successfully"
          : "User account created successfully"
      )
      reset()
      onClose(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save user account")
    },
  })

  const onSubmit: SubmitHandler<CreateUserPayload> = (data) => {
    const payload: CreateUserPayload = {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      age: data.age ? Number(data.age) : undefined,
      address: data.address || undefined,
      emergencyContact: data.emergencyContact || undefined,
      password: data.password || undefined,
      roleName: data.roleName || "USER",
      status: data.status,
      isActive: data.status === "ACTIVE",
    }
    mutation.mutate(payload)
  }

  const getTitle = () => {
    if (isViewMode) return "User Account Details"
    if (isEditMode) return "Edit User Account"
    return "Add User Account"
  }

  const getDescription = () => {
    if (isViewMode) return "View details of registered user profile, assigned role, and activity."
    if (isEditMode) return "Update user profile, contact information, role, and account status."
    return "Create a new user account (Passenger, Driver, or Super Admin)."
  }

  return (
    <FormContainer
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => onClose(isOpen)}
      title={getTitle()}
      description={getDescription()}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
          >
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button
              type="submit"
              form="user-form"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Save Changes"
                : "Create Account"}
            </Button>
          )}
        </div>
      }
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 01: Profile Information */}
        {sectionHeader("01", "User Profile Information")}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="name"
            label="Full Name"
            placeholder="e.g. David Miller"
            required
            readOnly={isViewMode}
          />

          <FormField
            control={control}
            name="email"
            label="Email Address"
            placeholder="e.g. david.m@example.com"
            required
            readOnly={isViewMode}
          />

          <FormField
            control={control}
            name="phone"
            label="Phone Number"
            placeholder="e.g. +1 555-0129"
            readOnly={isViewMode}
          />

          <FormField
            control={control}
            name="age"
            label="Age"
            type="number"
            placeholder="e.g. 28"
            readOnly={isViewMode}
          />
        </div>

        {/* Section 02: Account Security, Role & Status */}
        {sectionHeader("02", "Security, Role & Status")}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormSelectField
            control={control}
            name="roleName"
            label="User Type / Role"
            disabled={isViewMode}
            options={[
              { label: "Passenger (User)", value: "USER" },
              { label: "Driver User", value: "DRIVER" },
              { label: "Super Admin", value: "SUPER_ADMIN" },
              { label: "Booking Agent", value: "AGENT" },
            ]}
          />

          {!isViewMode && (
            <FormField
              control={control}
              name="password"
              label={isEditMode ? "New Password (Optional)" : "Password"}
              type="password"
              placeholder={isEditMode ? "Leave blank to keep current" : "Minimum 6 characters"}
              required={!isEditMode}
            />
          )}

          <FormSelectField
            control={control}
            name="status"
            label="Account Status"
            disabled={isViewMode}
            options={[
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ]}
          />
        </div>

        {/* Section 03: Contact & Address Details */}
        {sectionHeader("03", "Address & Emergency Contact")}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="address"
            label="Residential Address"
            placeholder="e.g. 123 Main St, New York, NY"
            readOnly={isViewMode}
          />

          <FormField
            control={control}
            name="emergencyContact"
            label="Emergency Contact Phone"
            placeholder="e.g. +1 555-9999"
            readOnly={isViewMode}
          />
        </div>
      </form>
    </FormContainer>
  )
}
