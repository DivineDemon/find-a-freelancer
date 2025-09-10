import { toast } from "sonner";

export type WebSocketMessageType =
  | "message"
  | "typing"
  | "user_status"
  | "error"
  | "connection"
  | "pong"
  | "chat_history";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: MessageData | TypingData | UserStatusData | { error: string } | { timestamp: string };
}

export interface MessageData {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  content_type: string;
  created_at: string;
  sender_name: string;
  sender_avatar?: string;
}

export interface TypingData {
  user_id: number;
  chat_id: string;
  is_typing: boolean;
}

export interface UserStatusData {
  user_id: number;
  chat_id: string;
  status: "online" | "offline" | "typing";
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WebSocketCallbacks {
  onMessage?: (message: MessageData) => void;
  onTyping?: (data: TypingData) => void;
  onUserStatus?: (data: UserStatusData) => void;
  onChatHistory?: (messages: MessageData[]) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
  onError?: (error: string) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private chatId: string | null = null;
  private token: string | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private connectionStatus: ConnectionStatus = "disconnected";

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      window.addEventListener("beforeunload", this.handleBeforeUnload);
    }
  }

  private handleVisibilityChange() {
    if (document.hidden && this.ws?.readyState === WebSocket.OPEN) {
      this.sendPing();
    }
  }

  private handleBeforeUnload() {
    this.disconnect();
  }

  private getWebSocketUrl(chatId: string, token: string): string {
    const baseUrl = import.meta.env.VITE_BASE_API_URL || "http://127.0.0.1:8000";
    const wsUrl = baseUrl.replace("http://", "ws://").replace("https://", "wss://");
    return `${wsUrl}/ws/chat/${chatId}?token=${token}`;
  }

  private updateConnectionStatus(status: ConnectionStatus) {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.callbacks.onConnectionChange?.(status);
    }
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendPing();
      }
    }, 30000);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendPing() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "ping",
          data: { timestamp: Date.now() },
        }),
      );
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case "message":
          this.callbacks.onMessage?.(message.data as MessageData);
          break;
        case "typing":
          this.callbacks.onTyping?.(message.data as TypingData);
          break;
        case "user_status":
          this.callbacks.onUserStatus?.(message.data as UserStatusData);
          break;
        case "pong":
          break;
        case "chat_history":
          this.callbacks.onChatHistory?.(message.data as unknown as MessageData[]);
          break;
        case "error":
          this.callbacks.onError?.((message.data as { error: string }).error || "Unknown error");
          break;
        default:
      }
    } catch (_error) {
      this.callbacks.onError?.("Failed to parse message");
    }
  }

  private handleOpen() {
    this.updateConnectionStatus("connected");
    this.reconnectAttempts = 0;
    this.startPingInterval();
  }

  private handleClose(event: CloseEvent) {
    this.updateConnectionStatus("disconnected");
    this.stopPingInterval();

    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.callbacks.onError?.("Connection lost. Please refresh the page.");
      toast.error("Connection lost. Please refresh the page.");
    }
  }

  private handleError() {
    this.updateConnectionStatus("error");
    this.callbacks.onError?.("Connection error occurred");
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.chatId && this.token) {
        this.connect(this.chatId, this.token);
      }
    }, delay);
  }

  connect(chatId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.disconnect();
      }

      this.chatId = chatId;
      this.token = token;
      this.updateConnectionStatus("connecting");

      try {
        const wsUrl = this.getWebSocketUrl(chatId, token);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.handleOpen();
          resolve();
        };

        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onclose = this.handleClose.bind(this);
        this.ws.onerror = (error) => {
          this.handleError();
          reject(error);
        };
      } catch (error) {
        this.updateConnectionStatus("error");
        reject(error);
      }
    });
  }

  disconnect() {
    this.stopPingInterval();

    if (this.ws) {
      this.ws.close(1000, "User disconnected");
      this.ws = null;
    }

    this.updateConnectionStatus("disconnected");
    this.chatId = null;
    this.token = null;
    this.reconnectAttempts = 0;
  }

  sendMessage(content: string, contentType: string = "text") {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type: "message",
        data: {
          content: content,
          content_type: contentType,
        },
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  requestChatHistory(page: number = 1, size: number = 20) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type: "chat_history",
        data: {
          page: page,
          size: size,
        },
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  sendTyping(isTyping: boolean) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "typing",
          data: { is_typing: isTyping },
        }),
      );
    }
  }

  setCallbacks(callbacks: WebSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getChatId(): string | null {
    return this.chatId;
  }

  destroy() {
    this.disconnect();

    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      window.removeEventListener("beforeunload", this.handleBeforeUnload);
    }
  }
}

export const websocketService = new WebSocketService();
