import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowUpRight } from "lucide-react";
import type { ProjectSummary } from "@/store/services/apis";

interface ProjectCardProps {
  project: ProjectSummary;
}

function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="flex flex-col items-start justify-start gap-2 rounded-lg border bg-card shadow">
      <div className="relative w-full">
        <img src={project.cover_image ?? ""} alt="project-cover" className="size-full rounded-t-lg object-cover" />
        <span className="absolute top-2.5 right-2.5 rounded-md bg-green-500 px-4 py-1.5 text-[14px] text-white leading-[14px]">
          {project.earned} USD
        </span>
        <span className="absolute top-10 right-2.5 rounded-md bg-orange-500 px-4 py-1.5 text-[14px] text-white leading-[14px]">
          {project.time_taken}
        </span>
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
    </div>
  );
}

export default ProjectCard;
