import { createFileRoute } from "@tanstack/react-router";
import { Image, Send, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { type ProjectDetails, ProjectDetailsDialog } from "@/components/chat/project-details-dialog";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/hooks/use-web-socket";
import { cn } from "@/lib/utils";
import type { RootState } from "@/store";
import {
  type MessageWithSender,
  useCreateChatChatsPostMutation,
  useGetUserUsersUserIdGetQuery,
  useListUserChatsChatsGetQuery,
} from "@/store/services/apis";

export const Route = createFileRoute("/chat/$freelancerId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { freelancerId } = Route.useParams();
  const [messageInput, setMessageInput] = useState("");
  const lastTempMessageId = useRef<number | null>(null);
  const [chatId, setChatId] = useState<number | null>(null);
  const { user } = useSelector((state: RootState) => state.global);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [createChat, { isLoading: isCreatingChat }] = useCreateChatChatsPostMutation();

  const { data: freelancerData, isLoading: isLoadingFreelancer } = useGetUserUsersUserIdGetQuery(
    { userId: Number(freelancerId) },
    { skip: !freelancerId },
  );

  const { data: userChats, isLoading: isLoadingChats } = useListUserChatsChatsGetQuery(
    { page: 1, size: 100 },
    { skip: !freelancerId },
  );

  const {
    connectionStatus,
    isConnected,
    sendMessage: sendWebSocketMessage,
    requestChatHistory,
  } = useWebSocket({
    chatId: chatId?.toString() || "",
    onMessage: (messageData) => {
      const transformedMessage: MessageWithSender = {
        ...messageData,
        updated_at: messageData.created_at,
        sender_type: "freelancer" as const,
        sender_avatar: messageData.sender_avatar ?? null,
      };

      if (messageData.sender_id === user?.user_id) {
        setMessages((prev) => {
          const filteredMessages = prev.filter((msg) => msg.id !== lastTempMessageId.current);
          lastTempMessageId.current = null;
          return [...filteredMessages, transformedMessage];
        });
      } else {
        setMessages((prev) => [...prev, transformedMessage]);
      }
    },
    onChatHistory: (messagesData) => {
      const transformedMessages: MessageWithSender[] = messagesData.map((messageData) => ({
        ...messageData,
        updated_at: messageData.created_at,
        sender_type: "freelancer" as const,
        sender_avatar: messageData.sender_avatar ?? null,
      }));

      const reversedMessages = transformedMessages.reverse();

      setMessages((prev) => {
        if (prev.length === 0) {
          return reversedMessages;
        }
        return [...reversedMessages, ...prev];
      });
    },
    onError: (error) => {
      toast.error(`WebSocket error: ${error}`);
    },
  });

  const handleCreateChat = useCallback(
    async (projectDetails: ProjectDetails) => {
      if (!freelancerId) return;

      try {
        const result = await createChat({
          chatCreate: {
            participant_id: Number(freelancerId),
            project_title: projectDetails.project_title,
            project_description: projectDetails.project_description,
            project_budget: projectDetails.project_budget || null,
          },
        }).unwrap();

        setChatId(result.id);
        setShowProjectDialog(false);
        toast.success("Chat created successfully!");
      } catch (_error) {
        toast.error("Failed to create chat. Please try again.");
      }
    },
    [freelancerId, createChat],
  );

  const handleSendMessage = () => {
    if (!messageInput.trim() || !chatId || !isConnected) return;

    const messageContent = messageInput.trim();
    setMessageInput("");

    const tempId = Date.now();
    lastTempMessageId.current = tempId;
    const tempMessage: MessageWithSender = {
      id: tempId,
      chat_id: chatId,
      sender_id: user?.user_id || 0,
      content: messageContent,
      content_type: "text",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender_name: `${user?.first_name} ${user?.last_name}`,
      sender_avatar: user?.image_url || null,
      sender_type: "client_hunter" as const,
    };

    setMessages((prev) => [...prev, tempMessage]);

    sendWebSocketMessage(messageContent, "text");
  };

  useEffect(() => {
    if (freelancerId && freelancerData && !chatId && userChats && !isLoadingChats) {
      const existingChat = userChats.chats.find(
        (chat) => chat.participant_id === Number(freelancerId) || chat.initiator_id === Number(freelancerId),
      );

      if (existingChat) {
        setChatId(existingChat.id);
      } else {
        setShowProjectDialog(true);
      }
    }
  }, [freelancerId, freelancerData, chatId, userChats, isLoadingChats]);

  useEffect(() => {
    if (chatId) {
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    if (isConnected && chatId) {
      requestChatHistory(1, 20);
    }
  }, [isConnected, chatId, requestChatHistory]);

  if (isLoadingFreelancer || isLoadingChats) {
    return (
      <div className="h-[calc(100vh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-center justify-center gap-5">
          <div className="text-lg">Loading chat details...</div>
        </MaxWidthWrapper>
      </div>
    );
  }

  if (!freelancerId) {
    return (
      <div className="h-[calc(100vh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-center justify-center gap-5">
          <div className="text-lg">No freelancer selected</div>
          <div className="text-muted-foreground">Please select a freelancer to start chatting</div>
        </MaxWidthWrapper>
      </div>
    );
  }

  if (!freelancerData) {
    return (
      <div className="h-[calc(100vh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-center justify-center gap-5">
          <div className="text-lg">Freelancer not found</div>
          <div className="text-muted-foreground">The freelancer you're looking for doesn't exist</div>
        </MaxWidthWrapper>
      </div>
    );
  }

  return (
    <>
      <ProjectDetailsDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        onSubmit={handleCreateChat}
        freelancerName={`${freelancerData.first_name} ${freelancerData.last_name}`}
        isLoading={isCreatingChat}
      />
      <div className="h-[calc(100vh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5">
          <div className="flex h-[calc(100vh-104px)] w-full flex-col items-start justify-start gap-5">
            <div className="flex h-[calc(100vh-160px)] w-full flex-col items-start justify-start gap-5 overflow-y-auto rounded-xl border p-5 shadow">
              {messages.length === 0 ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-muted-foreground">
                  <div className="text-center">
                    <div className="font-semibold text-foreground text-lg">
                      Chat with {freelancerData.first_name} {freelancerData.last_name}
                    </div>
                    <div className="text-sm">Start a conversation</div>
                  </div>
                  {userChats?.chats.find(
                    (chat) =>
                      chat.participant_id === Number(freelancerId) || chat.initiator_id === Number(freelancerId),
                  )?.project_title && (
                    <div className="text-center">
                      <div className="font-medium text-primary text-sm">Project:</div>
                      <div className="text-sm">
                        {
                          userChats.chats.find(
                            (chat) =>
                              chat.participant_id === Number(freelancerId) ||
                              chat.initiator_id === Number(freelancerId),
                          )?.project_title
                        }
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                messages.map((message) => {
                  const isCurrentUser = message.sender_id === user?.user_id;
                  return (
                    <div
                      key={message.id}
                      className={cn("flex w-full max-w-2/3 gap-2.5", {
                        "ml-auto items-end justify-end": isCurrentUser,
                        "mr-auto items-start justify-start": !isCurrentUser,
                      })}
                    >
                      <img
                        src={message.sender_avatar || "https://ui.shadcn.com/avatars/01.png"}
                        alt={message.sender_name}
                        className={cn("size-8 shrink-0 rounded-full", {
                          "order-2": isCurrentUser,
                          "order-1": !isCurrentUser,
                        })}
                      />
                      <div
                        className={cn("flex flex-col gap-1", {
                          "order-1": isCurrentUser,
                          "order-2": !isCurrentUser,
                        })}
                      >
                        <span
                          className={cn("flex-1 rounded-lg p-2.5 text-[14px] leading-[14px]", {
                            "bg-primary text-right text-white dark:text-black": isCurrentUser,
                            "bg-muted text-left": !isCurrentUser,
                          })}
                        >
                          {message.content}
                        </span>
                        <span
                          className={cn("text-[10px] text-muted-foreground", {
                            "text-right": isCurrentUser,
                            "text-left": !isCurrentUser,
                          })}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {chatId && (
              <div className="flex w-full items-center justify-center gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="size-4 text-green-500" />
                  ) : (
                    <WifiOff className="size-4 text-red-500" />
                  )}
                  <span
                    className={cn("text-xs", {
                      "text-green-500": isConnected,
                      "text-red-500": !isConnected,
                    })}
                  >
                    {connectionStatus === "connected"
                      ? "Connected"
                      : connectionStatus === "connecting"
                        ? "Connecting..."
                        : "Disconnected"}
                  </span>
                </div>
              </div>
            )}
            <div className="flex w-full items-center justify-center gap-2.5">
              <Input
                type="text"
                className="flex-1"
                placeholder="Type your message here..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={!chatId || !isConnected}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || !chatId || !isConnected}
              >
                <Send className="size-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={!chatId || !isConnected}>
                <Image />
              </Button>
            </div>
          </div>
        </MaxWidthWrapper>
      </div>
    </>
  );
}
