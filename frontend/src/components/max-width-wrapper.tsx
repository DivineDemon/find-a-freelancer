import { cn } from "@/lib/utils";

interface MaxWidthWrapperProps {
  className?: string;
  children: React.ReactNode;
}

function MaxWidthWrapper({ className, children }: MaxWidthWrapperProps) {
  return <div className={cn("mx-auto h-full w-full max-w-screen-xl p-5", className)}>{children}</div>;
}

export default MaxWidthWrapper;
