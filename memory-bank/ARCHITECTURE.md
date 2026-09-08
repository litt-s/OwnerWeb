# OwnerWeb 项目结构说明

> 本文档是 OwnerWeb 的项目结构说明，用于说明目录分层、页面路由、请求链路、核心数据流和系统边界。

## 1. 总体架构

```text
浏览器
  -> React 页面与组件
  -> src/api.js 调用 /api
  -> 开发环境：Vite proxy 转发到 localhost:3001
  -> Express API
  -> SQLite ownerweb.db
  -> server/uploads 提供头像静态文件
```

## 2. 分层职责

```text
页面层：src/pages
组件层：src/components
静态数据层：src/data/resume.js
登录态层：src/context/AuthContext.jsx
接口封装层：src/api.js
API 层：server/server.js
数据库层：server/db.js + SQLite
静态资源层：public + server/uploads
```

## 3. 页面关系

```text
/                首页：Hero、经历、项目、优势、联系
/experience      个人经历页
/projects        精选项目列表
/projects/:id    项目详情页 + 项目留言
/strengths       个人优势页
/comments        访客留言页
/auth            登录 / 注册页
/profile         个人主页：资料、头像、密码
/admin           管理后台：评论、用户
/*               兜底到首页
```

## 4. 核心数据流

### 登录与注册

```text
AuthPage
  -> AuthContext.login / register
  -> api('/api/auth/login' | '/api/auth/register')
  -> Express 校验账号密码
  -> 返回 token 和 publicUser
  -> localStorage 保存 token
  -> AuthContext 保存用户状态
```

### 恢复登录态

```text
AuthProvider
  -> 读取 localStorage token
  -> GET /api/auth/me
  -> Express 校验 JWT 与用户状态
  -> 返回 publicUser
  -> 页面恢复登录态
```

### 个人资料维护

```text
ProfilePage
  -> PUT /api/profile
  -> 更新 users.nickname / users.bio
  -> POST /api/profile/avatar
  -> multer 保存头像到 server/uploads
  -> 更新 users.avatar
  -> GET /api/auth/me 刷新上下文
```

### 留言

```text
CommentsSection
  -> GET /api/comments
  -> 按 topic 过滤展示
  -> 登录用户提交 POST /api/comments
  -> Express 写入 comments 表
  -> 前端重新加载留言列表
```

### 管理后台

```text
AdminPage
  -> 校验 user.role === 'admin'
  -> DELETE /api/admin/comments/:id
  -> GET /api/admin/users
  -> PATCH /api/admin/users/:id
  -> DELETE /api/admin/users/:id
  -> Express 使用 auth + admin 中间件校验权限
```

## 5. 架构边界

- 页面只负责展示、交互和状态。
- `src/api.js` 负责统一 fetch、JSON、Bearer token 和错误处理。
- `AuthContext` 负责登录态，不直接操作数据库。
- Express 负责参数校验、鉴权、文件处理和数据库操作。
- SQLite 只保存用户、评论和账号资料。
- 简历、项目、优势等展示型内容第一版保存在前端静态数据。
- 头像文件由 Express 静态目录提供，数据库只保存 URL。
