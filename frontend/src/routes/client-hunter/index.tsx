import { createFileRoute } from "@tanstack/react-router";
import { Filter, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import FilterSheet from "@/components/dashboard/filter-sheet";
import FreelancerCard from "@/components/dashboard/freelancer-card";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/route-guard";
import { type DashboardFreelancerResponse, useGetAllFreelancersFreelancerAllGetQuery } from "@/store/services/apis";

export const Route = createFileRoute("/client-hunter/")({
  component: ClientHunterDashboard,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function ClientHunterDashboard() {
  const [filters, setFilters] = useState<{
    skills: string[];
    minHourlyRate: number;
    maxHourlyRate: number;
    minExperience: number;
    maxExperience: number;
  }>({
    minHourlyRate: 0,
    maxHourlyRate: 0,
    minExperience: 0,
    maxExperience: 0,
    skills: [] as string[],
  });
  const [page, setPage] = useState<number>(1);
  const [open, setOpen] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [freelancers, setFreelancers] = useState<DashboardFreelancerResponse[]>([]);

  const { data, isLoading } = useGetAllFreelancersFreelancerAllGetQuery({
    limit: 8,
    skip: (page - 1) * 8,
    minHourlyRate: filters.minHourlyRate || undefined,
    maxHourlyRate: filters.maxHourlyRate || undefined,
    minExperience: filters.minExperience || undefined,
    maxExperience: filters.maxExperience || undefined,
    skills: filters.skills.length > 0 ? filters.skills.join(",") : undefined,
  });

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

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setPage(1);
    setTotalPages(1);
    setFreelancers([]);
    setHasNextPage(true);
  };

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

  return (
    <>
      <div className="h-[calc(100vh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5">
          <div className="flex w-full items-center justify-center">
            <div className="flex flex-1 flex-col items-center justify-center gap-2">
              <span className="w-full text-left font-bold text-[30px] leading-[30px]">Discover</span>
              <span className="w-full text-left text-[16px] text-muted-foreground leading-[16px]">
                Find talented freelancers with ease.
              </span>
            </div>
            <Button
              variant={
                filters.skills.length > 0 ||
                filters.minHourlyRate > 0 ||
                filters.maxHourlyRate > 0 ||
                filters.minExperience > 0 ||
                filters.maxExperience > 0
                  ? "default"
                  : "secondary"
              }
              size="lg"
              onClick={() => setOpen(true)}
            >
              <Filter />
              Filters
            </Button>
          </div>
          {isLoading || freelancers.length === 0 ? (
            <div className="col-span-2 flex h-full w-full items-center justify-center">
              <Loader2 className="size-20 animate-spin" />
            </div>
          ) : (
            <div className="grid max-h-[calc(100vh-210px)] w-full grid-cols-2 items-start justify-start gap-5 overflow-y-auto">
              {freelancers?.map((freelancer) => (
                <FreelancerCard key={freelancer.freelancer_id} freelancer={freelancer} />
              ))}
            </div>
          )}
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
      <FilterSheet
        open={open}
        filters={filters}
        onOpenChange={setOpen}
        onApplyFilters={handleApplyFilters}
        onFiltersChange={handleFiltersChange}
      />
    </>
  );
}
