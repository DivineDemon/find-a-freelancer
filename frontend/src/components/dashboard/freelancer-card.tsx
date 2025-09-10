import { Link, useNavigate } from "@tanstack/react-router";
import { MessageCircleMore } from "lucide-react";
import { hasUserPaid, triggerPaymentModal } from "@/lib/route-guard";
import { cn } from "@/lib/utils";
import type { DashboardFreelancerResponse } from "@/store/services/apis";
import { Button, buttonVariants } from "../ui/button";

interface FreelancerCardProps {
  freelancer: DashboardFreelancerResponse;
}

function FreelancerCard({ freelancer }: FreelancerCardProps) {
  const navigate = useNavigate();

  const handleChatClick = () => {
    if (!hasUserPaid()) {
      triggerPaymentModal();
    } else {
      navigate({
        to: "/chat/$freelancerId",
        params: { freelancerId: `${freelancer.user_id}` },
      });
    }
  };

  return (
    <div className="flex h-fit w-full flex-col gap-5 rounded-lg border bg-card p-5 shadow">
      <div className="flex w-full items-center justify-center gap-5">
        <div className="flex flex-1 items-center justify-center gap-2.5">
          <img
            src={freelancer.freelancer_image ?? ""}
            alt="freelancer-image"
            className="size-10 shrink-0 rounded-full object-cover"
          />
          <div className="flex w-full flex-col items-center justify-center gap-2">
            <span className="w-full text-left font-bold text-[16px] leading-[16px]">
              {freelancer.freelancer_first_name} {freelancer.freelancer_last_name}
            </span>
            <span className="w-full text-left text-[14px] text-muted-foreground leading-[14px]">
              {freelancer.freelancer_position}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end justify-center gap-2">
          <span className="rounded-md bg-green-500/20 px-2 py-1 text-[12px] text-green-500 leading-[12px]">
            ${freelancer.freelancer_rate}/hr
          </span>
          <span className="rounded-md bg-orange-500/20 px-2 py-1 text-[12px] text-orange-500 leading-[12px]">
            {freelancer.freelancer_experience} yrs.
          </span>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-start justify-start gap-2">
        {freelancer.skills.slice(0, 6).map((skill) => (
          <span key={skill} className="rounded-md bg-primary/20 px-2 py-1 text-[12px] text-primary leading-[12px]">
            {skill}
          </span>
        ))}
        <span className="rounded-md bg-primary/20 px-2 py-1 text-[12px] text-primary leading-[12px]">
          +{freelancer.skills.length - 6}&nbsp;more
        </span>
      </div>
      <div className="flex w-full items-end justify-end gap-2">
        <Link
          to="/dashboard/freelancer-profile/$userId"
          params={{ userId: `${freelancer.user_id}` }}
          className={cn(buttonVariants({ size: "sm", variant: "default" }))}
        >
          Visit Profile
        </Link>
        <Button size="sm" variant="default" onClick={handleChatClick}>
          <MessageCircleMore />
          Chat
        </Button>
      </div>
    </div>
  );
}

export default FreelancerCard;
