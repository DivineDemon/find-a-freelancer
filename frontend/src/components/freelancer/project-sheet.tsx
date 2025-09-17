import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { projectSchema } from "@/lib/form-schemas";
import { useCreateProjectProjectsPostMutation } from "@/store/services/apis";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import ImageUploader from "../ui/image-uploader";
import { Input } from "../ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { Textarea } from "../ui/textarea";

interface ProjectSheetProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

function ProjectSheet({ open, onOpenChange }: ProjectSheetProps) {
  const [createProject, { isLoading }] = useCreateProjectProjectsPostMutation();

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

  const onSubmit = async (data: z.infer<typeof projectSchema>) => {
    try {
      // Convert empty strings to null for optional fields
      const projectData = {
        title: data.title,
        description: data.description && data.description.trim() !== "" ? data.description : null,
        url: data.url && data.url.trim() !== "" ? data.url : null,
        cover_image: data.cover_image && data.cover_image.trim() !== "" ? data.cover_image : null,
        earned: data.earned,
        time_taken: data.time_taken && data.time_taken.trim() !== "" ? data.time_taken : null,
      };

      await createProject({ projectCreate: projectData }).unwrap();
      toast.success("Project added successfully!");
      onOpenChange(false);
      form.reset();
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { detail?: string }; message?: string })?.data?.detail ||
        (error as { message?: string })?.message ||
        "Failed to add project. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>Add a Project</SheetTitle>
          <SheetDescription>Add a project to your portfolio</SheetDescription>
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
                Add Project
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export default ProjectSheet;
