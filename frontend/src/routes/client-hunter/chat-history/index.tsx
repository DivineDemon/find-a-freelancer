import { createFileRoute } from "@tanstack/react-router";
import { Archive, ArchiveRestore, CircleX, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import ChatListItem from "@/components/chat/chat-list-item";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { requireAuth } from "@/lib/route-guard";
import type { RootState } from "@/store";
import { useListUserChatsChatsGetQuery } from "@/store/services/apis";

export const Route = createFileRoute("/client-hunter/chat-history/")({
  component: ClientHunterChatHistory,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function ClientHunterChatHistory() {
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const { user } = useSelector((state: RootState) => state.global);

  const {
    data: chatsData,
    isLoading,
    error,
  } = useListUserChatsChatsGetQuery({
    page,
    size: 20,
    isArchivedByInitiator: showArchived ? true : false,
    isArchivedByParticipant: showArchived ? true : false,
  });

  const filteredChats =
    chatsData?.chats.filter((chat) => {
      if (!searchQuery) return true;

      const isInitiator = chat.initiator_id === user?.user_id;
      const otherUserName = isInitiator ? chat.participant_name : chat.initiator_name;

      return (
        otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.project_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.project_description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }) || [];

  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5">
          <div className="flex w-full flex-col items-center justify-center gap-2">
            <span className="w-full text-left font-bold text-[30px] leading-[30px]">Chats</span>
            <span className="w-full text-left text-[16px] text-muted-foreground leading-[16px]">Manage your chats</span>
          </div>
          <div className="flex h-full w-full flex-col items-center justify-center">
            <Loader2 className="size-20 animate-spin" />
          </div>
        </MaxWidthWrapper>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100dvh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5">
          <div className="flex w-full flex-col items-center justify-center gap-2">
            <span className="w-full text-left font-bold text-[30px] leading-[30px]">Chats</span>
            <span className="w-full text-left text-[16px] text-muted-foreground leading-[16px]">Manage your chats</span>
          </div>
          <div className="flex h-full w-full flex-col items-center justify-center">
            <CircleX className="mb-5 size-20 text-destructive" />
            <span className="font-semibold text-xl">Error loading chats</span>
            <span className="font-medium text-muted-foreground">Please try again later.</span>
          </div>
        </MaxWidthWrapper>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-64px)] w-full">
      <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5">
        <div className="flex w-full flex-col items-center justify-center gap-2">
          <span className="w-full text-left font-bold text-[30px] leading-[30px]">Chats</span>
          <span className="w-full text-left text-[16px] text-muted-foreground leading-[16px]">Manage your chats</span>
        </div>
        <div className="flex w-full items-center gap-2">
          <div className="flex flex-1 items-center justify-center gap-2.5 rounded-lg border bg-muted pl-4 shadow">
            <Search className="size-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-none bg-transparent shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant={showArchived ? "default" : "outline"}
                size="icon"
                onClick={() => setShowArchived(!showArchived)}
                className="size-10"
              >
                {showArchived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show Archived Chats</TooltipContent>
          </Tooltip>
        </div>
        {filteredChats.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <CircleX className="mb-5 size-20 text-destructive" />
            <span className="font-semibold text-xl">
              {searchQuery ? "No chats found" : showArchived ? "No archived chats" : "No chats found"}
            </span>
            <span className="font-medium text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search terms."
                : showArchived
                  ? "Archive chats to see them here."
                  : "Initiate a chat to get started."}
            </span>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3 border-t">
            {filteredChats.map((chat) => (
              <ChatListItem key={chat.id} chat={chat} />
            ))}
            {chatsData && chatsData.has_next && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => setPage((prev) => prev + 1)} disabled={isLoading}>
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </MaxWidthWrapper>
    </div>
  );
}
