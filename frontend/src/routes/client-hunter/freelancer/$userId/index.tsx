import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { Globe2, Loader2 } from "lucide-react";
import GithubDark from "@/assets/icons/github-dark.svg";
import GithubLight from "@/assets/icons/github-light.svg";
import Linkedin from "@/assets/icons/linkedin.svg";
import ProjectCard from "@/components/dashboard/project-card";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/route-guard";
import { cn } from "@/lib/utils";
import { useGetFreelancerFreelancerFreelancerIdGetQuery } from "@/store/services/apis";

export const Route = createFileRoute("/client-hunter/freelancer/$userId/")({
  component: ClientHunterFreelancerProfile,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function ClientHunterFreelancerProfile() {
  const { theme } = useTheme();
  const { userId } = Route.useParams();
  const { data, isLoading } = useGetFreelancerFreelancerFreelancerIdGetQuery(
    { freelancerId: parseInt(userId) },
    { skip: !userId, refetchOnMountOrArgChange: true },
  );

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="size-20 animate-spin" />
          </div>
        ) : (
          <div className="flex h-[calc(100vh-104px)] w-full flex-col items-start justify-start overflow-y-auto">
            <div className="relative h-72 w-full shrink-0 bg-gradient-to-tr from-blue-700 via-blue-800 to-gray-900">
              <img
                src={data?.profile_picture ?? ""}
                alt="profile-picture"
                className="-bottom-22 absolute left-10 size-44 rounded-full border-2 border-white object-cover shadow"
              />
            </div>
            <div className="flex w-full flex-col items-center justify-end gap-2 py-5 pl-60">
              <div className="flex w-full items-center justify-start gap-2 text-left font-bold text-[24px] text-white leading-[24px]">
                <div
                  className={cn("size-2 rounded-full", {
                    "bg-green-500": data?.is_active,
                    "bg-red-500": !data?.is_active,
                  })}
                >
                  <div
                    className={cn("size-full animate-ping rounded-full", {
                      "bg-green-500": data?.is_active,
                      "bg-red-500": !data?.is_active,
                    })}
                  />
                </div>
                <span>
                  {data?.first_name}&nbsp;{data?.last_name}
                </span>
                <Badge variant="default" className="h-full capitalize">
                  {data?.user_type.replace("_", " ")}
                </Badge>
              </div>
              <span className="w-full text-left font-medium text-[16px] text-muted-foreground leading-[16px]">
                {data?.freelancer_profile?.title}
              </span>
            </div>
            <div className="mt-10 grid w-full grid-cols-3 gap-5">
              <div className="col-span-1 flex h-fit flex-col items-start justify-start divide-y rounded-lg border bg-card shadow">
                <span className="w-full text-pretty p-5 text-left font-medium text-[16px] text-muted-foreground leading-[20px]">
                  {data?.freelancer_profile?.bio}
                </span>
                <div className="grid w-full grid-cols-2 p-5">
                  <span className="col-span-1 w-full text-left font-medium">Joined At</span>
                  <span className="col-span-1 w-full text-right text-muted-foreground">
                    {dayjs(data?.created_at).format("DD MMM YYYY")}
                  </span>
                </div>
                <div className="grid w-full grid-cols-2 p-5">
                  <span className="col-span-1 w-full text-left font-medium">Country</span>
                  <span className="col-span-1 w-full text-right text-muted-foreground">
                    {data?.freelancer_profile?.country}
                  </span>
                </div>
                <div className="grid w-full grid-cols-2 p-5">
                  <span className="col-span-1 w-full text-left font-medium">Experience</span>
                  <div className="col-span-1 flex w-full items-center justify-end">
                    <span className="rounded-md bg-orange-500/20 px-4 py-1.5 text-[14px] text-orange-500 leading-[14px]">
                      {data?.freelancer_profile?.years_of_experience} years
                    </span>
                  </div>
                </div>
                <div className="grid w-full grid-cols-2 p-5">
                  <span className="col-span-1 w-full text-left font-medium">Hourly Rate</span>
                  <div className="col-span-1 flex w-full items-center justify-end">
                    <span className="rounded-md bg-green-500/20 px-4 py-1.5 text-[14px] text-green-500 leading-[14px]">
                      {data?.freelancer_profile?.hourly_rate} USD
                    </span>
                  </div>
                </div>
                <div className="flex w-full flex-wrap items-start justify-start gap-2 p-5">
                  {data?.freelancer_profile?.skills.map((skill, idx) => (
                    <Badge key={idx} variant="default">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="flex w-full items-center justify-start gap-5 border-b p-5">
                  <img src={theme === "dark" ? GithubDark : GithubLight} alt="github" className="size-6" />
                  <Link to={data?.freelancer_profile?.github_url ?? ""} className="text-blue-500">
                    {data?.freelancer_profile?.github_url?.split("/")[3]}
                  </Link>
                </div>
                <div className="flex w-full items-center justify-start gap-5 border-b p-5">
                  <Globe2 className="size-6" />
                  <Link to={data?.freelancer_profile?.portfolio_url ?? ""} className="text-blue-500">
                    {data?.freelancer_profile?.portfolio_url}
                  </Link>
                </div>
                <div className="flex w-full items-center justify-start gap-5 border-b p-5">
                  <img src={Linkedin} alt="linkedin" className="size-6" />
                  <Link to={data?.freelancer_profile?.linkedin_url ?? ""} className="text-blue-500">
                    {data?.freelancer_profile?.linkedin_url?.split("/")[4]}
                  </Link>
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-2 items-start justify-start gap-5">
                {data?.projects?.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </div>
        )}
      </MaxWidthWrapper>
    </div>
  );
}
