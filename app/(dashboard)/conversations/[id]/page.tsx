"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import type { Conversation, Message } from "@/types";

interface ConversationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    params.then((p) => setConversationId(p.id));
  }, [params]);

  useEffect(() => {
    if (!conversationId) return;

    async function loadConversation() {
      const { data: convData } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      const conv = convData as Conversation | null;

      if (conv) {
        setConversation(conv);
      }

      const { data: msgsData } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      const msgs = (msgsData || []) as Message[];

      if (msgs) {
        setMessages(msgs);
      }

      setLoading(false);
    }

    loadConversation();

    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // biome-ignore lint/suspicious/noExplicitAny: Supabase type workaround
    const { error } = await (supabase.from("messages") as any).insert({
      conversation_id: conversationId,
      sender_type: "agent",
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
      // Update last_message_at
      await (supabase.from("conversations") as any)
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">对话不存在</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">
            {conversation.visitor_name || "访客"}
          </h2>
          <p className="text-sm text-gray-500">
            {conversation.visitor_email || "未提供邮箱"}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            conversation.status === "open"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {conversation.status === "open" ? "进行中" : "已关闭"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_type === "agent" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg ${
                message.sender_type === "agent"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p>{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender_type === "agent"
                    ? "text-blue-200"
                    : "text-gray-500"
                }`}
              >
                {formatRelativeTime(message.created_at)}
              </p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>暂无消息</p>
            <p className="text-sm">开始与客户对话吧</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
      </form>
    </div>
  );
}
