import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";
import { freelancerProfileSchema } from "@/lib/form-schemas";
import type { RootState } from "@/store";
import type { ComprehensiveUserResponse, FreelancerCompleteUpdate } from "@/store/services/apis";
import { useUpdateFreelancerFreelancerFreelancerIdPutMutation } from "@/store/services/apis";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import ImageUploader from "../ui/image-uploader";
import { Input } from "../ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { Textarea } from "../ui/textarea";

interface ProfileSheetProps {
  open: boolean;
  initialData?: ComprehensiveUserResponse;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

function ProfileSheet({ open, onOpenChange, initialData }: ProfileSheetProps) {
  const { user } = useSelector((state: RootState) => state.global);
  const [updateProfile, { isLoading }] = useUpdateFreelancerFreelancerFreelancerIdPutMutation();

  const form = useForm<z.infer<typeof freelancerProfileSchema>>({
    resolver: zodResolver(freelancerProfileSchema),
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        first_name: initialData.first_name || "",
        last_name: initialData.last_name || "",
        title: initialData.freelancer_profile?.title || "",
        bio: initialData.freelancer_profile?.bio || "",
        country: initialData.freelancer_profile?.country || "",
        years_of_experience: initialData.freelancer_profile?.years_of_experience || 0,
        hourly_rate: initialData.freelancer_profile?.hourly_rate || 0,
        skills: initialData.freelancer_profile?.skills || [],
        github_url: initialData.freelancer_profile?.github_url || "",
        portfolio_url: initialData.freelancer_profile?.portfolio_url || "",
        linkedin_url: initialData.freelancer_profile?.linkedin_url || "",
        profile_picture: initialData.profile_picture || "",
      });
    }
  }, [initialData, form]);

  const { watch, setValue } = form;
  const skills = watch("skills");

  const addSkill = () => {
    if (skills.length < 20) {
      setValue("skills", [...skills, ""]);
    }
  };

  const removeSkill = (index: number) => {
    setValue(
      "skills",
      skills.filter((_, i) => i !== index),
    );
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setValue("skills", newSkills);
  };

  const onSubmit = async (data: z.infer<typeof freelancerProfileSchema>) => {
    if (!user?.user_id) {
      toast.error("User not found");
      return;
    }

    try {
      const filteredSkills = data.skills.filter((skill) => skill.trim() !== "");

      if (filteredSkills.length === 0) {
        toast.error("At least one skill is required");
        return;
      }

      const updateData: FreelancerCompleteUpdate = {
        first_name: data.first_name,
        last_name: data.last_name,
        profile_picture: data.profile_picture && data.profile_picture.trim() !== "" ? data.profile_picture : null,
        title: data.title,
        bio: data.bio,
        hourly_rate: data.hourly_rate,
        years_of_experience: data.years_of_experience,
        skills: filteredSkills,
        portfolio_url: data.portfolio_url && data.portfolio_url.trim() !== "" ? data.portfolio_url : null,
        github_url: data.github_url && data.github_url.trim() !== "" ? data.github_url : null,
        linkedin_url: data.linkedin_url && data.linkedin_url.trim() !== "" ? data.linkedin_url : null,
        country: data.country,
      };

      await updateProfile({
        freelancerId: user.user_id,
        freelancerCompleteUpdate: updateData,
      }).unwrap();

      toast.success("Profile updated successfully!");
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { detail?: string }; message?: string })?.data?.detail ||
        (error as { message?: string })?.message ||
        "Failed to update profile. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>Update your freelancer profile information</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full w-full flex-col items-start justify-start gap-4 overflow-y-auto p-4"
          >
            <FormField
              control={form.control}
              name="profile_picture"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <ImageUploader label="Profile Picture" field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Professional Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Full Stack Developer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us about yourself..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="United States" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="years_of_experience"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Years of Experience</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="5"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hourly_rate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Hourly Rate (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="50"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="w-full space-y-2">
              <FormLabel>Skills</FormLabel>
              {skills?.map((skill, index) => (
                <div key={index} className="flex w-full gap-2">
                  <Input
                    placeholder="e.g., React, Node.js"
                    value={skill}
                    className="flex-1"
                    onChange={(e) => updateSkill(index, e.target.value)}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => removeSkill(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {skills?.length < 20 && (
                <Button type="button" variant="outline" onClick={addSkill} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Skill
                </Button>
              )}
              <FormMessage />
            </div>
            <FormField
              control={form.control}
              name="github_url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>GitHub URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/username" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="portfolio_url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Portfolio URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourportfolio.com" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/username" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex w-full items-center justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export default ProfileSheet;
