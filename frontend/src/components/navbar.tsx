import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, MessageSquare, User2 } from "lucide-react";
import Logo from "@/assets/img/logo.png";
import { useGetCurrentUserProfileAuthAuthMeGetQuery } from "@/store/services/apis";
import MaxWidthWrapper from "./max-width-wrapper";
import ModeToggle from "./mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

function Navbar() {
  const navigate = useNavigate();
  const { data: currentUser } = useGetCurrentUserProfileAuthAuthMeGetQuery();

  const logout = () => {
    localStorage.clear();
    navigate({ to: "/" });
  };

  return (
    <nav className="h-16 w-full border-b py-3">
      <MaxWidthWrapper className="flex items-center justify-between">
        <Link to="/dashboard">
          <img src={Logo} alt="logo-img" className="size-9" />
        </Link>
        <div className="flex items-center justify-center gap-2.5">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="bg-muted">
                <AvatarImage alt="profile-picture" src={currentUser?.profile_picture ?? ""} />
                <AvatarFallback className="p-2">
                  {currentUser ? (
                    <span className="font-medium text-sm">
                      {currentUser.first_name?.[0]}
                      {currentUser.last_name?.[0]}
                    </span>
                  ) : (
                    <User2 />
                  )}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link to="/dashboard/profile" className="flex items-center gap-2">
                  <User2 />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/dashboard/chat-history" className="flex items-center gap-2">
                  <MessageSquare />
                  Chat History
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={logout}>
                <LogOut />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
}

export default Navbar;
