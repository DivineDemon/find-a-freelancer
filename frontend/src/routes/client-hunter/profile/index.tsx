import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, Download, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import PaymentModal from "@/components/payment/payment-modal";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ImageUploader from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { requireAuth } from "@/lib/route-guard";
import { cn } from "@/lib/utils";
import type { RootState } from "@/store";
import {
  useChangePasswordUserChangePasswordPostMutation,
  useCheckPaymentStatusPaymentsCheckPaymentStatusPostMutation,
  useGetClientHunterClientHunterClientHunterIdGetQuery,
  useGetReceiptUrlPaymentsReceiptPaymentIdGetQuery,
  useGetUserPaymentsPaymentsUserPaymentsGetQuery,
  useToggleClientHunterStatusClientHunterToggleStatusClientHunterIdPatchMutation,
  useUpdateClientHunterClientHunterClientHunterIdPutMutation,
} from "@/store/services/apis";
import { showModal } from "@/store/slices/payment";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  profile_picture: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const Route = createFileRoute("/client-hunter/profile/")({
  component: ClientHunterProfile,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function ClientHunterProfile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.global);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  const {
    data: clientHunterData,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useGetClientHunterClientHunterClientHunterIdGetQuery(
    { clientHunterId: user?.user_id! },
    { skip: !user?.user_id },
  );

  const [updateProfile, { isLoading: isUpdatingProfile }] =
    useUpdateClientHunterClientHunterClientHunterIdPutMutation();
  const [checkPaymentStatus, { isLoading: isCheckingPayment }] =
    useCheckPaymentStatusPaymentsCheckPaymentStatusPostMutation();
  const { data: payments, refetch: refetchPayments } = useGetUserPaymentsPaymentsUserPaymentsGetQuery();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordUserChangePasswordPostMutation();
  const [toggleAccountStatus] = useToggleClientHunterStatusClientHunterToggleStatusClientHunterIdPatchMutation();

  const { data: receiptData } = useGetReceiptUrlPaymentsReceiptPaymentIdGetQuery(
    { paymentId: selectedPaymentId! },
    { skip: !selectedPaymentId },
  );

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone ?? "",
      profile_picture: user.image_url ?? "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      await updateProfile({
        clientHunterId: user?.user_id!,
        userUpdate: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || null,
          profile_picture: data.profile_picture || null,
        },
      }).unwrap();

      toast.success("Profile updated successfully!");
      refetchProfile();
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { detail?: string } })?.data?.detail || "Failed to update profile";
      toast.error(errorMessage);
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
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

  const handleRefreshPaymentStatus = async () => {
    try {
      await checkPaymentStatus().unwrap();
      toast.success("Payment status refreshed!");
      refetchPayments();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { detail?: string } })?.data?.detail || "Failed to refresh payment status";
      toast.error(errorMessage);
    }
  };

  const handleToggleAccountStatus = async () => {
    try {
      const result = await toggleAccountStatus({
        clientHunterId: user?.user_id!,
      }).unwrap();

      toast.success(result.message);
      refetchProfile();
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { detail?: string } })?.data?.detail || "Failed to update account status";
      toast.error(errorMessage);
      refetchProfile();
    }
  };

  const handleDownloadReceipt = (paymentId: number) => {
    setSelectedPaymentId(paymentId);
  };

  const handlePayNow = () => {
    dispatch(
      showModal({
        amount: 5000,
        description: "Premium Access - Find a Freelancer Platform",
      }),
    );
  };

  useEffect(() => {
    if (receiptData?.receipt_url) {
      window.open(receiptData.receipt_url, "_blank");
      setSelectedPaymentId(null);
    }
  }, [receiptData]);

  if (!user || isLoadingProfile) {
    return (
      <div className="h-[calc(100dvh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-center justify-center gap-5">
          <Loader2 className="size-20 animate-spin" />
        </MaxWidthWrapper>
      </div>
    );
  }

  const latestPayment = payments?.[0];
  const paymentStatus = user.payment_status || "unpaid";

  return (
    <>
      <div className="h-[calc(100dvh-84px)] w-full overflow-y-auto md:h-full">
        <MaxWidthWrapper className="grid grid-cols-1 items-start justify-start gap-5 md:grid-cols-2">
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="grid w-full grid-cols-1 items-start justify-start gap-5 rounded-lg border bg-card p-5 shadow md:grid-cols-2"
            >
              <div className="col-span-1 flex w-full flex-col items-center justify-center gap-2 border-b pb-5 md:col-span-2">
                <span className="w-full text-left font-bold text-[20px] leading-[20px]">Profile Settings</span>
                <span className="hidden w-full text-left text-[14px] text-muted-foreground leading-[14px] md:flex">
                  Manage your account information and preferences
                </span>
              </div>
              <FormField
                control={profileForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="profile_picture"
                render={({ field }) => (
                  <FormItem className="col-span-1 w-full md:col-span-2">
                    <FormControl>
                      <ImageUploader label="Profile Picture" field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isUpdatingProfile} className="col-span-1 w-full md:col-span-2">
                {isUpdatingProfile ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Save Changes"}
              </Button>
            </form>
          </Form>
          <div className="flex w-full flex-col items-start justify-start gap-5 rounded-lg border bg-card p-5 shadow">
            <div className="col-span-2 flex w-full flex-col items-center justify-center gap-2 border-b pb-5">
              <span className="w-full text-left font-bold text-[20px] leading-[20px]">Account Security & Payment</span>
              <span className="hidden w-full text-left text-[14px] text-muted-foreground leading-[14px] md:flex">
                Manage your account security and payment information
              </span>
            </div>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="grid w-full grid-cols-1 items-start justify-start gap-5 md:grid-cols-2"
              >
                <FormField
                  control={passwordForm.control}
                  name="current_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="• • • • • • • •" />
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
                        <Input {...field} type="password" placeholder="• • • • • • • •" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem className="col-span-1 w-full md:col-span-2">
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="• • • • • • • •" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isChangingPassword} className="col-span-1 w-full md:col-span-2">
                  {isChangingPassword ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Save Changes"}
                </Button>
              </form>
            </Form>
            <div className="flex w-full items-center justify-center rounded-lg border p-5">
              <span className="flex-1 text-left font-medium text-[14px] leading-[14px]">Account Status</span>
              <Switch checked={clientHunterData?.is_active} onCheckedChange={handleToggleAccountStatus} />
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-5 rounded-lg border p-5">
              <div className="flex w-full items-center justify-center">
                <span className="flex-1 text-left font-medium text-[14px] leading-[14px]">Payment Status</span>
                <span
                  className={cn("rounded-full px-4 py-2 font-medium text-[12px] capitalize leading-[12px]", {
                    "bg-green-500/20 text-green-500": paymentStatus === "paid",
                    "bg-red-500/20 text-red-500": paymentStatus === "unpaid",
                  })}
                >
                  {paymentStatus}
                </span>
              </div>
              <div className="grid w-full grid-cols-2 items-center justify-center gap-2.5">
                {paymentStatus === "paid" ? (
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full"
                    onClick={() => handleDownloadReceipt(latestPayment?.id ?? 0)}
                  >
                    <Download />
                    <span className="hidden lg:block">Download Receipt</span>
                  </Button>
                ) : (
                  <Button size="sm" variant="default" className="w-full" onClick={handlePayNow}>
                    <DollarSign />
                    Pay Now
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={isCheckingPayment}
                  onClick={handleRefreshPaymentStatus}
                >
                  {isCheckingPayment ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <RefreshCw />
                      <span className="hidden lg:block">Refresh</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </MaxWidthWrapper>
      </div>
      <PaymentModal amount={5000} description="Premium Access - Find a Freelancer Platform" />
    </>
  );
}
