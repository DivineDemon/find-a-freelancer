import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import type { RootState } from "@/store";

interface RoleRouterProps {
  children: React.ReactNode;
}

function RoleRouter({ children }: RoleRouterProps) {
  const navigate = useNavigate();
  const { user, access_token } = useSelector((state: RootState) => state.global);

  useEffect(() => {
    const currentPath = window.location.pathname;

    if (!access_token || !user) {
      if (currentPath !== "/") {
        toast.error("Please Login to Access Resources");
        navigate({ to: "/" });
      }
      return;
    }

    if (user.user_type === "freelancer") {
      if (currentPath.startsWith("/dashboard") || currentPath.startsWith("/chat")) {
        if (currentPath === "/dashboard" || currentPath === "/dashboard/") {
          navigate({ to: "/freelancer" });
        } else if (currentPath.startsWith("/dashboard/chat-history")) {
          navigate({ to: "/freelancer/chat-history" });
        } else if (currentPath.startsWith("/dashboard/freelancer-profile")) {
          navigate({ to: "/freelancer" });
        } else if (currentPath.startsWith("/chat/")) {
          const freelancerId = currentPath.split("/chat/")[1];
          navigate({ to: `/freelancer/chat/${freelancerId}` });
        }
      }
    } else if (user.user_type === "client_hunter") {
      if (
        currentPath.startsWith("/dashboard") ||
        currentPath.startsWith("/chat") ||
        currentPath.startsWith("/freelancer")
      ) {
        if (currentPath === "/dashboard" || currentPath === "/dashboard/") {
          navigate({ to: "/client-hunter" });
        } else if (currentPath.startsWith("/dashboard/chat-history")) {
          navigate({ to: "/client-hunter/chat-history" });
        } else if (currentPath.startsWith("/dashboard/freelancer-profile")) {
          const userId = currentPath.split("/dashboard/freelancer-profile/")[1];
          navigate({ to: `/client-hunter/freelancer/${userId}` });
        } else if (currentPath.startsWith("/chat/")) {
          const freelancerId = currentPath.split("/chat/")[1];
          navigate({ to: `/client-hunter/chat/${freelancerId}` });
        } else if (currentPath === "/freelancer" || currentPath === "/freelancer/") {
          navigate({ to: "/client-hunter" });
        } else if (currentPath.startsWith("/freelancer/chat-history")) {
          navigate({ to: "/client-hunter/chat-history" });
        } else if (currentPath.startsWith("/freelancer/chat/")) {
          const clientHunterId = currentPath.split("/freelancer/chat/")[1];
          navigate({ to: `/client-hunter/chat/${clientHunterId}` });
        }
      }
    }
  }, [user, navigate, access_token]);

  return <>{children}</>;
}

export default RoleRouter;
