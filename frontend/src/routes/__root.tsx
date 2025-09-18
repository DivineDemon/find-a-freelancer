import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Navbar from "@/components/navbar";
import RoleRouter from "@/components/role-router";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/";

  return (
    <RoleRouter>
      <div className="flex h-screen w-full flex-col items-start justify-start overflow-hidden">
        {!isAuthPage && <Navbar />}
        <div className={`w-full ${isAuthPage ? "h-full" : "h-[calc(100dvh-64px)]"}`}>
          <Outlet />
        </div>
        <TanStackRouterDevtools />
      </div>
    </RoleRouter>
  );
}
