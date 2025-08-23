import { Loader2, Paperclip, Send, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatWithParticipants } from "@/store/services/apis";
import {
  useGetChatMessagesMessagesChatChatIdGetQuery,
  useSendMessageMessagesPostMutation,
} from "@/store/services/apis";

interface ChatInterfaceProps {
  chat: ChatWithParticipants;
  currentUserId: number;
  onMessageSent?: () => void;
}

export default function ChatInterface({ chat, currentUserId, onMessageSent }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isTyping, _setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sendMessage, { isLoading: sending }] = useSendMessageMessagesPostMutation();
  const { data: messagesData, refetch } = useGetChatMessagesMessagesChatChatIdGetQuery({
    chatId: chat.id,
    page: 1,
    size: 50,
  });

  const messages = messagesData?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const response = await sendMessage({
        messageCreate: {
          content: message.trim(),
          content_type: "text",
          chat_id: chat.id,
        },
      });

      if (response.data) {
        setMessage("");
        onMessageSent?.();
        toast.success("Message sent!");
        // Refresh messages to show the new one
        refetch();
      }
    } catch (_error) {
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  const getOtherParticipantType = () => {
    return chat.initiator_id === currentUserId ? chat.participant_type : chat.initiator_type;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="border-b px-4 py-3">
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
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{getOtherParticipantName()}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {getOtherParticipantType().replace("_", " ")}
              </Badge>
              {chat.project_title && (
                <span className="text-muted-foreground text-sm">Project: {chat.project_title}</span>
              )}
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
                </div>

                {msg.sender_id === currentUserId && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src="" alt="You" />
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
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
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            size="icon"
            className="flex-shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
