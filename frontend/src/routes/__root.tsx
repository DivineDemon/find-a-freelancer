import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Navbar from "@/components/navbar";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/";

  return (
    <div className="flex h-screen w-full flex-col items-start justify-start overflow-hidden">
      {!isAuthPage && <Navbar />}
      <div className={`w-full ${isAuthPage ? "h-full" : "h-[calc(100vh-64px)]"}`}>
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </div>
  );
}
