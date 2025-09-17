import { createFileRoute } from "@tanstack/react-router";
import { Edit, Loader2, User2 } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAuth } from "@/lib/route-guard";
import type { RootState } from "@/store";

export const Route = createFileRoute("/client-hunter/profile/")({
  component: ClientHunterProfile,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function ClientHunterProfile() {
  const { user } = useSelector((state: RootState) => state.global);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    company_name: user?.company_name || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // TODO: Implement profile update API call
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      company_name: user?.company_name || "",
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="h-[calc(100vh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-center justify-center gap-5">
          <Loader2 className="size-20 animate-spin" />
        </MaxWidthWrapper>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <User2 className="size-8" />
            </div>
            <div>
              <h1 className="font-bold text-2xl">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your account information</p>
            </div>
          </div>
          <Button variant={isEditing ? "default" : "outline"} onClick={() => setIsEditing(!isEditing)}>
            <Edit className="mr-2 size-4" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <div className="grid w-full max-w-2xl gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
