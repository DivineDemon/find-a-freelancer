import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { Edit, Globe2, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import GithubDark from "@/assets/icons/github-dark.svg";
import GithubLight from "@/assets/icons/github-light.svg";
import Linkedin from "@/assets/icons/linkedin.svg";
import ProjectCard from "@/components/dashboard/project-card";
import ProfileSheet from "@/components/freelancer/profile-sheet";
import ProjectSheet from "@/components/freelancer/project-sheet";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/route-guard";
import { cn } from "@/lib/utils";
import type { RootState } from "@/store";
import { useGetFreelancerFreelancerFreelancerIdGetQuery } from "@/store/services/apis";

export const Route = createFileRoute("/freelancer/")({
  component: FreelancerDashboard,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function FreelancerDashboard() {
  const { theme } = useTheme();
  const [edit, setEdit] = useState<boolean>(false);
  const [addProject, setAddProject] = useState<boolean>(false);
  const { user } = useSelector((state: RootState) => state.global);

  const { data, isLoading, error } = useGetFreelancerFreelancerFreelancerIdGetQuery(
    { freelancerId: user?.user_id! },
    { skip: !user?.user_id, refetchOnMountOrArgChange: true },
  );

  return (
    <>
      <div className="h-[calc(100dvh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5 p-0">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="size-20 animate-spin" />
            </div>
          ) : error || !data ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
              <div className="font-semibold text-lg">Freelancer Profile Not Found</div>
              <div className="text-center text-muted-foreground">
                Please complete your freelancer profile before adding projects.
              </div>
              <Button onClick={() => setEdit(true)}>Complete Profile</Button>
            </div>
          ) : (
            <div className="flex h-[calc(100dvh-104px)] w-full flex-col items-start justify-start overflow-y-auto">
              <div className="relative h-48 w-full shrink-0 bg-gradient-to-tr from-blue-700 via-blue-800 to-gray-900 md:h-72">
                <img
                  src={data?.profile_picture ?? ""}
                  alt="profile-picture"
                  className="-bottom-12 md:-bottom-22 absolute left-5 size-24 rounded-full border-2 border-white object-cover shadow md:left-10 md:size-44"
                />
                <div className="absolute top-2.5 right-2.5 flex items-center justify-center gap-2 md:hidden">
                  <Button size="sm" variant="default" onClick={() => setAddProject(true)}>
                    <Plus />
                    Add Project
                  </Button>
                  <Button size="sm" variant="default" onClick={() => setEdit(true)}>
                    <Edit />
                    Edit Profile
                  </Button>
                </div>
              </div>
              <div className="flex w-full items-center justify-center py-2 pr-5 pl-32 md:py-5 md:pl-60">
                <div className="flex flex-1 flex-col items-center justify-end gap-1 md:gap-2">
                  <div className="flex w-full items-center justify-start gap-2 text-left font-bold text-[16px] text-white leading-[16px] md:text-[24px] md:leading-[24px]">
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
                  <span className="w-full text-left font-medium text-[14px] text-muted-foreground leading-[14px] md:text-[16px] md:leading-[16px]">
                    {data?.freelancer_profile?.title}
                  </span>
                </div>
                <div className="hidden items-center justify-center gap-2 md:flex">
                  <Button size="sm" variant="default" onClick={() => setAddProject(true)}>
                    <Plus />
                    Project
                  </Button>
                  <Button size="sm" variant="default" onClick={() => setEdit(true)}>
                    <Edit />
                    Profile
                  </Button>
                </div>
              </div>
              <div className="mt-0 grid w-full grid-cols-1 gap-5 p-5 md:mt-5 lg:grid-cols-3">
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
                <div className="col-span-1 grid grid-cols-1 items-start justify-start gap-5 md:col-span-2 md:grid-cols-2">
                  {data?.projects?.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            </div>
            // <div className="flex h-[calc(100dvh-104px)] w-full flex-col items-start justify-start overflow-y-auto">
            //   <div className="relative h-72 w-full shrink-0 bg-gradient-to-tr from-blue-700 via-blue-800 to-gray-900">
            //     <img
            //       src={data?.profile_picture ?? ""}
            //       alt="profile-picture"
            //       className="-bottom-22 absolute left-10 size-44 rounded-full border-2 border-white object-cover shadow"
            //     />
            //   </div>
            //   <div className="flex w-full items-center justify-center py-5 pl-60">
            //     <div className="flex flex-1 flex-col items-center justify-end gap-2">
            //       <div className="flex w-full items-center justify-start gap-2 text-left font-bold text-[24px] text-white leading-[24px]">
            //         <div
            //           className={cn("size-2 rounded-full", {
            //             "bg-green-500": data?.is_active,
            //             "bg-red-500": !data?.is_active,
            //           })}
            //         >
            //           <div
            //             className={cn("size-full animate-ping rounded-full", {
            //               "bg-green-500": data?.is_active,
            //               "bg-red-500": !data?.is_active,
            //             })}
            //           />
            //         </div>
            //         <span>
            //           {data?.first_name}&nbsp;{data?.last_name}
            //         </span>
            //         <Badge variant="default" className="h-full capitalize">
            //           {data?.user_type.replace("_", " ")}
            //         </Badge>
            //       </div>
            //       <span className="w-full text-left font-medium text-[16px] text-muted-foreground leading-[16px]">
            //         {data?.freelancer_profile?.title}
            //       </span>
            //     </div>
            //     <div className="flex items-center justify-center gap-2">
            //       <Button size="sm" variant="default" onClick={() => setAddProject(true)}>
            //         <Plus />
            //         Add Project
            //       </Button>
            //       <Button size="sm" variant="default" onClick={() => setEdit(true)}>
            //         <Edit />
            //         Edit Profile
            //       </Button>
            //     </div>
            //   </div>
            //   <div className="mt-10 grid w-full grid-cols-3 gap-5">
            //     <div className="col-span-1 flex h-fit flex-col items-start justify-start divide-y rounded-lg border bg-card shadow">
            //       <span className="w-full text-pretty p-5 text-left font-medium text-[16px] text-muted-foreground leading-[20px]">
            //         {data?.freelancer_profile?.bio}
            //       </span>
            //       <div className="grid w-full grid-cols-2 p-5">
            //         <span className="col-span-1 w-full text-left font-medium">Joined At</span>
            //         <span className="col-span-1 w-full text-right text-muted-foreground">
            //           {dayjs(data?.created_at).format("DD MMM YYYY")}
            //         </span>
            //       </div>
            //       <div className="grid w-full grid-cols-2 p-5">
            //         <span className="col-span-1 w-full text-left font-medium">Country</span>
            //         <span className="col-span-1 w-full text-right text-muted-foreground">
            //           {data?.freelancer_profile?.country}
            //         </span>
            //       </div>
            //       <div className="grid w-full grid-cols-2 p-5">
            //         <span className="col-span-1 w-full text-left font-medium">Experience</span>
            //         <div className="col-span-1 flex w-full items-center justify-end">
            //           <span className="rounded-md bg-orange-500/20 px-4 py-1.5 text-[14px] text-orange-500 leading-[14px]">
            //             {data?.freelancer_profile?.years_of_experience} years
            //           </span>
            //         </div>
            //       </div>
            //       <div className="grid w-full grid-cols-2 p-5">
            //         <span className="col-span-1 w-full text-left font-medium">Hourly Rate</span>
            //         <div className="col-span-1 flex w-full items-center justify-end">
            //           <span className="rounded-md bg-green-500/20 px-4 py-1.5 text-[14px] text-green-500 leading-[14px]">
            //             {data?.freelancer_profile?.hourly_rate} USD
            //           </span>
            //         </div>
            //       </div>
            //       <div className="flex w-full flex-wrap items-start justify-start gap-2 p-5">
            //         {data?.freelancer_profile?.skills.map((skill, idx) => (
            //           <Badge key={idx} variant="default">
            //             {skill}
            //           </Badge>
            //         ))}
            //       </div>
            //       <div className="flex w-full items-center justify-start gap-5 p-5">
            //         <img src={theme === "dark" ? GithubDark : GithubLight} alt="github" className="size-6" />
            //         <Link to={data?.freelancer_profile?.github_url ?? ""} target="_blank" className="text-blue-500">
            //           {data?.freelancer_profile?.github_url?.split("/")[3]}
            //         </Link>
            //       </div>
            //       <div className="flex w-full items-center justify-start gap-5 p-5">
            //         <Globe2 className="size-6" />
            //         <Link to={data?.freelancer_profile?.portfolio_url ?? ""} target="_blank" className="text-blue-500">
            //           {data?.freelancer_profile?.portfolio_url}
            //         </Link>
            //       </div>
            //       <div className="flex w-full items-center justify-start gap-5 p-5">
            //         <img src={Linkedin} alt="linkedin" className="size-6" />
            //         <Link to={data?.freelancer_profile?.linkedin_url ?? ""} target="_blank" className="text-blue-500">
            //           {data?.freelancer_profile?.linkedin_url?.split("/")[4]}
            //         </Link>
            //       </div>
            //     </div>
            //     <div className="col-span-2 grid grid-cols-2 items-start justify-start gap-5">
            //       {data?.projects?.map((project) => (
            //         <ProjectCard key={project.id} project={project} />
            //       ))}
            //     </div>
            //   </div>
            // </div>
          )}
        </MaxWidthWrapper>
      </div>
      <ProfileSheet open={edit} onOpenChange={setEdit} initialData={data} />
      <ProjectSheet open={addProject} onOpenChange={setAddProject} />
    </>
  );
}
