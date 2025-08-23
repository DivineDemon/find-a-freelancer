import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Filter, Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import NewChatDialog from "@/components/chat/new-chat-dialog";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAuth } from "@/lib/route-guard";
import {
  useGetCurrentUserProfileAuthMeGetQuery,
  useGetFilterOptionsUsersFiltersOptionsGetQuery,
  useListUsersUsersGetQuery,
} from "@/store/services/apis";

// Type for filter options response
type FilterOptions = {
  skills: string[];
  technologies: string[];
  work_types: string[];
  price_range: { min: number; max: number };
  experience_range: { min: number; max: number };
};

export const Route = createFileRoute("/dashboard/")({
  component: Index,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function Index() {
  const [isActive, _setIsActive] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);

  // Advanced filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 50]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [selectedWorkType, setSelectedWorkType] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: currentUser } = useGetCurrentUserProfileAuthMeGetQuery();
  const {
    data: filterOptions,
    isLoading: filterOptionsLoading,
    error: filterOptionsError,
  } = useGetFilterOptionsUsersFiltersOptionsGetQuery();

  // Initialize filter ranges when options are loaded
  useEffect(() => {
    if (filterOptions) {
      const options = filterOptions as FilterOptions;
      setPriceRange([options.price_range.min, options.price_range.max]);
      setExperienceRange([options.experience_range.min, options.experience_range.max]);
    }
  }, [filterOptions]);

  // Reset filters to default values
  const resetFilters = () => {
    if (filterOptions) {
      const options = filterOptions as FilterOptions;
      setPriceRange([options.price_range.min, options.price_range.max]);
      setExperienceRange([options.experience_range.min, options.experience_range.max]);
      setSelectedSkills([]);
      setSelectedTechnologies([]);
      setSelectedWorkType("");
      setSearchQuery("");
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, []);

  const { data: usersData, isLoading } = useListUsersUsersGetQuery({
    userType: currentUser?.user_type === "client_hunter" ? "freelancer" : undefined,
    isActive: isActive,
    skip: currentPage * pageSize,
    limit: pageSize,
    // Advanced filters
    searchQuery: searchQuery || undefined,
    minHourlyRate: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxHourlyRate: priceRange[1] < 1000 ? priceRange[1] : undefined,
    minExperience: experienceRange[0] > 0 ? experienceRange[0] : undefined,
    maxExperience: experienceRange[1] < 50 ? experienceRange[1] : undefined,
    skills: selectedSkills.length > 0 ? selectedSkills.join(",") : undefined,
    technologies: selectedTechnologies.length > 0 ? selectedTechnologies.join(",") : undefined,
    workType: selectedWorkType || undefined,
  });

  if (isLoading && currentPage === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="size-20 animate-spin" />
      </div>
    );
  }

  const users = usersData || [];

  return (
    <div className="flex h-full w-full flex-col items-start justify-start py-5">
      <MaxWidthWrapper>
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl">Discover</h1>
              <p className="text-muted-foreground">Find talented freelancers or connect with potential clients</p>
            </div>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Search & Filters</CardTitle>
                  <CardDescription>Find freelancers by skills, experience, and rates</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="mr-2 h-4 w-4" />
                    {showFilters ? "Hide" : "Show"} Filters
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, title, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <>
                  {filterOptionsError && (
                    <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3">
                      <p className="text-destructive text-sm">Error loading filter options. Using default values.</p>
                    </div>
                  )}
                  <div className="space-y-4 border-t pt-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {/* Price Range */}
                      <div className="space-y-2">
                        <Label className="font-medium text-sm">Hourly Rate Range</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                            className="w-20"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                            className="w-20"
                          />
                          <span className="text-muted-foreground text-xs">$/hr</span>
                        </div>
                      </div>

                      {/* Experience Range */}
                      <div className="space-y-2">
                        <Label className="font-medium text-sm">Experience Range</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={experienceRange[0]}
                            onChange={(e) => setExperienceRange([Number(e.target.value), experienceRange[1]])}
                            className="w-20"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={experienceRange[1]}
                            onChange={(e) => setExperienceRange([experienceRange[0], Number(e.target.value)])}
                            className="w-20"
                          />
                          <span className="text-muted-foreground text-xs">years</span>
                        </div>
                      </div>

                      {/* Work Type */}
                      <div className="space-y-2">
                        <Label className="font-medium text-sm">Work Type</Label>
                        <select
                          value={selectedWorkType}
                          onChange={(e) => setSelectedWorkType(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          disabled={filterOptionsLoading}
                        >
                          <option value="">All Work Types</option>
                          {filterOptionsLoading ? (
                            <option disabled>Loading...</option>
                          ) : (
                            filterOptions &&
                            (filterOptions as FilterOptions).work_types.map((type) => (
                              <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Skills and Technologies */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Skills */}
                      <div className="space-y-2">
                        <Label className="font-medium text-sm">Skills</Label>
                        <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                          {filterOptionsLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading skills...
                            </div>
                          ) : (
                            filterOptions &&
                            (filterOptions as FilterOptions).skills.map((skill) => (
                              <Badge
                                key={skill}
                                variant={selectedSkills.includes(skill) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-primary/10"
                                onClick={() => {
                                  setSelectedSkills((prev) =>
                                    prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
                                  );
                                }}
                              >
                                {skill}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Technologies */}
                      <div className="space-y-2">
                        <Label className="font-medium text-sm">Technologies</Label>
                        <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                          {filterOptionsLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading technologies...
                            </div>
                          ) : (
                            filterOptions &&
                            (filterOptions as FilterOptions).technologies.map((tech) => (
                              <Badge
                                key={tech}
                                variant={selectedTechnologies.includes(tech) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-primary/10"
                                onClick={() => {
                                  setSelectedTechnologies((prev) =>
                                    prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
                                  );
                                }}
                              >
                                {tech}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="font-semibold text-xl">Results</h2>
                {!isLoading && (
                  <span className="text-muted-foreground text-sm">
                    {users.length} {users.length === 1 ? "freelancer" : "freelancers"} found
                  </span>
                )}
              </div>
              {users.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <span>Page {currentPage + 1}</span>
                  <span>•</span>
                  <span>
                    Showing {Math.min(users.length, pageSize)} of {users.length}
                  </span>
                </div>
              )}
            </div>

            {users.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-semibold text-lg">
                    {searchQuery || selectedSkills.length > 0 || selectedTechnologies.length > 0 || selectedWorkType
                      ? "No freelancers match your criteria"
                      : "No users found"}
                  </h3>
                  <p className="text-center text-muted-foreground">
                    {searchQuery || selectedSkills.length > 0 || selectedTechnologies.length > 0 || selectedWorkType
                      ? "Try adjusting your search criteria or filters to find more freelancers."
                      : "Try adjusting your search criteria or filters."}
                  </p>
                  {(searchQuery ||
                    selectedSkills.length > 0 ||
                    selectedTechnologies.length > 0 ||
                    selectedWorkType) && (
                    <Button variant="outline" onClick={resetFilters} className="mt-4">
                      <X className="mr-2 h-4 w-4" />
                      Clear All Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => (
                    <Card
                      key={user.id}
                      className={`transition-colors ${
                        user.is_active ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                              <Briefcase className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <h3 className="font-semibold">
                                  {user.first_name} {user.last_name}
                                </h3>
                                {!user.is_active && (
                                  <Badge variant="destructive" className="text-xs">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <span
                                className={`inline-block rounded-full px-2 py-1 text-xs ${
                                  user.user_type === "freelancer"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {user.user_type.replace("_", " ")}
                              </span>
                            </div>
                          </div>

                          {currentUser?.user_type === "client_hunter" && localStorage.getItem("has_paid") !== "true" ? (
                            <p className="text-muted-foreground text-sm">Complete payment to view contact details</p>
                          ) : (
                            <p className="text-muted-foreground text-sm">{user.email}</p>
                          )}

                          <div className="space-y-2">
                            <p className="text-muted-foreground text-xs">
                              {user.user_type === "freelancer" ? "Available for projects" : "Can hire freelancers"}
                            </p>
                            <div className="space-y-2">
                              {currentUser?.user_type === "client_hunter" &&
                                user.user_type === "freelancer" &&
                                user.is_active && <NewChatDialog user={user} />}
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  if (user.is_active) {
                                    window.location.href = `/dashboard/freelancer-profile/${user.id}`;
                                  }
                                }}
                                disabled={!user.is_active}
                              >
                                View Profile
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {usersData && usersData.length >= pageSize && (
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                      disabled={currentPage === 0 || isLoading}
                    >
                      Previous
                    </Button>
                    <span className="text-muted-foreground text-sm">
                      Page {currentPage + 1} - Showing {users.length} users
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={usersData.length < pageSize || isLoading}
                    >
                      Next
                    </Button>
                    {isLoading && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
