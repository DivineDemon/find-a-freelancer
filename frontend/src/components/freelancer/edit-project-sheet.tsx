import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { projectSchema } from "@/lib/form-schemas";
import type { ProjectSummary } from "@/store/services/apis";
import { useUpdateProjectProjectsProjectIdPutMutation } from "@/store/services/apis";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import ImageUploader from "../ui/image-uploader";
import { Input } from "../ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { Textarea } from "../ui/textarea";

interface EditProjectSheetProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  project: ProjectSummary | null;
}

function EditProjectSheet({ open, onOpenChange, project }: EditProjectSheetProps) {
  const [updateProject, { isLoading }] = useUpdateProjectProjectsProjectIdPutMutation();

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      cover_image: "",
      earned: 0,
      time_taken: "",
    },
  });

  useEffect(() => {
    if (project && open) {
      form.reset({
        title: project.title || "",
        description: project.description || "",
        url: project.url || "",
        cover_image: project.cover_image || "",
        earned: project.earned || 0,
        time_taken: project.time_taken || "",
      });
    }
  }, [project, open, form]);

  const onSubmit = async (data: z.infer<typeof projectSchema>) => {
    if (!project) return;

    try {
      const projectData = {
        title: data.title,
        description: data.description && data.description.trim() !== "" ? data.description : null,
        url: data.url && data.url.trim() !== "" ? data.url : null,
        cover_image: data.cover_image && data.cover_image.trim() !== "" ? data.cover_image : null,
        earned: data.earned,
        time_taken: data.time_taken && data.time_taken.trim() !== "" ? data.time_taken : null,
      };

      await updateProject({
        projectId: project.id,
        projectUpdate: projectData,
      }).unwrap();

      toast.success("Project updated successfully!");
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { detail?: string }; message?: string })?.data?.detail ||
        (error as { message?: string })?.message ||
        "Failed to update project. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>Edit Project</SheetTitle>
          <SheetDescription>Update your project details</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full w-full flex-col items-start justify-start gap-4 overflow-y-auto p-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input placeholder="E-commerce Website" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your project..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Project URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourproject.com" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cover_image"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <ImageUploader label="Cover Image" field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="earned"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Amount Earned (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="5000"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time_taken"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Time Taken</FormLabel>
                  <FormControl>
                    <Input placeholder="2 months" {...field} value={field.value || ""} />
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
                Update Project
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export default EditProjectSheet;
