import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (details: ProjectDetails) => void;
  freelancerName: string;
  isLoading?: boolean;
}

export interface ProjectDetails {
  project_title: string;
  project_description: string;
  project_budget: string;
}

function ProjectDetailsDialog({
  open,
  onOpenChange,
  onSubmit,
  freelancerName,
  isLoading = false,
}: ProjectDetailsDialogProps) {
  const [formData, setFormData] = useState<ProjectDetails>({
    project_title: "",
    project_description: "",
    project_budget: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.project_title.trim() && formData.project_description.trim()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof ProjectDetails, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.project_title.trim() && formData.project_description.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Chat with {freelancerName}</DialogTitle>
          <DialogDescription>
            Please provide project details to start a conversation with this freelancer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project_title">Project Title *</Label>
              <Input
                id="project_title"
                placeholder="e.g., Website Development"
                value={formData.project_title}
                onChange={(e) => handleInputChange("project_title", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project_description">Project Description *</Label>
              <Textarea
                id="project_description"
                placeholder="Describe your project requirements..."
                value={formData.project_description}
                onChange={(e) => handleInputChange("project_description", e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project_budget">Budget Range (Optional)</Label>
              <Input
                id="project_budget"
                placeholder="e.g., $1000-$5000"
                value={formData.project_budget}
                onChange={(e) => handleInputChange("project_budget", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isLoading}>
              {isLoading ? "Creating Chat..." : "Start Chat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectDetailsDialog;
