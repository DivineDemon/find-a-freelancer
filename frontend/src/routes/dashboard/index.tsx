import { createFileRoute } from "@tanstack/react-router";
import { Filter, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import FreelancerCard from "@/components/dashboard/freelancer-card";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/route-guard";
import { type DashboardFreelancerResponse, useListUsersUsersGetQuery } from "@/store/services/apis";

export const Route = createFileRoute("/dashboard/")({
  component: Index,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function Index() {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [freelancers, setFreelancers] = useState<DashboardFreelancerResponse[]>([]);

  const { data, isLoading } = useListUsersUsersGetQuery({
    limit: 8,
    skip: (page - 1) * 8,
  });

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setFreelancers(data);
      } else {
        setFreelancers((prev) => [...prev, ...data]);
      }

      setHasNextPage(data.length === 8);

      if (data.length < 8) {
        setTotalPages(page);
        setHasNextPage(false);
      } else {
        setTotalPages(page + 1);
      }
    }
  }, [data, page]);

  const handleNextPage = () => {
    if (hasNextPage && !isLoading) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
      setFreelancers((prev) => prev.slice(0, page * 8));
      setHasNextPage(true);
      setTotalPages(page);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5">
        <div className="flex w-full items-center justify-center">
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <span className="w-full text-left font-bold text-[30px] leading-[30px]">Discover</span>
            <span className="w-full text-left text-[16px] text-muted-foreground leading-[16px]">
              Find talented freelancers or connect with potential clients
            </span>
          </div>
          <Button variant="secondary" size="lg">
            <Filter />
            Filters
          </Button>
        </div>
        <div className="grid max-h-[calc(100vh-234px)] w-full grid-cols-2 items-start justify-start gap-5 overflow-y-auto">
          {isLoading ? (
            <div className="col-span-2 flex h-full w-full items-center justify-center">
              <Loader2 className="size-20 animate-spin" />
            </div>
          ) : (
            freelancers?.map((freelancer) => <FreelancerCard key={freelancer.freelancer_id} freelancer={freelancer} />)
          )}
        </div>
        <div className="mt-auto flex w-full items-center justify-center">
          <span className="flex-1 text-left text-[14px] text-muted-foreground leading-[14px]">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center justify-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={handlePrevPage} disabled={page === 1 || isLoading}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" onClick={handleNextPage} disabled={!hasNextPage || isLoading}>
              Next
            </Button>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
