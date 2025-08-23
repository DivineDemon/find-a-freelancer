import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Star,
  User,
} from "lucide-react";
import { useState } from "react";
import NewChatDialog from "@/components/chat/new-chat-dialog";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAuth } from "@/lib/route-guard";
import {
  useGetFreelancerProfileUsersUserIdFreelancerProfileGetQuery,
  useGetUserUsersUserIdGetQuery,
} from "@/store/services/apis";

export const Route = createFileRoute("/dashboard/freelancer-profile/$userId/")({
  beforeLoad: requireAuth,
  component: FreelancerProfilePage,
});

function FreelancerProfilePage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const [currentUser] = useState(() => {
    const userType = localStorage.getItem("user_type");
    const hasPaid = localStorage.getItem("has_paid") === "true";
    return { userType, hasPaid };
  });

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useGetUserUsersUserIdGetQuery({
    userId: parseInt(userId),
  });

  const {
    data: freelancerProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useGetFreelancerProfileUsersUserIdFreelancerProfileGetQuery({
    userId: parseInt(userId),
  });

  const isLoading = userLoading || profileLoading;
  const error = userError || profileError;
  const freelancer = userData;

  if (isLoading) {
    return (
      <MaxWidthWrapper>
        <div className="py-8">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-primary border-b-2"></div>
            <p className="mt-4 text-muted-foreground">Loading freelancer profile...</p>
          </div>
        </div>
      </MaxWidthWrapper>
    );
  }

  if (error || !freelancer) {
    return (
      <MaxWidthWrapper>
        <div className="py-8">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Freelancer not found or error loading profile.</p>
          </div>
        </div>
      </MaxWidthWrapper>
    );
  }

  return (
    <MaxWidthWrapper>
      <div className="py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage alt="profile-picture" src={freelancer.profile_picture || ""} />
                <AvatarFallback className="text-3xl">
                  {freelancer.first_name?.[0]}
                  {freelancer.last_name?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div>
                      <h1 className="mb-2 font-bold text-4xl">
                        {freelancer.first_name} {freelancer.last_name}
                      </h1>
                      <p className="text-muted-foreground text-xl">{freelancerProfile?.title || "Freelancer"}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="text-sm">
                        <Briefcase className="mr-1 h-3 w-3" />
                        {freelancer.user_type.replace("_", " ")}
                      </Badge>
                      <Badge variant={freelancer.is_active ? "default" : "destructive"} className="text-sm">
                        {freelancer.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {freelancerProfile?.is_available && (
                        <Badge variant="outline" className="text-green-600 text-sm">
                          <Clock className="mr-1 h-3 w-3" />
                          Available
                        </Badge>
                      )}
                    </div>

                    {freelancerProfile?.rating && freelancerProfile.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 font-medium">{freelancerProfile.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-muted-foreground text-sm">
                          ({freelancerProfile.total_reviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    {currentUser.userType === "client_hunter" && freelancer.user_type === "freelancer" && (
                      <NewChatDialog user={freelancer} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{freelancerProfile?.bio || "No bio available."}</p>
              </CardContent>
            </Card>

            {/* Skills & Technologies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Skills & Technologies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {freelancerProfile?.skills && freelancerProfile.skills.length > 0 ? (
                  <div>
                    <h4 className="mb-2 font-medium text-sm">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {freelancerProfile.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {freelancerProfile?.technologies && freelancerProfile.technologies.length > 0 ? (
                  <div>
                    <h4 className="mb-2 font-medium text-sm">Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {freelancerProfile.technologies.map((tech: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {!freelancerProfile?.skills?.length && !freelancerProfile?.technologies?.length && (
                  <p className="text-muted-foreground">No skills or technologies listed.</p>
                )}
              </CardContent>
            </Card>

            {/* Experience & Portfolio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Experience & Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {freelancerProfile?.years_of_experience ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {freelancerProfile.years_of_experience} years of professional experience
                    </span>
                  </div>
                ) : null}

                {freelancerProfile?.portfolio_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={freelancerProfile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      Portfolio Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {freelancerProfile?.github_url && (
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={freelancerProfile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      GitHub Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {freelancerProfile?.linkedin_url && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={freelancerProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      LinkedIn Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Work Preferences */}
            {freelancerProfile?.preferred_work_type && freelancerProfile.preferred_work_type.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Work Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="mb-2 font-medium text-sm">Preferred Work Type</h4>
                      <div className="flex flex-wrap gap-2">
                        {freelancerProfile.preferred_work_type.map((type: string, index: number) => (
                          <Badge key={index} variant="outline" className="capitalize">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {freelancerProfile?.timezone && (
                      <div>
                        <h4 className="mb-1 font-medium text-sm">Timezone</h4>
                        <p className="text-muted-foreground text-sm">{freelancerProfile.timezone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {freelancerProfile?.hourly_rate ? (
                  <div className="text-center">
                    <div className="font-bold text-3xl text-primary">${freelancerProfile.hourly_rate}</div>
                    <p className="text-muted-foreground text-sm">per hour</p>
                  </div>
                ) : null}

                {freelancerProfile?.daily_rate ? (
                  <div>
                    <Separator />
                    <div className="text-center">
                      <div className="font-bold text-2xl text-primary">${freelancerProfile.daily_rate}</div>
                      <p className="text-muted-foreground text-sm">per day</p>
                    </div>
                  </div>
                ) : null}

                {!freelancerProfile?.hourly_rate && !freelancerProfile?.daily_rate && (
                  <p className="text-center text-muted-foreground">Pricing not specified.</p>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            {currentUser.userType === "client_hunter" && currentUser.hasPaid ? (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="font-medium text-muted-foreground text-sm">Email</label>
                    <p className="text-sm">{freelancer.email}</p>
                  </div>
                </CardContent>
              </Card>
            ) : currentUser.userType === "client_hunter" && !currentUser.hasPaid ? (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="py-4 text-center">
                    <div className="mb-2 text-4xl">🔒</div>
                    <p className="mb-3 text-muted-foreground text-sm">Complete payment to view contact details</p>
                    <Button onClick={() => navigate({ to: "/dashboard" })} className="w-full">
                      Complete Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Status</span>
                  <Badge variant={freelancer.is_active ? "default" : "destructive"}>
                    {freelancer.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Verified</span>
                  <Badge variant={freelancerProfile?.is_verified ? "default" : "secondary"}>
                    {freelancerProfile?.is_verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Member Since</span>
                  <span className="text-sm">N/A</span>
                </div>
                {freelancerProfile?.rating && freelancerProfile.rating > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{freelancerProfile.rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
