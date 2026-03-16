# ChatLite 使用指南

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local` 并填写配置：

```bash
cp .env.example .env.local
```

**需要配置：**
- Supabase URL 和 Anon Key
- Stripe API Keys
- Stripe Price IDs（用于订阅）

### 3. 设置 Supabase 数据库

运行 SQL migrations：

```bash
# 在 Supabase Dashboard 中执行
# supabase/migrations/001_initial_schema.sql
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## 📦 功能

### 已完成
- ✅ Landing Page（首页）
- ✅ 用户认证（注册/登录）
- ✅ 客服仪表盘
- ✅ 对话管理（列表 + 详情）
- ✅ 团队管理
- ✅ 设置页面
- ✅ 数据分析框架
- ✅ 聊天 Widget（可嵌入网站）
- ✅ Realtime 消息同步
- ✅ Stripe 支付集成

### 核心功能
- **实时聊天**: 访客可以通过 Widget 发送消息，客服在仪表盘回复
- **团队协作**: 多个客服可以管理同一个工作空间的对话
- **订阅管理**: 14 天免费试用，之后$29/月

---

## 🎨 嵌入 Widget 到你的网站

在你的网站 HTML 中添加：

```html
<script src="http://localhost:3000/widget.js"></script>
<script>
  ChatLite.init({
    supabaseUrl: 'your-supabase-url',
    supabaseKey: 'your-supabase-key',
    workspaceSlug: 'your-workspace'
  });
</script>
```

---

## 📋 API 路由

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/stripe/checkout` | POST | 创建订阅结账 |
| `/api/stripe/webhook` | POST | Stripe Webhook |
| `/auth/callback` | GET | Supabase 认证回调 |

---

## 🚢 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

**环境变量**需要在 Vercel Dashboard 中配置。

---

## 🧪 测试

```bash
# 运行测试（待实现）
npm test
```

---

## 📖 技术栈

- **框架**: Next.js 16
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **实时**: Supabase Realtime
- **支付**: Stripe
- **部署**: Vercel

---

## 💰 定价

- **免费试用**: 14 天
- **Pro 版**: $29/月 或 $290/年（省 17%）

包括：
- 无限对话
- 最多 5 个客服
- 基础数据分析
- 邮件支持

---

## 📞 支持

有问题？联系 support@chatlite.com
