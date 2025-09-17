import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, MessageSquare, User2 } from "lucide-react";
import { useSelector } from "react-redux";
import Logo from "@/assets/img/logo.png";
import type { RootState } from "@/store";
import MaxWidthWrapper from "./max-width-wrapper";
import ModeToggle from "./mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

function Navbar() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.global);

  const logout = () => {
    localStorage.clear();
    navigate({ to: "/" });
  };

  const getDashboardLink = () => {
    if (user?.user_type === "freelancer") {
      return "/freelancer";
    }
    return "/client-hunter";
  };

  const getChatHistoryLink = () => {
    if (user?.user_type === "freelancer") {
      return "/freelancer/chat-history";
    }
    return "/client-hunter/chat-history";
  };

  const getProfileLink = () => {
    if (user?.user_type === "freelancer") {
      return "/freelancer";
    }
    return "/client-hunter/profile";
  };

  return (
    <nav className="h-16 w-full border-b py-3">
      <MaxWidthWrapper className="flex items-center justify-between">
        <Link to={getDashboardLink()}>
          <img src={Logo} alt="logo-img" className="size-9 rounded-md" />
        </Link>
        <div className="flex items-center justify-center gap-2.5">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="bg-muted">
                <AvatarImage alt="profile-picture" src={user?.image_url ?? ""} />
                <AvatarFallback className="p-2">
                  {user ? (
                    <span className="font-medium text-sm">
                      {user.first_name?.[0]}
                      {user.last_name?.[0]}
                    </span>
                  ) : (
                    <User2 />
                  )}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link to={getProfileLink()} className="flex items-center gap-2">
                  <User2 />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to={getChatHistoryLink()} className="flex items-center gap-2">
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
