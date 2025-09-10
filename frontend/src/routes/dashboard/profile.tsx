import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ImageUploader from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { passwordSchema, profileSchema } from "@/lib/form-schemas";
import { requireAuth } from "@/lib/route-guard";
import type { RootState } from "@/store";
import {
  useChangePasswordAuthChangePasswordPostMutation,
  useCheckPaymentStatusPaymentsCheckPaymentStatusPostMutation,
  useGetUserPaymentsPaymentsUserPaymentsGetQuery,
  useUpdateCurrentUserProfileAuthMePutMutation,
} from "@/store/services/apis";

export const Route = createFileRoute("/dashboard/profile")({
  component: Profile,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function Profile() {
  const { user } = useSelector((state: RootState) => state.global);
  const [updateProfile, { isLoading: updating }] = useUpdateCurrentUserProfileAuthMePutMutation();
  const [changePassword, { isLoading: changing }] = useChangePasswordAuthChangePasswordPostMutation();
  const [checkPaymentStatus, { isLoading: checkingPayment }] =
    useCheckPaymentStatusPaymentsCheckPaymentStatusPostMutation();
  const { data: payments, refetch: refetchPayments } = useGetUserPaymentsPaymentsUserPaymentsGetQuery();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || "",
      phone: user?.phone || "",
      last_name: user?.last_name || "",
      first_name: user?.first_name || "",
      image_url: user?.image_url || "",
      is_active: user?.account_status === "active" || false,
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  const handleProfileUpdate = async (data: z.infer<typeof profileSchema>) => {
    try {
      await updateProfile({
        userUpdate: {
          first_name: data.first_name,
          last_name: data.last_name,
          profile_picture: data.image_url || null,
        },
      });

      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      toast.error(`Failed to update profile: ${error}`);
    }
  };

  const handlePasswordChange = async (data: z.infer<typeof passwordSchema>) => {
    try {
      await changePassword({
        passwordChange: {
          current_password: data.current_password,
          new_password: data.new_password,
        },
      }).unwrap();

      toast.success("Password changed successfully!");
      passwordForm.reset();
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { detail?: string } })?.data?.detail || "Failed to change password";
      toast.error(errorMessage);
    }
  };

  const handleCheckPaymentStatus = async () => {
    try {
      await checkPaymentStatus().unwrap();
      await refetchPayments();
      toast.success("Payment status updated!");
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { detail?: string } })?.data?.detail || "Failed to check payment status";
      toast.error(errorMessage);
    }
  };

  const handleDownloadInvoice = (paymentId: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const url = `${import.meta.env.VITE_BASE_API_URL}/payments/invoice/${paymentId}`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice_${paymentId}.pdf`);
    link.setAttribute("Authorization", `Bearer ${token}`);

    // Create a hidden iframe to trigger the download
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);

    toast.success("Invoice download started");
  };

  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h3 className="mb-2 font-semibold text-lg">User not found</h3>
          <p className="text-muted-foreground">Please check your authentication.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5">
        <div className="flex w-full flex-col items-center justify-center gap-2">
          <span className="w-full text-left font-bold text-[30px] leading-[30px]">Profile</span>
          <span className="w-full text-left text-[16px] text-muted-foreground leading-[16px]">
            Manage your account information and settings
          </span>
        </div>
        {/* Payment Status Section */}
        <div className="w-full rounded-xl border bg-card p-5 shadow">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">Payment Status</h3>
            <p className="text-muted-foreground text-sm">Manage your payment information and download invoices</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${user.has_paid ? "bg-green-500" : "bg-red-500"}`} />
              <span className="font-medium">{user.has_paid ? "Paid" : "Unpaid"}</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCheckPaymentStatus} disabled={checkingPayment}>
                {checkingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh Status"}
              </Button>
            </div>
          </div>

          {payments && payments.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 font-medium">Payment History</h4>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">${(payment.amount / 100).toFixed(2)}</p>
                      <p className="text-muted-foreground text-sm">{payment.description || "Platform Access Fee"}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 font-medium text-xs ${
                          payment.status === "succeeded"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                      {payment.status === "succeeded" && (
                        <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(payment.id)}>
                          Download Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid w-full grid-cols-2 items-start justify-start divide-x rounded-xl border bg-card shadow">
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
              className="col-span-1 grid w-full grid-cols-2 items-start justify-start gap-5 p-5"
            >
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value || ""} placeholder="johndoe@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="John" value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="Doe" value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="+1234567890" value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="col-span-2 w-full">
                <FormField
                  control={profileForm.control}
                  name="image_url"
                  render={({ field, fieldState }) => (
                    <ImageUploader field={field} error={fieldState.error} label="Profile Picture" />
                  )}
                />
              </div>
              <FormField
                control={profileForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Account Status</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" variant="default" className="col-span-2 w-full" disabled={updating}>
                {updating ? <Loader2 className="animate-spin" /> : "Update Profile"}
              </Button>
            </form>
          </Form>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
              className="col-span-1 grid w-full grid-cols-2 items-start justify-start gap-5 p-5"
            >
              <FormField
                control={passwordForm.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        value={field.value || ""}
                        placeholder="Enter your current password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        value={field.value || ""}
                        placeholder="Enter your new password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        value={field.value || ""}
                        placeholder="Confirm your new password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="default" className="col-span-2 w-full" disabled={changing}>
                {changing ? <Loader2 className="animate-spin" /> : "Change Password"}
              </Button>
            </form>
          </Form>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
