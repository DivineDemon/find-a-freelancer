import { useCallback, useEffect, useRef, useState } from "react";
import { websocketService } from "@/services/websocket";
import type { ChatWithParticipants, MessageWithSender } from "@/store/services/apis";
import { useGetCurrentUserProfileAuthMeGetQuery } from "@/store/services/apis";

export interface RealtimeMessage extends MessageWithSender {
  isLocal?: boolean; // Flag for messages sent locally before server confirmation
}

interface WebSocketData {
  chat_id: number;
  [key: string]: unknown;
}

interface TypingData extends WebSocketData {
  user_id: number;
  is_typing: boolean;
}

interface ReadData extends WebSocketData {
  message_id: string;
}

export function useRealtimeChat(chat: ChatWithParticipants) {
  const { data: currentUser } = useGetCurrentUserProfileAuthMeGetQuery();
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const localMessageId = useRef(0);

  // Handle incoming messages from WebSocket
  const handleIncomingMessage = useCallback(
    (data: unknown) => {
      if (data && typeof data === "object" && data !== null && "chat_id" in data) {
        const typedData = data as WebSocketData;
        if (typedData.chat_id === chat.id) {
          const newMessage: RealtimeMessage = {
            id: (typedData.id as number) || Date.now(),
            content: (typedData.content as string) || "",
            content_type: (typedData.content_type as string) || "text",
            chat_id: typedData.chat_id,
            sender_id: (typedData.sender_id as number) || 0,
            is_flagged: false,
            flag_reason: null,
            is_edited: false,
            original_content: null,
            is_deleted: false,
            deleted_at: null,
            edited_at: null,
            created_at: (typedData.timestamp as string) || new Date().toISOString(),
            updated_at: (typedData.timestamp as string) || new Date().toISOString(),
            sender_name: (typedData.sender_name as string) || "Unknown",
            sender_type: (typedData.sender_type as "client_hunter" | "freelancer") || "client_hunter",
            sender_avatar: (typedData.sender_avatar as string) || null,
          };

          setMessages((prev) => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some((msg) => msg.id === newMessage.id);
            if (exists) return prev;

            return [...prev, newMessage];
          });
        }
      }
    },
    [chat.id],
  );

  // Handle typing indicators
  const handleTypingIndicator = useCallback(
    (data: unknown) => {
      if (data && typeof data === "object" && data !== null && "chat_id" in data) {
        const typedData = data as TypingData;
        if (typedData.chat_id === chat.id) {
          if (typedData.is_typing) {
            setTypingUsers((prev) => new Set([...prev, typedData.user_id]));
          } else {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(typedData.user_id);
              return newSet;
            });
          }
        }
      }
    },
    [chat.id],
  );

  // Handle read receipts
  const handleReadReceipt = useCallback((data: unknown) => {
    if (data && typeof data === "object" && data !== null && "message_id" in data) {
      const typedData = data as ReadData;
      // Update message read status if needed
      setMessages((prev) =>
        prev.map((msg) => (msg.id.toString() === typedData.message_id ? { ...msg, is_read: true } : msg)),
      );
    }
  }, []);

  // Initialize WebSocket connection and join chat
  useEffect(() => {
    if (!currentUser || !chat) return;

    const connectToChat = async () => {
      try {
        // Connect to WebSocket if not already connected
        if (!websocketService.isConnected()) {
          await websocketService.connect(currentUser.id, localStorage.getItem("accessToken") || "");
        }

        // Join the specific chat room
        websocketService.joinChat(chat.id);
        setIsConnected(true);

        // Set up message handlers
        websocketService.onMessage("chat", handleIncomingMessage);
        websocketService.onMessage("typing", handleTypingIndicator);
        websocketService.onMessage("read", handleReadReceipt);

        // Set up connection handlers
        websocketService.onConnection("connected", () => setIsConnected(true));
        websocketService.onConnection("disconnected", () => setIsConnected(false));
        websocketService.onConnection("error", () => setIsConnected(false));
      } catch (_error) {
        setIsConnected(false);
      }
    };

    connectToChat();

    // Cleanup: leave chat and remove handlers
    return () => {
      if (chat) {
        websocketService.leaveChat(chat.id);
      }
      websocketService.offMessage("chat");
      websocketService.offMessage("typing");
      websocketService.offMessage("read");
      websocketService.offConnection("connected");
      websocketService.offConnection("disconnected");
      websocketService.offConnection("error");
    };
  }, [chat?.id, currentUser?.id, handleIncomingMessage, handleTypingIndicator, handleReadReceipt, chat, currentUser]);

  // Send message through WebSocket
  const sendMessage = useCallback(
    async (content: string, contentType: string = "text") => {
      if (!content.trim() || !isConnected) return false;

      // Create local message for immediate display
      const localMessage: RealtimeMessage = {
        id: ++localMessageId.current,
        content: content.trim(),
        content_type: contentType,
        chat_id: chat.id,
        sender_id: currentUser!.id,
        is_flagged: false,
        flag_reason: null,
        is_edited: false,
        original_content: null,
        is_deleted: false,
        deleted_at: null,
        edited_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender_name: `${currentUser!.first_name} ${currentUser!.last_name}`,
        sender_type: currentUser!.user_type,
        sender_avatar: currentUser!.profile_picture || null,
        isLocal: true,
      };

      // Add local message immediately
      setMessages((prev) => [...prev, localMessage]);

      try {
        // Send through WebSocket
        websocketService.sendChatMessage(chat.id, content.trim(), contentType);
        return true;
      } catch (_error) {
        // Remove local message on failure
        setMessages((prev) => prev.filter((msg) => msg.id !== localMessage.id));
        return false;
      }
    },
    [chat.id, currentUser, isConnected],
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (isConnected) {
        websocketService.sendTypingIndicator(chat.id, isTyping);
      }
    },
    [chat.id, isConnected],
  );

  // Send read receipt
  const sendReadReceipt = useCallback(
    (messageId: string) => {
      if (isConnected) {
        websocketService.sendReadReceipt(messageId, chat.id);
      }
    },
    [chat.id, isConnected],
  );

  // Initialize messages from API (for existing messages)
  const initializeMessages = useCallback((apiMessages: MessageWithSender[]) => {
    setMessages(apiMessages.map((msg) => ({ ...msg, isLocal: false })));
  }, []);

  // Update local message with server response (remove local flag)
  const updateLocalMessage = useCallback((localId: number, serverMessage: MessageWithSender) => {
    setMessages((prev) => prev.map((msg) => (msg.id === localId ? { ...serverMessage, isLocal: false } : msg)));
  }, []);

  return {
    messages,
    isConnected,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    initializeMessages,
    updateLocalMessage,
  };
}
