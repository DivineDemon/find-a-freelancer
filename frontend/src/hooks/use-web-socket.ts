import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  type ConnectionStatus,
  type MessageData,
  type TypingData,
  type UserStatusData,
  type WebSocketCallbacks,
  websocketService,
} from "../lib/websocket";
import type { RootState } from "../store";

export interface UseWebSocketOptions {
  chatId: string;
  onMessage?: (message: MessageData) => void;
  onTyping?: (data: TypingData) => void;
  onUserStatus?: (data: UserStatusData) => void;
  onChatHistory?: (messages: MessageData[]) => void;
  onError?: (error: string) => void;
}

export interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  sendMessage: (content: string, contentType?: string) => void;
  sendTyping: (isTyping: boolean) => void;
  requestChatHistory: (page?: number, size?: number) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useWebSocket = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const callbacksRef = useRef<WebSocketCallbacks>({});
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const token = useSelector((state: RootState) => state.global.access_token);
  const { chatId, onMessage, onTyping, onUserStatus, onChatHistory, onError } = options;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");

  const updateConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    setIsConnected(status === "connected");
  }, []);

  const connect = useCallback(async () => {
    if (!token) {
      return;
    }

    if (!chatId) {
      return;
    }

    try {
      await websocketService.connect(chatId, token);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [chatId, token]);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  const sendMessage = useCallback((content: string, contentType: string = "text") => {
    websocketService.sendMessage(content, contentType);
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    websocketService.sendTyping(isTyping);
  }, []);

  const requestChatHistory = useCallback((page: number = 1, size: number = 20) => {
    websocketService.requestChatHistory(page, size);
  }, []);

  useEffect(() => {
    callbacksRef.current = {
      onMessage: onMessage,
      onTyping: onTyping,
      onUserStatus: onUserStatus,
      onChatHistory: onChatHistory,
      onError: onError,
      onConnectionChange: updateConnectionStatus,
    };

    websocketService.setCallbacks(callbacksRef.current);

    return () => {
      websocketService.setCallbacks({});
    };
  }, [onMessage, onTyping, onUserStatus, onChatHistory, onError, updateConnectionStatus]);

  useEffect(() => {
    if (token && chatId) {
      connect();
    }

    return () => {
      if (websocketService.getChatId() === chatId) {
        disconnect();
      }
    };
  }, [chatId, token, connect, disconnect]);

  useEffect(() => {
    setConnectionStatus(websocketService.getConnectionStatus());
    setIsConnected(websocketService.isConnected());
  }, []);

  return {
    connectionStatus,
    isConnected,
    sendMessage,
    sendTyping,
    requestChatHistory,
    connect,
    disconnect,
  };
};
