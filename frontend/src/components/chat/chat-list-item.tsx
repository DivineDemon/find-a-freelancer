import { Link } from "@tanstack/react-router";
import { Archive, ArchiveRestore } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { RootState } from "@/store";
import {
  type ChatWithParticipants,
  useToggleChatArchiveChatsChatIdToggleArchivePatchMutation,
} from "@/store/services/apis";

interface ChatListItemProps {
  chat: ChatWithParticipants;
}

function ChatListItem({ chat }: ChatListItemProps) {
  const otherUserAvatar = "";
  const otherUserPosition = "";
  const { user } = useSelector((state: RootState) => state.global);

  const isInitiator = chat.initiator_id === user.user_id;
  const otherUserName = isInitiator ? chat.participant_name : chat.initiator_name;
  const isArchived = isInitiator ? chat.is_archived_by_initiator : chat.is_archived_by_participant;

  const [toggleArchive, { isLoading: isToggling }] = useToggleChatArchiveChatsChatIdToggleArchivePatchMutation();

  const handleArchiveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await toggleArchive({ chatId: chat.id }).unwrap();
      const action = isArchived ? "unarchived" : "archived";
      toast.success(`Chat ${action} successfully`);
    } catch (_error) {
      toast.error("Failed to update chat status");
    }
  };

  const formatLastMessageTime = (dateString: string | null) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getChatLink = () => {
    if (user?.user_type === "freelancer") {
      return "/freelancer/chat/$clientHunterId";
    }
    return "/client-hunter/chat/$freelancerId";
  };

  const getParams = () => {
    const userId = `${isInitiator ? chat.participant_id : chat.initiator_id}`;
    if (user?.user_type === "freelancer") {
      return { clientHunterId: userId };
    }
    return { freelancerId: userId };
  };

  return (
    <Link to={getChatLink()} params={getParams()} className="block">
      <div className="flex w-full items-center gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50">
        <div className="relative">
          <Avatar className="size-12">
            <AvatarImage src={otherUserAvatar} alt={otherUserName} />
            <AvatarFallback className="text-sm">
              {otherUserName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="-bottom-1 -right-1 absolute size-4 rounded-full border-2 border-background bg-green-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-[16px] leading-[16px]">{otherUserName}</h3>
              {isArchived && (
                <span className="rounded-md bg-orange-500/20 px-2 py-1 text-[10px] text-orange-500 leading-[10px]">
                  Archived
                </span>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground leading-[12px]">
              {formatLastMessageTime(chat.last_message_at)}
            </span>
          </div>
          <p className="mt-1 truncate text-muted-foreground text-xs">{otherUserPosition}</p>
          {chat.project_title && <p className="mt-1 truncate font-medium text-primary text-xs">{chat.project_title}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={handleArchiveToggle} disabled={isToggling} className="size-8">
          {isArchived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
        </Button>
      </div>
    </Link>
  );
}

export default ChatListItem;
