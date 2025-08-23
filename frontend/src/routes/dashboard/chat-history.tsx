import { createFileRoute } from "@tanstack/react-router";
import { Loader2, MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import ChatInterface from "@/components/chat/chat-interface";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAuth } from "@/lib/route-guard";
import { useGetCurrentUserProfileAuthMeGetQuery, useListUserChatsChatsGetQuery } from "@/store/services/apis";

export const Route = createFileRoute("/dashboard/chat-history")({
  component: Chats,
  beforeLoad: async () => {
    await requireAuth();
  },
});

function Chats() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  const { data: currentUser } = useGetCurrentUserProfileAuthMeGetQuery();
  const { data: chatsData, isLoading } = useListUserChatsChatsGetQuery({
    statusFilter: statusFilter || undefined,
    page: 1,
    size: 20,
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="size-20 animate-spin" />
      </div>
    );
  }

  const chats = chatsData?.chats || [];

  const selectedChatData = chatsData?.chats.find((chat) => chat.id === selectedChat);

  if (selectedChat && selectedChatData && currentUser) {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedChat(null)}>
              ← Back to Chats
            </Button>
            <h1 className="font-bold text-xl">Chat with {selectedChatData.participant_name}</h1>
          </div>
        </div>
        <div className="flex-1">
          <ChatInterface
            chat={selectedChatData}
            currentUserId={currentUser.id}
            onMessageSent={() => {
              // Refresh chat data if needed
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-start justify-start py-5">
      <MaxWidthWrapper>
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl">Messages</h1>
              <p className="text-muted-foreground">Manage your conversations and project discussions</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Chats List */}
          <div className="grid gap-4">
            {chats.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-semibold text-lg">No conversations yet</h3>
                  <p className="mb-4 text-center text-muted-foreground">
                    Start a conversation with a client or freelancer to begin your project collaboration.
                  </p>
                  <Button onClick={() => setShowNewChat(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Chat
                  </Button>
                </CardContent>
              </Card>
            ) : (
              chats.map((chat) => (
                <Card
                  key={chat.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => setSelectedChat(chat.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="font-semibold">{chat.title || `Chat with ${chat.participant_name}`}</h3>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              chat.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {chat.status}
                          </span>
                        </div>
                        <p className="mb-2 text-muted-foreground text-sm">
                          {chat.project_title && `Project: ${chat.project_title}`}
                        </p>
                        {chat.last_message_preview && (
                          <p className="truncate text-muted-foreground text-sm">{chat.last_message_preview}</p>
                        )}
                      </div>
                      <div className="text-right text-muted-foreground text-sm">
                        <div>{chat.unread_count || 0} unread</div>
                        <div>{new Date(chat.updated_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {chatsData && chatsData.total > 20 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" disabled={!chatsData.has_prev}>
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {chatsData.page} of {Math.ceil(chatsData.total / chatsData.size)}
              </span>
              <Button variant="outline" disabled={!chatsData.has_next}>
                Next
              </Button>
            </div>
          )}
        </div>
      </MaxWidthWrapper>

      {/* New Chat Dialog */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6">
            <h3 className="mb-4 font-semibold text-lg">Start New Chat</h3>
            <p className="mb-4 text-muted-foreground">
              To start a new chat, go to the Dashboard and find a user you'd like to work with.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewChat(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowNewChat(false);
                  // Navigate to dashboard
                  window.location.href = "/dashboard";
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
