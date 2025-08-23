import { Paperclip, Send, Smile, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import type { ChatWithParticipants } from "@/store/services/apis";
import { useGetChatMessagesMessagesChatChatIdGetQuery } from "@/store/services/apis";

interface ChatInterfaceProps {
  chat: ChatWithParticipants;
  currentUserId: number;
  onMessageSent?: () => void;
}

export default function ChatInterface({ chat, currentUserId, onMessageSent }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get initial messages from API
  const { data: messagesData } = useGetChatMessagesMessagesChatChatIdGetQuery({
    chatId: chat.id,
    page: 1,
    size: 50,
  });

  // Use real-time chat hook
  const {
    messages,
    isConnected,
    typingUsers,
    sendMessage: sendRealtimeMessage,
    sendTypingIndicator,
    initializeMessages,
  } = useRealtimeChat(chat);

  // Initialize messages when API data loads
  useEffect(() => {
    if (messagesData?.messages) {
      initializeMessages(messagesData.messages);
    }
  }, [messagesData?.messages, initializeMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Send typing indicator when user types
  useEffect(() => {
    const timeout = setTimeout(() => {
      sendTypingIndicator(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [sendTypingIndicator]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const success = await sendRealtimeMessage(message.trim(), "text");
      if (success) {
        setMessage("");
        onMessageSent?.();
        toast.success("Message sent!");
      } else {
        toast.error("Failed to send message - not connected");
      }
    } catch (_error) {
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      // Send typing indicator when user starts typing
      sendTypingIndicator(true);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOtherParticipantName = () => {
    return chat.initiator_id === currentUserId ? chat.participant_name : chat.initiator_name;
  };

  // Removed unused function

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt={getOtherParticipantName()} />
              <AvatarFallback>
                {getOtherParticipantName()
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{getOtherParticipantName()}</h3>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? (
                    <>
                      <Wifi className="mr-1 h-3 w-3" />
                      Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="mr-1 h-3 w-3" />
                      Disconnected
                    </>
                  )}
                </Badge>
                {typingUsers.size > 0 && (
                  <span className="text-muted-foreground text-sm">{getOtherParticipantName()} is typing...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
              >
                {msg.sender_id !== currentUserId && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.sender_avatar || ""} alt={msg.sender_name} />
                    <AvatarFallback className="text-xs">
                      {msg.sender_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    msg.sender_id === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium text-xs">
                      {msg.sender_id === currentUserId ? "You" : msg.sender_name}
                    </span>
                    <span className="text-xs opacity-70">{formatTime(msg.created_at)}</span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                  {msg.is_edited && <span className="text-xs opacity-70">(edited)</span>}
                  {msg.isLocal && <span className="text-blue-500 text-xs opacity-70">(sending...)</span>}
                </div>

                {msg.sender_id === currentUserId && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src="" alt="You" />
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {typingUsers.size > 0 && (
              <div className="flex justify-start gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {getOtherParticipantName()
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="flex-shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="flex-shrink-0">
            <Smile className="h-4 w-4" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={!isConnected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || !isConnected}
            size="icon"
            className="flex-shrink-0"
          >
            {!isConnected ? <WifiOff className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
