import { createFileRoute } from "@tanstack/react-router";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { requireAuth } from "@/lib/route-guard";

export const Route = createFileRoute("/dashboard/chat-history")({
  component: Chats,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function Chats() {
  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5">
        <div className="flex w-full flex-col items-center justify-center gap-2">
          <span className="w-full text-left font-bold text-[30px] leading-[30px]">Chats</span>
          <span className="w-full text-left text-[16px] text-muted-foreground leading-[16px]">Manage your chats</span>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
