import { createFileRoute } from "@tanstack/react-router";
import { Image, Send, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/hooks/use-web-socket";
import { requireAuth } from "@/lib/route-guard";
import { cn, uploadToImgbb } from "@/lib/utils";
import type { RootState } from "@/store";
import {
  type MessageWithSender,
  useGetClientHunterClientHunterClientHunterIdGetQuery,
  useListUserChatsChatsGetQuery,
} from "@/store/services/apis";

export const Route = createFileRoute("/freelancer/chat/$clientHunterId/")({
  component: FreelancerChatInterface,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function FreelancerChatInterface() {
  const { clientHunterId } = Route.useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTempMessageId = useRef<number | null>(null);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState<string>("");
  const { user } = useSelector((state: RootState) => state.global);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  const { data: clientHunterData, isLoading: isLoadingClientHunter } =
    useGetClientHunterClientHunterClientHunterIdGetQuery(
      { clientHunterId: Number(clientHunterId) },
      { skip: !clientHunterId },
    );

  const { data: userChats, isLoading: isLoadingChats } = useListUserChatsChatsGetQuery(
    { page: 1, size: 100 },
    { skip: !clientHunterId },
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);

    event.target.value = "";
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const renderMessageContent = (message: MessageWithSender) => {
    if (message.content_type === "image") {
      return (
        <img
          src={message.content}
          alt="Shared image"
          className="max-w-xs rounded-lg"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }

    const hasImageUrl =
      message.content.includes("http") &&
      (message.content.includes(".jpg") ||
        message.content.includes(".jpeg") ||
        message.content.includes(".png") ||
        message.content.includes(".gif") ||
        message.content.includes(".webp"));

    if (hasImageUrl) {
      const lines = message.content.split("\n");
      const textLines = lines.filter((line) => !line.includes("http"));
      const imageUrls = lines.filter((line) => line.includes("http"));

      return (
        <div className="space-y-2">
          {textLines.length > 0 && <p className="whitespace-pre-wrap">{textLines.join("\n")}</p>}
          {imageUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt="Shared image"
              className="max-w-xs rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ))}
        </div>
      );
    }

    return <p className="whitespace-pre-wrap">{message.content}</p>;
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !chatId || !isConnected) return;

    setIsUploadingImage(true);
    try {
      let messageContent = messageInput.trim();
      let contentType = "text";

      if (selectedFile) {
        const imageUrl = await uploadToImgbb(selectedFile);
        if (messageContent) {
          messageContent = `${messageContent}\n${imageUrl}`;
        } else {
          messageContent = imageUrl;
          contentType = "image";
        }
      }

      setMessageInput("");
      setImagePreview(null);
      setSelectedFile(null);

      const tempId = Date.now();
      lastTempMessageId.current = tempId;
      const tempMessage: MessageWithSender = {
        id: tempId,
        chat_id: chatId,
        sender_id: user?.user_id || 0,
        content: messageContent,
        content_type: contentType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender_name: `${user?.first_name} ${user?.last_name}`,
        sender_avatar: user?.image_url || null,
        sender_type: "freelancer" as const,
      };

      setMessages((prev) => [...prev, tempMessage]);
      sendWebSocketMessage(messageContent, contentType);
    } catch (_error) {
      toast.error("Failed to send message");
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    if (clientHunterId && clientHunterData && !chatId && userChats && !isLoadingChats) {
      const existingChat = userChats.chats.find(
        (chat) => chat.participant_id === Number(clientHunterId) || chat.initiator_id === Number(clientHunterId),
      );

      if (existingChat) {
        setChatId(existingChat.id);
      }
    }
  }, [clientHunterId, clientHunterData, chatId, userChats, isLoadingChats]);

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

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages, scrollToBottom]);

  if (isLoadingClientHunter || isLoadingChats) {
    return (
      <div className="h-[calc(100vh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-center justify-center gap-5">
          <div className="text-lg">Loading chat details...</div>
        </MaxWidthWrapper>
      </div>
    );
  }

  if (!clientHunterId) {
    return (
      <div className="h-[calc(100vh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-center justify-center gap-5">
          <div className="text-lg">No client hunter selected</div>
          <div className="text-muted-foreground">Please select a client hunter to start chatting</div>
        </MaxWidthWrapper>
      </div>
    );
  }

  if (!clientHunterData) {
    return (
      <div className="h-[calc(100vh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-center justify-center gap-5">
          <div className="text-lg">Client hunter not found</div>
          <div className="text-muted-foreground">The client hunter you're looking for doesn't exist</div>
        </MaxWidthWrapper>
      </div>
    );
  }

  if (!chatId) {
    return (
      <div className="h-[calc(100vh-64px)] w-full">
        <MaxWidthWrapper className="flex flex-col items-center justify-center gap-5">
          <div className="text-lg">No active chat</div>
          <div className="text-muted-foreground">You can only reply to existing chats as a freelancer</div>
        </MaxWidthWrapper>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <MaxWidthWrapper className="flex flex-col items-start justify-start gap-5">
        <div className="flex h-[calc(100vh-104px)] w-full flex-col items-start justify-start gap-5">
          <div className="flex h-[calc(100vh-160px)] w-full flex-col items-start justify-start gap-5 overflow-y-auto rounded-xl border p-5 shadow">
            {messages.length === 0 ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-muted-foreground">
                <div className="text-center">
                  <div className="font-semibold text-foreground text-lg">
                    Chat with {clientHunterData.first_name} {clientHunterData.last_name}
                  </div>
                  <div className="text-sm">Start a conversation</div>
                </div>
                {userChats?.chats.find(
                  (chat) =>
                    chat.participant_id === Number(clientHunterId) || chat.initiator_id === Number(clientHunterId),
                )?.project_title && (
                  <div className="text-center">
                    <div className="font-medium text-primary text-sm">Project:</div>
                    <div className="text-sm">
                      {
                        userChats.chats.find(
                          (chat) =>
                            chat.participant_id === Number(clientHunterId) ||
                            chat.initiator_id === Number(clientHunterId),
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
                    className={cn("flex w-full max-w-2/3 items-start gap-2.5", {
                      "ml-auto justify-end": isCurrentUser,
                      "mr-auto justify-start": !isCurrentUser,
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
                        {renderMessageContent(message)}
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
            <div ref={messagesEndRef} />
          </div>
          {chatId && (
            <div className="flex w-full items-center justify-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                {isConnected ? <Wifi className="size-4 text-green-500" /> : <WifiOff className="size-4 text-red-500" />}
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
          {imagePreview && (
            <div className="flex w-full items-center justify-center">
              <div className="relative max-w-xs">
                <img src={imagePreview} alt="Preview" className="rounded-lg" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="-right-2 -top-2 absolute h-6 w-6"
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedFile(null);
                  }}
                >
                  ×
                </Button>
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
              disabled={(!messageInput.trim() && !selectedFile) || !chatId || !isConnected || isUploadingImage}
            >
              <Send className={cn("size-4", { "animate-spin": isUploadingImage })} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!chatId || !isConnected || isUploadingImage}
              onClick={handleImageButtonClick}
            >
              <Image className={cn("size-4", { "animate-spin": isUploadingImage })} />
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
