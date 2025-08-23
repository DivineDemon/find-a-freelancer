/** WebSocket service for real-time chat functionality */

export interface ChatMessage {
  id: string;
  content: string;
  sender_id: number;
  chat_id: number;
  created_at: string;
  content_type: string;
}

export interface WebSocketMessage {
  type: "chat" | "typing" | "read" | "connection" | "error";
  data?: unknown;
  message?: string;
  timestamp: string;
}

export interface TypingIndicator {
  chat_id: number;
  user_id: number;
  is_typing: boolean;
}

export interface ReadReceipt {
  message_id: string;
  chat_id: number;
  user_id: number;
  read_at: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, (data: unknown) => void> = new Map();
  private connectionHandlers: Map<string, () => void> = new Map();
  private isConnecting = false;
  private userId: number | null = null;
  private token: string | null = null;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle page visibility change to reconnect when tab becomes visible
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.ws?.readyState === WebSocket.CLOSED) {
        this.reconnect();
      }
    });

    // Handle online/offline events
    window.addEventListener("online", () => {
      if (this.ws?.readyState === WebSocket.CLOSED) {
        this.reconnect();
      }
    });
  }

  connect(userId: number, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error("Connection already in progress"));
        return;
      }

      this.userId = userId;
      this.token = token;
      this.isConnecting = true;

      try {
        const wsUrl = `ws://localhost:8000/ws/${userId}?token=${token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers("connected");
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (_error) {
            // Ignore parsing errors for malformed messages
          }
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.notifyConnectionHandlers("disconnected");

          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          }
        };

        this.ws.onerror = (_error) => {
          this.isConnecting = false;
          this.notifyConnectionHandlers("error");
          reject(new Error("WebSocket connection failed"));
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, "User initiated disconnect");
      this.ws = null;
    }
    this.userId = null;
    this.token = null;
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.userId && this.token) {
        this.connect(this.userId, this.token).catch((_error) => {
          // Ignore reconnection errors silently
        });
      }
    }, delay);
  }

  sendMessage(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // WebSocket not connected
    }
  }

  sendChatMessage(chatId: number, content: string, contentType: string = "text") {
    const message: WebSocketMessage = {
      type: "chat",
      data: {
        chat_id: chatId,
        content,
        content_type: contentType,
      },
      timestamp: new Date().toISOString(),
    };
    this.sendMessage(message);
  }

  sendTypingIndicator(chatId: number, isTyping: boolean) {
    const message: WebSocketMessage = {
      type: "typing",
      data: {
        chat_id: chatId,
        is_typing: isTyping,
      },
      timestamp: new Date().toISOString(),
    };
    this.sendMessage(message);
  }

  sendReadReceipt(messageId: string, chatId: number) {
    const message: WebSocketMessage = {
      type: "read",
      data: {
        message_id: messageId,
        chat_id: chatId,
      },
      timestamp: new Date().toISOString(),
    };
    this.sendMessage(message);
  }

  // Join a specific chat room
  joinChat(chatId: number) {
    const message: WebSocketMessage = {
      type: "connection",
      data: {
        action: "join_chat",
        chat_id: chatId,
      },
      timestamp: new Date().toISOString(),
    };
    this.sendMessage(message);
  }

  // Leave a specific chat room
  leaveChat(chatId: number) {
    const message: WebSocketMessage = {
      type: "connection",
      data: {
        action: "leave_chat",
        chat_id: chatId,
      },
      timestamp: new Date().toISOString(),
    };
    this.sendMessage(message);
  }

  private handleMessage(message: WebSocketMessage) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data || message);
    } else {
      // No handler for this message type
    }
  }

  onMessage(type: string, handler: (data: unknown) => void) {
    this.messageHandlers.set(type, handler);
  }

  offMessage(type: string) {
    this.messageHandlers.delete(type);
  }

  onConnection(event: "connected" | "disconnected" | "error", handler: () => void) {
    this.connectionHandlers.set(event, handler);
  }

  offConnection(event: "connected" | "disconnected" | "error") {
    this.connectionHandlers.delete(event);
  }

  private notifyConnectionHandlers(event: "connected" | "disconnected" | "error") {
    const handler = this.connectionHandlers.get(event);
    if (handler) {
      handler();
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return "disconnected";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "disconnected";
      default:
        return "unknown";
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
