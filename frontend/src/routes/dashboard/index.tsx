import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Loader2, Search } from "lucide-react";
import { useState } from "react";
import NewChatDialog from "@/components/chat/new-chat-dialog";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/route-guard";
import { useGetCurrentUserProfileAuthMeGetQuery, useListUsersUsersGetQuery } from "@/store/services/apis";

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

  const { data: currentUser } = useGetCurrentUserProfileAuthMeGetQuery();
  const { data: usersData, isLoading } = useListUsersUsersGetQuery({
    userType: currentUser?.user_type === "client_hunter" ? "freelancer" : undefined,
    isActive: isActive,
    skip: currentPage * pageSize,
    limit: pageSize,
  });

  if (isLoading) {
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
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter freelancers by price, experience, and skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {/* Price Range Filter */}
                <div className="flex items-center gap-2">
                  <label className="font-medium text-muted-foreground text-sm">Price Range:</label>
                  <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">All Prices</option>
                    <option value="0-25">$0 - $25/hr</option>
                    <option value="25-50">$25 - $50/hr</option>
                    <option value="50-100">$50 - $100/hr</option>
                    <option value="100+">$100+/hr</option>
                  </select>
                </div>

                {/* Experience Range Filter */}
                <div className="flex items-center gap-2">
                  <label className="font-medium text-muted-foreground text-sm">Experience:</label>
                  <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">All Experience</option>
                    <option value="0-2">0-2 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>

                {/* Skills Filter */}
                <div className="flex items-center gap-2">
                  <label className="font-medium text-muted-foreground text-sm">Skills:</label>
                  <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">All Skills</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="react">React</option>
                    <option value="nodejs">Node.js</option>
                    <option value="design">UI/UX Design</option>
                    <option value="writing">Content Writing</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {users.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-semibold text-lg">No users found</h3>
                  <p className="text-center text-muted-foreground">Try adjusting your search criteria or filters.</p>
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
                      disabled={currentPage === 0}
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
                      disabled={usersData.length < pageSize}
                    >
                      Next
                    </Button>
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
