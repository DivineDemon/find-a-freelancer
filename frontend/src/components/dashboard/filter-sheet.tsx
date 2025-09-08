import { Loader2, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useGetFilterOptionsUsersFiltersOptionsGetQuery } from "@/store/services/apis";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  filters: {
    skills: string[];
    minHourlyRate: number;
    maxHourlyRate: number;
    minExperience: number;
    maxExperience: number;
  };
  onFiltersChange: (filters: {
    skills: string[];
    minHourlyRate: number;
    maxHourlyRate: number;
    minExperience: number;
    maxExperience: number;
  }) => void;
  onApplyFilters: () => void;
}

function FilterSheet({ open, onOpenChange, filters, onFiltersChange, onApplyFilters }: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<{
    skills: string[];
    minHourlyRate: number;
    maxHourlyRate: number;
    minExperience: number;
    maxExperience: number;
  }>(filters);
  const { data, isLoading } = useGetFilterOptionsUsersFiltersOptionsGetQuery();

  const handleSkillToggle = (skill: string) => {
    const newSkills = localFilters.skills.includes(skill)
      ? localFilters.skills.filter((s) => s !== skill)
      : [...localFilters.skills, skill];

    setLocalFilters((prev) => ({ ...prev, skills: newSkills }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters = {
      skills: [],
      minHourlyRate: 0,
      maxHourlyRate: 0,
      minExperience: 0,
      maxExperience: 0,
    };

    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onApplyFilters();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0">
        <SheetHeader className="border-b">
          <SheetTitle>Filter Freelancers</SheetTitle>
          <SheetDescription>Filter freelancers by Hourly Rate, Experience, and Skills</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-start justify-start">
            <div className="flex h-[808px] w-full flex-col items-start justify-start gap-4 p-4">
              <div className="flex w-full flex-col items-center justify-center gap-2">
                <Label className="w-full text-left">Hourly Rate ($)</Label>
                <div className="flex w-full items-center justify-center gap-2.5">
                  <Input
                    type="number"
                    placeholder="Minimum"
                    value={localFilters.minHourlyRate || ""}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        minHourlyRate: Number(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="text-sm">-</span>
                  <Input
                    type="number"
                    placeholder="Maximum"
                    value={localFilters.maxHourlyRate || ""}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        maxHourlyRate: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex w-full flex-col items-center justify-center gap-2">
                <Label className="w-full text-left">Experience (years)</Label>
                <div className="flex w-full items-center justify-center gap-2.5">
                  <Input
                    type="number"
                    placeholder="Minimum"
                    value={localFilters.minExperience || ""}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        minExperience: Number(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="text-sm">-</span>
                  <Input
                    type="number"
                    placeholder="Maximum"
                    value={localFilters.maxExperience || ""}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        maxExperience: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex w-full flex-col items-center justify-center gap-2">
                <Label className="w-full text-left">Skills</Label>
                <div className="flex w-full flex-wrap items-start justify-start gap-2.5">
                  {data?.skills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant={localFilters.skills.includes(skill) ? "default" : "outline"}
                      className={cn("cursor-pointer", {
                        "hover:bg-muted": !localFilters.skills.includes(skill),
                        "hover:bg-primary/80": localFilters.skills.includes(skill),
                      })}
                      onClick={() => handleSkillToggle(skill)}
                    >
                      {skill}
                      {localFilters.skills.includes(skill) && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-auto flex w-full items-center justify-end gap-2.5 border-t p-4">
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button variant="default" onClick={handleApply}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default FilterSheet;
