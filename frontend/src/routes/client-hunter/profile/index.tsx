import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Edit, Eye, EyeOff, Loader2, RefreshCw, Shield, User2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ImageUploader from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { requireAuth } from "@/lib/route-guard";
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
  const { user } = useSelector((state: RootState) => state.global);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);
  const [showPasswords, setShowPasswords] = useState<{
    current: boolean;
    new: boolean;
    confirm: boolean;
  }>({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    data: clientHunterData,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useGetClientHunterClientHunterClientHunterIdGetQuery(
    { clientHunterId: user?.user_id! },
    { skip: !user?.user_id },
  );

  const { data: payments, refetch: refetchPayments } = useGetUserPaymentsPaymentsUserPaymentsGetQuery();

  const [updateProfile, { isLoading: isUpdatingProfile }] =
    useUpdateClientHunterClientHunterClientHunterIdPutMutation();

  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordUserChangePasswordPostMutation();

  const [checkPaymentStatus, { isLoading: isCheckingPayment }] =
    useCheckPaymentStatusPaymentsCheckPaymentStatusPostMutation();

  const [toggleAccountStatus, { isLoading: isTogglingStatus }] =
    useToggleClientHunterStatusClientHunterToggleStatusClientHunterIdPatchMutation();

  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const { data: receiptData } = useGetReceiptUrlPaymentsReceiptPaymentIdGetQuery(
    { paymentId: selectedPaymentId! },
    { skip: !selectedPaymentId },
  );

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      profile_picture: "",
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

  useEffect(() => {
    if (clientHunterData) {
      profileForm.reset({
        first_name: clientHunterData.first_name || "",
        last_name: clientHunterData.last_name || "",
        email: clientHunterData.email || "",
        phone: clientHunterData.phone || "",
        profile_picture: clientHunterData.profile_picture || "",
      });
    }
  }, [clientHunterData, profileForm]);

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
      setIsEditing(false);
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
      setShowPasswordForm(false);
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
    }
  };

  const handleDownloadReceipt = (paymentId: number) => {
    setSelectedPaymentId(paymentId);
  };

  useEffect(() => {
    if (receiptData?.receipt_url) {
      window.open(receiptData.receipt_url, "_blank");
      setSelectedPaymentId(null);
    }
  }, [receiptData]);

  if (!user || isLoadingProfile) {
    return (
      <div className="h-[calc(100vh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-center justify-center gap-5">
          <Loader2 className="size-20 animate-spin" />
        </MaxWidthWrapper>
      </div>
    );
  }

  const latestPayment = payments?.[0];
  const paymentStatus = user.payment_status || "unpaid";

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-y-auto">
      <MaxWidthWrapper className="flex flex-col items-start justify-start gap-6 py-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              {clientHunterData?.profile_picture ? (
                <img
                  src={clientHunterData.profile_picture}
                  alt="Profile"
                  className="size-16 rounded-full object-cover"
                />
              ) : (
                <User2 className="size-8" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-2xl">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your account information and preferences</p>
            </div>
          </div>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
            disabled={isUpdatingProfile}
          >
            <Edit className="mr-2 size-4" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User2 className="size-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
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
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} disabled={!isEditing} />
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
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="profile_picture"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUploader label="Profile Picture" field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isEditing && (
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isUpdatingProfile}>
                        {isUpdatingProfile && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Save Changes
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5" />
                Account Status & Payment
              </CardTitle>
              <CardDescription>View your account status and payment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account Status</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={clientHunterData?.is_active ? "default" : "destructive"}>
                    {clientHunterData?.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={handleToggleAccountStatus} disabled={isTogglingStatus}>
                    {isTogglingStatus && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {clientHunterData?.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={paymentStatus === "paid" ? "default" : "secondary"}>
                    {paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={handleRefreshPaymentStatus} disabled={isCheckingPayment}>
                    <RefreshCw className={`mr-2 size-4 ${isCheckingPayment ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {latestPayment && (
                <div className="space-y-2">
                  <Label>Latest Payment</Label>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">${(latestPayment.amount / 100).toFixed(2)}</p>
                        <p className="text-muted-foreground text-sm">
                          {new Date(latestPayment.paid_at || latestPayment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(latestPayment.id)}>
                        <Download className="mr-2 size-4" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Change Password</Label>
                <Button variant="outline" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                  <Shield className="mr-2 size-4" />
                  {showPasswordForm ? "Cancel" : "Change Password"}
                </Button>
              </div>

              {showPasswordForm && (
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="current_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type={showPasswords.current ? "text" : "password"} {...field} />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() =>
                                  setShowPasswords((prev) => ({
                                    ...prev,
                                    current: !prev.current,
                                  }))
                                }
                              >
                                {showPasswords.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </Button>
                            </div>
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
                            <div className="relative">
                              <Input type={showPasswords.new ? "text" : "password"} {...field} />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() =>
                                  setShowPasswords((prev) => ({
                                    ...prev,
                                    new: !prev.new,
                                  }))
                                }
                              >
                                {showPasswords.new ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </Button>
                            </div>
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
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type={showPasswords.confirm ? "text" : "password"} {...field} />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() =>
                                  setShowPasswords((prev) => ({
                                    ...prev,
                                    confirm: !prev.confirm,
                                  }))
                                }
                              >
                                {showPasswords.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isChangingPassword}>
                        {isChangingPassword && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Change Password
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowPasswordForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
