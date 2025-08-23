import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { requireAuth } from "@/lib/route-guard";
import {
  useGetCurrentUserProfileAuthMeGetQuery,
  useUpdateCurrentUserProfileAuthMePutMutation,
} from "@/store/services/apis";

export const Route = createFileRoute("/dashboard/profile")({
  component: Profile,
  beforeLoad: async () => {
    await requireAuth();
  },
});

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name too long"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  profile_picture: z.string().url("Must be a valid URL").optional().nullable(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password too long"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

function Profile() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { data: user, isLoading, refetch } = useGetCurrentUserProfileAuthMeGetQuery();
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateCurrentUserProfileAuthMePutMutation();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      profile_picture: user?.profile_picture || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  // Update form values when user data loads
  useEffect(() => {
    if (user && !isEditingProfile) {
      profileForm.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture: user.profile_picture || "",
      });
    }
  }, [user, isEditingProfile, profileForm]);

  const handleProfileUpdate = async (data: z.infer<typeof profileSchema>) => {
    try {
      await updateProfile({
        userUpdate: {
          first_name: data.first_name,
          last_name: data.last_name,
          profile_picture: data.profile_picture || null,
        },
      });

      toast.success("Profile updated successfully!");
      setIsEditingProfile(false);
      refetch();
    } catch (_error) {
      toast.error("Failed to update profile");
    }
  };

  const handlePasswordChange = async (data: z.infer<typeof passwordSchema>) => {
    try {
      await updateProfile({
        userUpdate: {
          current_password: data.current_password,
          new_password: data.new_password,
        },
      });

      toast.success("Password changed successfully!");
      setIsChangingPassword(false);
      passwordForm.reset();
    } catch (_error) {
      toast.error("Failed to change password");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="size-20 animate-spin" />
      </div>
    );
  }

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
    <div className="flex h-full w-full flex-col items-start justify-start py-5">
      <MaxWidthWrapper>
        <div className="w-full space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-bold text-3xl">Profile</h1>
            <p className="text-muted-foreground">Manage your account information and settings</p>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information and profile picture</CardDescription>
                </div>
                <Button
                  variant={isEditingProfile ? "outline" : "default"}
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  {isEditingProfile ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditingProfile ? (
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profileForm.watch("profile_picture") || ""} alt="Profile" />
                        <AvatarFallback className="text-lg">
                          <Camera className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <FormField
                          control={profileForm.control}
                          name="profile_picture"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile Picture URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/image.jpg"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={updatingProfile}>
                        {updatingProfile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.profile_picture || ""} alt="Profile" />
                      <AvatarFallback className="text-lg">
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="font-medium text-muted-foreground text-sm">First Name</label>
                      <p className="text-sm">{user.first_name}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground text-sm">Last Name</label>
                      <p className="text-sm">{user.last_name}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground text-sm">User Type</label>
                      <p className="text-sm capitalize">{user.user_type.replace("_", " ")}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground text-sm">Account Status</label>
                      <p className="text-sm">{user.is_active ? "Active" : "Inactive"}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground text-sm">Payment Status</label>
                      <p className="text-sm">
                        {user.user_type === "freelancer"
                          ? "Free Platform Access"
                          : localStorage.getItem("has_paid") === "true"
                            ? "Paid - Full Access"
                            : "Payment Required"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </div>
                <Button
                  variant={isChangingPassword ? "outline" : "default"}
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                >
                  {isChangingPassword ? "Cancel" : "Change Password"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isChangingPassword ? (
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="current_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={passwordForm.control}
                        name="new_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
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
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={updatingProfile}>
                      {updatingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm">Click "Change Password" to update your password</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
