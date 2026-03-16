import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import type { Profile, Workspace } from '@/types';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user's workspace
  const { data: profileData } = await supabase
    .from('profiles')
    .select('workspace_id')
    .eq('id', user.id)
    .single();
  const profile = profileData as Profile | null;

  const workspaceId = profile?.workspace_id;
  let workspace: Workspace | null = null;

  if (workspaceId) {
    const { data: workspaceData } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();
    workspace = workspaceData as Workspace | null;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
        <p className="text-gray-500 mt-1">管理您的账户和偏好设置</p>
      </div>

      <div className="space-y-6">
        {/* Workspace settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">工作空间</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名称
              </label>
              <input
                type="text"
                defaultValue={workspace?.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                订阅状态
              </label>
              <p className="text-gray-600">
                {workspace?.subscription_status === 'trial'
                  ? `试用中 (截止: ${workspace?.trial_ends_at ? new Date(workspace.trial_ends_at).toLocaleDateString('zh-CN') : 'N/A'})`
                  : workspace?.subscription_status === 'active'
                  ? '已订阅'
                  : '未订阅'}
              </p>
            </div>
          </div>
        </div>

        {/* Widget settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">聊天组件</h2>
          <p className="text-gray-500 mb-4">将以下代码添加到您的网站以启用聊天组件：</p>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`<script>
  (function() {
    var d = document;
    var s = d.createElement('script');
    s.src = '${process.env.NEXT_PUBLIC_APP_URL}/widget.js?workspace=${workspace?.id}';
    s.async = 1;
    d.getElementsByTagName('head')[0].appendChild(s);
  })();
</script>`}
          </pre>
        </div>

        {/* Account settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">账户</h2>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-red-600 hover:text-red-700 font-medium"
            >
              退出登录
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
