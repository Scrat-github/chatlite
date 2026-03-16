import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import type { Profile } from "@/types";

export default async function TeamPage() {
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
    .select("workspace_id, role")
    .eq("id", user.id)
    .single();
  const profile = profileData as Profile | null;

  // Get team members
  const workspaceId = profile?.workspace_id;
  let members: Profile[] = [];

  if (workspaceId) {
    const { data: membersData } = await supabase
      .from("profiles")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    members = (membersData || []) as Profile[];
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">团队</h1>
          <p className="text-gray-500 mt-1">管理团队成员</p>
        </div>
        {profile?.role === "admin" && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            邀请成员
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold">团队成员</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {members?.map((member) => (
            <div key={member.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {member.full_name?.charAt(0) || member.email.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {member.full_name || member.email}
                </p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  member.role === "admin"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {member.role === "admin" ? "管理员" : "客服"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
