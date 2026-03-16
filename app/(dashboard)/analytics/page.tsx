import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import type { Profile } from "@/types";

export default async function AnalyticsPage() {
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

  // Get stats
  const workspaceId = profile?.workspace_id;
  let totalConversations = 0;
  let openConversations = 0;

  if (workspaceId) {
    const { count: total } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);
    totalConversations = total || 0;

    const { count: open } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "open");
    openConversations = open || 0;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">分析</h1>
        <p className="text-gray-500 mt-1">查看客服数据统计</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">总对话数</p>
          <p className="text-3xl font-bold text-gray-900">
            {totalConversations || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">进行中对话</p>
          <p className="text-3xl font-bold text-blue-600">
            {openConversations || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">平均响应时间</p>
          <p className="text-3xl font-bold text-gray-900">--</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">最近活动</h2>
        <p className="text-gray-500">分析功能即将上线...</p>
      </div>
    </div>
  );
}
