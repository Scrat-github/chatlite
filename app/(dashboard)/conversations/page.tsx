import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

import type { Profile, Conversation } from "@/types";

export default async function ConversationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user's workspace
  const { data: profileData } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();
  const profile = profileData as Profile | null;

  // Get conversations
  const workspaceId = profile?.workspace_id;
  let conversations: Conversation[] = [];

  if (workspaceId) {
    const { data: conversationsData } = await supabase
      .from("conversations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("last_message_at", { ascending: false })
      .limit(50);
    conversations = (conversationsData || []) as Conversation[];
  }

  return (
    <div className="h-full flex">
      {/* Conversations list */}
      <div className="w-80 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold">对话</h1>
          <p className="text-sm text-gray-500">管理客户对话</p>
        </div>
        <div className="divide-y divide-gray-100">
          {conversations?.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/conversations/${conversation.id}`}
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {conversation.visitor_name || "访客"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
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
              <p className="text-xs text-gray-400 mt-2">
                {conversation.last_message_at
                  ? formatRelativeTime(conversation.last_message_at)
                  : formatRelativeTime(conversation.created_at)}
              </p>
            </Link>
          ))}
          {(!conversations || conversations.length === 0) && (
            <div className="p-8 text-center">
              <p className="text-gray-500">暂无对话</p>
              <p className="text-sm text-gray-400 mt-1">
                当有客户发起对话时会显示在这里
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-gray-500">选择一个对话开始聊天</p>
        </div>
      </div>
    </div>
  );
}
