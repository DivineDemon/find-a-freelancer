import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UserRead } from "@/store/services/apis";
import { useCreateChatChatsPostMutation } from "@/store/services/apis";

const newChatSchema = z.object({
  project_title: z.string().min(1, "Project title is required").max(100, "Project title too long"),
  project_description: z
    .string()
    .min(10, "Project description must be at least 10 characters")
    .max(500, "Project description too long"),
  project_budget: z.string().min(1, "Budget is required").max(50, "Budget description too long"),
});

interface NewChatDialogProps {
  user: UserRead;
  onChatCreated?: () => void;
}

export default function NewChatDialog({ user, onChatCreated }: NewChatDialogProps) {
  const [open, setOpen] = useState(false);

  const [createChat, { isLoading: creating }] = useCreateChatChatsPostMutation();

  // Check if current user is a client hunter who hasn't paid
  const isUnpaidClientHunter =
    localStorage.getItem("user_type") === "client_hunter" && localStorage.getItem("has_paid") !== "true";

  const form = useForm<z.infer<typeof newChatSchema>>({
    resolver: zodResolver(newChatSchema),
    defaultValues: {
      project_title: "",
      project_description: "",
      project_budget: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof newChatSchema>) => {
    try {
      const response = await createChat({
        chatCreate: {
          participant_id: user.id,
          project_title: data.project_title,
          project_description: data.project_description,
          project_budget: data.project_budget,
        },
      });

      if (response.data) {
        toast.success("Chat started successfully!");
        setOpen(false);
        form.reset();
        onChatCreated?.();
      }
    } catch (_error) {
      toast.error("Failed to start chat");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Start Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start a Conversation</DialogTitle>
          <DialogDescription>
            {isUnpaidClientHunter
              ? "Complete payment to start conversations with freelancers."
              : `Start a conversation with ${user.first_name} ${user.last_name} about your project.`}
          </DialogDescription>
        </DialogHeader>

        {isUnpaidClientHunter ? (
          <div className="space-y-4">
            <div className="py-8 text-center">
              <div className="mb-4 text-6xl">🔒</div>
              <h3 className="mb-2 font-semibold text-xl">Payment Required</h3>
              <p className="mb-4 text-muted-foreground">
                Client hunters need to pay a one-time $50 platform access fee to start conversations with freelancers.
              </p>
              <Button
                onClick={() => {
                  setOpen(false);
                  // Trigger payment modal
                  window.location.href = "/dashboard";
                }}
                className="w-full"
              >
                Complete Payment
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="project_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Responsive E-commerce Website" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your project requirements, timeline, and any specific features you need..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project_budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Range</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., $1000 - $5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Chat...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Start Chat
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
