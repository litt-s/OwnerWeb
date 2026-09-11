# OwnerWeb 项目结构说明

> 本文档是 OwnerWeb 的项目结构说明，用于说明目录分层、页面路由、请求链路、核心数据流和系统边界。

## 1. 总体架构

```text
浏览器
  -> React 页面与组件
  -> src/api.js 调用 `${VITE_API_BASE}/api`
  -> 本地：Vite proxy 转发 /api 到本地后端（Worker:8787 或 Node:3001）
  -> 线上：Cloudflare Worker（Hono）
  -> D1 数据库（用户 / 留言 / 项目评论 / 项目 / 优势 / 站点内容）
  -> R2 存储桶（头像 / 项目封面 / 视频），经 `/media/<key>` 读取
```

后端有两种实现，接口一致，前端不感知：

```text
线上主后端：worker/（Cloudflare Workers + Hono + D1 + R2）
本地可选后端：server/（Node + Express + node:sqlite + 本地磁盘，归档在桌面）
```

## 2. 分层职责

```text
页面层：src/pages
组件层：src/components（含留言/评论组件、后台子组件）
内容上下文：src/context/ContentContext.jsx
登录态：src/context/AuthContext.jsx
业务接口层：src/services
静态兜底与种子数据：src/data/resume.js
基础请求层：src/api.js（支持 VITE_API_BASE）
后端（线上）：worker/src（index + lib + routes）
后端（本地）：server/（归档）
存储：Cloudflare D1 + R2
启动脚本：scripts/backend.mjs、scripts/dev.mjs
```

## 3. 页面关系

```text
/                首页：Hero、经历、项目、优势、联系
/experience      个人经历页
/projects        精选项目列表
/projects/:id    项目详情页 + 项目多级评论
/strengths       个人优势页
/comments        访客留言页
/auth            登录 / 注册页
/settings        账号设置：昵称、头像、密码
/profile         旧地址，重定向到 /settings
/admin           管理后台：内容、评论、项目、优势、用户
/*               兜底到首页
```

## 4. 核心数据流

### 登录与注册

```text
AuthPage
  -> AuthContext.login / register
  -> api('/api/auth/login' | '/api/auth/register')
  -> Worker：PBKDF2 校验密码（Node：bcrypt）
  -> 返回 token 和 publicUser
  -> localStorage 保存 token，AuthContext 保存用户状态
```

### 恢复登录态

```text
AuthProvider -> 读取 token -> GET /api/auth/me -> 校验 JWT 与封禁状态 -> publicUser
```

### 账号设置

```text
SettingsPage
  -> PUT /api/profile 更新昵称
  -> POST /api/profile/avatar（base64 JSON { dataUrl }）
     -> Worker：写入 R2，users.avatar 保存 R2 key
     -> 返回头像绝对地址（Worker 经 /media/<key>）
  -> GET /api/auth/me 刷新上下文
```

### 访客留言

```text
CommentsPage -> GuestbookComments
  -> GET /api/guestbook-comments（LEFT JOIN users 带出头像）
  -> 登录用户 POST /api/guestbook-comments 写入 guestbook_comments
  -> 前端重新加载留言列表
```

### 项目评论

```text
ProjectDetailPage -> ProjectComments(projectId)
  -> GET /api/projects/:projectId/comments（LEFT JOIN users 带出头像）
  -> 登录用户 POST 校验项目与 parent_id，继承 root_id
  -> 前端按 parent_id 组装并递归渲染评论树
```

### 项目内容

```text
ContentProvider -> services/projects.js -> GET /api/projects -> D1 projects 表
AdminProjects
  -> POST/PUT/DELETE /api/admin/projects(/:id)
  -> POST /api/admin/projects/:id/cover | /video（multipart）
     -> Worker：写入 R2，projects 表保存 R2 key
  -> 删除项目同时删除其评论
```

### 个人优势

```text
ContentProvider -> services/strengths.js -> GET /api/strengths -> D1 strengths 表
AdminStrengths -> POST/PUT/DELETE /api/admin/strengths(/:id)
```

### 站点基础内容

```text
ContentProvider -> services/siteContent.js -> GET /api/content/site -> D1 site_content 单行
AdminSiteContent -> GET/PUT /api/admin/content/site
```

### 管理后台

```text
AdminPage（校验 role === 'admin'）
  -> GET /api/admin/comments
  -> DELETE /api/admin/guestbook-comments/:id | /api/admin/project-comments/:id
  -> AdminProjects / AdminStrengths / AdminSiteContent
  -> GET/PATCH/DELETE /api/admin/users(/:id)
  -> Worker：auth + adminOnly 中间件校验
```

### 健康检查

```text
GET /api/health -> 执行 SELECT 1 -> D1 正常时返回 200
```

## 5. 后端模块（worker/）

```text
src/index.js        入口：CORS、播种中间件、健康检查、挂载路由、/media、notFound
src/password.js     PBKDF2 密码哈希/校验
src/lib/util.js     DTO、校验、媒体 URL 工具
src/lib/seed.js     首次播种站点内容/项目/优势并创建管理员
src/lib/auth.js     auth 与 adminOnly 中间件
src/routes/auth.js     /api/auth
src/routes/profile.js  /api/profile
src/routes/public.js   /api/strengths、/content/site、/projects、评论
src/routes/admin.js    /api/admin/*
src/routes/media.js    /media/*
```

## 6. 一键切换后端

```text
scripts/backend.mjs  detectBackend()：
  - 有 server/server.js   -> Node（3001）
  - 否则有 worker/wrangler.toml -> Worker（8787）
  - 可用 BACKEND=node|worker 强制
vite.config.js 引入 detectBackend()，自动把 /api 代理到对应端口
scripts/dev.mjs 一键同时启动后端与前端
```

## 7. 架构边界

- 页面只负责展示、交互和状态；`src/api.js` 统一 fetch/JSON/Bearer/错误处理。
- `AuthContext` 负责登录态，不直接操作数据库。
- 后端负责参数校验、鉴权、文件处理和数据库操作（Worker 与 Node 实现同一套接口）。
- D1/SQLite 保存用户、访客留言、项目评论、项目内容、个人优势、站点基础内容与账号资料。
- Worker 文件存 R2，数据库只保存 key；对外经 `/media/<key>` 返回绝对地址。
- `src/data/resume.js` 是静态兜底与初始化种子；已接管的内容模块以数据库为准。
- 线上部署由 Cloudflare Pages（前端）+ Workers（API）+ D1 + R2 组成；本地开发由 Vite + 本地后端组成。
