import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowUpRight, EllipsisVertical } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import type { RootState } from "@/store";
import type { ProjectSummary } from "@/store/services/apis";
import { useDeleteProjectProjectsProjectIdDeleteMutation } from "@/store/services/apis";
import EditProjectSheet from "../freelancer/edit-project-sheet";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import WarningModal from "../warning-modal";

interface ProjectCardProps {
  project: ProjectSummary;
}

function ProjectCard({ project }: ProjectCardProps) {
  const { user } = useSelector((state: RootState) => state.global);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectProjectsProjectIdDeleteMutation();

  const handleDelete = async () => {
    try {
      await deleteProject({ projectId: project.id }).unwrap();
      toast.success("Project deleted successfully!");
      setDeleteOpen(false);
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { detail?: string }; message?: string })?.data?.detail ||
        (error as { message?: string })?.message ||
        "Failed to delete project. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-start justify-start gap-2 rounded-lg border bg-card shadow">
      <div className="relative w-full">
        <div className="w-full bg-black">
          <img
            alt="project-cover"
            src={project.cover_image ?? ""}
            className="size-full rounded-t-lg object-cover opacity-50"
          />
        </div>
        <span className="absolute top-2.5 left-2.5 rounded-md bg-green-500 px-4 py-1.5 text-[14px] text-white leading-[14px]">
          {project.earned} USD
        </span>
        <span className="absolute top-10 left-2.5 rounded-md bg-orange-500 px-4 py-1.5 text-[14px] text-white leading-[14px]">
          {project.time_taken}
        </span>
        {user.user_type === "freelancer" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="icon" className="absolute top-2.5 right-2.5">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit Project</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex w-full flex-col items-center justify-center gap-2.5 p-5">
        <div className="flex w-full items-center justify-center">
          <span className="w-full text-left font-semibold text-[18px] leading-[18px]">{project.title}</span>
          <Link to={project.url ?? ""} className="text-blue-500">
            <ArrowUpRight className="size-5" />
          </Link>
        </div>
        <span className="w-full text-left text-[14px] text-muted-foreground leading-[18px]">{project.description}</span>
        <span className="w-full text-right text-[14px] text-muted-foreground leading-[18px]">
          {dayjs(project.created_at).format("DD MMM YYYY")}
        </span>
      </div>

      <EditProjectSheet open={editOpen} onOpenChange={setEditOpen} project={project} />

      <WarningModal
        open={deleteOpen}
        setOpen={setDeleteOpen}
        title="Delete Project"
        text={
          <>
            This action cannot be undone. This will permanently delete the project <strong>"{project.title}"</strong>
            &nbsp; from your portfolio.
          </>
        }
        cta={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default ProjectCard;
