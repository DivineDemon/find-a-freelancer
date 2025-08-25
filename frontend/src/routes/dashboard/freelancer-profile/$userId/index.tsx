import { createFileRoute, useParams } from "@tanstack/react-router";
import { Award, Calendar, Clock, ExternalLink, Github, Globe, Linkedin, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetFreelancerProfileUsersUserIdFreelancerProfileGetQuery,
  useGetUserUsersUserIdGetQuery,
} from "@/store/services/apis";

export const Route = createFileRoute("/dashboard/freelancer-profile/$userId/")({
  component: FreelancerProfilePage,
});

function FreelancerProfilePage() {
  const { userId } = useParams({
    from: "/dashboard/freelancer-profile/$userId/",
  });

  // Use RTK Query hooks to fetch data
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useGetUserUsersUserIdGetQuery({ userId: parseInt(userId) }, { skip: !userId });

  const {
    data: freelancerProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useGetFreelancerProfileUsersUserIdFreelancerProfileGetQuery({ userId: parseInt(userId) }, { skip: !userId });

  const isLoading = userLoading || profileLoading;
  const error = userError || profileError;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="mb-4 h-64 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error: {error instanceof Error ? error.message : "An error occurred"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userData || !freelancerProfile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-600">
              <p>Freelancer profile not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="mb-6 flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={userData.profile_picture || undefined} />
            <AvatarFallback className="text-2xl">
              {userData.first_name[0]}
              {userData.last_name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="mb-2 font-bold text-3xl text-gray-900">
              {userData.first_name} {userData.last_name}
            </h1>
            <h2 className="mb-2 text-gray-600 text-xl">{freelancerProfile.title}</h2>
            <div className="flex items-center gap-4 text-gray-500 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {freelancerProfile.country}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Member since {new Date(userData.created_at).getFullYear()}
              </div>
            </div>
          </div>

          <div className="text-right">
            <Badge variant={freelancerProfile.is_available ? "default" : "secondary"} className="mb-2">
              {freelancerProfile.is_available ? "Available" : "Not Available"}
            </Badge>
            <div className="font-bold text-2xl text-green-600">${freelancerProfile.hourly_rate}/hr</div>
          </div>
        </div>

        {freelancerProfile.bio && <p className="text-gray-700 text-lg leading-relaxed">{freelancerProfile.bio}</p>}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Experience & Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Experience & Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{freelancerProfile.years_of_experience} years of experience</span>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {freelancerProfile.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {freelancerProfile.technologies.map((tech: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Projects */}
          {freelancerProfile.projects && freelancerProfile.projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {freelancerProfile.projects.map((project) => (
                    <div key={project.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="font-medium">{project.title}</h4>
                        <div className="text-right text-sm">
                          <div className="font-medium text-green-600">${project.earned.toLocaleString()}</div>
                          {project.time_taken && <div className="text-gray-500">{project.time_taken}</div>}
                        </div>
                      </div>

                      {project.description && <p className="mb-3 text-gray-600 text-sm">{project.description}</p>}

                      {project.url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={project.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Project
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">Email:</span>
                <span className="text-sm">{userData.email}</span>
              </div>
              {userData.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Phone:</span>
                  <span className="text-sm">{userData.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {freelancerProfile.portfolio_url && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={freelancerProfile.portfolio_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="mr-2 h-4 w-4" />
                    Portfolio
                  </a>
                </Button>
              )}

              {freelancerProfile.github_url && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={freelancerProfile.github_url} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              )}

              {freelancerProfile.linkedin_url && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={freelancerProfile.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Status</span>
                <Badge variant={userData.is_active ? "default" : "destructive"}>
                  {userData.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">User Type</span>
                <Badge variant="outline" className="capitalize">
                  {userData.user_type.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
