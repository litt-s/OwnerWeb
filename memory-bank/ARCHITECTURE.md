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
  -> server/uploads 提供头像与项目媒体静态文件
```

## 2. 分层职责

```text
页面层：src/pages
组件层：src/components
内容上下文：src/context/ContentContext.jsx
业务接口层：src/services（站点内容、项目、优势等领域接口）
静态兜底与种子数据：src/data/resume.js
登录态层：src/context/AuthContext.jsx
基础请求层：src/api.js
API 层：server/server.js
数据库层：server/db.js + SQLite
静态资源层：public + server/uploads
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

### 账号设置

```text
ProfilePage
  -> PUT /api/profile
  -> 更新 users.nickname
  -> POST /api/profile/avatar
  -> multer 保存头像到 server/uploads
  -> 更新 users.avatar
  -> GET /api/auth/me 刷新上下文
```

### 访客留言

```text
CommentsPage
  -> GuestbookComments
  -> GET /api/guestbook-comments
  -> Express LEFT JOIN users 读取用户当前 avatar
  -> 登录用户提交 POST /api/guestbook-comments
  -> Express 写入 guestbook_comments 表
  -> 前端重新加载留言列表
```

### 项目评论

```text
ProjectDetailPage
  -> ProjectComments(projectId)
  -> GET /api/projects/:projectId/comments
  -> Express LEFT JOIN users 读取用户当前 avatar
  -> 登录用户提交 POST /api/projects/:projectId/comments
  -> Express 校验项目 ID 与 parent_id
  -> Express 写入 project_comments 表，并继承 parent 的 root_id
  -> 前端根据 parent_id 组装并递归渲染评论树
```

### 项目内容

```text
ContentProvider
  -> ContentContext 初始化时保留 resume.js 项目兜底数据
  -> services/projects.js 调用 GET /api/projects
  -> Express 读取 projects 表
  -> Projects、ProjectDetailPage、Search 使用动态项目数据

AdminProjects
  -> services/projects.js 调用管理员项目接口
  -> POST /api/admin/projects 新增项目
  -> PUT /api/admin/projects/:id 修改项目
  -> DELETE /api/admin/projects/:id 删除项目及其评论
  -> POST /api/admin/projects/:id/video 更新项目视频
  -> POST /api/admin/projects/:id/cover 更新项目封面
  -> multer 保存媒体到 server/uploads/projects/{videos,covers}
  -> projects 表只保存 /uploads/... URL
```

### 个人优势

```text
ContentProvider
  -> ContentContext 初始化时保留 resume.js 优势兜底数据
  -> services/strengths.js 调用 GET /api/strengths
  -> Express 读取 strengths 表
  -> Strengths、Search 使用动态优势数据

AdminStrengths
  -> services/strengths.js 调用管理员优势接口
  -> POST /api/admin/strengths 新增优势
  -> PUT /api/admin/strengths/:id 修改优势
  -> DELETE /api/admin/strengths/:id 删除优势
  -> strengths 表只保存标题、描述和排序
```

### 站点基础内容

```text
ContentProvider
  -> ContentContext 初始化时保留 resume.js 的 profile、hero、experience 兜底数据
  -> services/siteContent.js 调用 GET /api/content/site
  -> Express 读取 site_content 单行配置
  -> Hero、Experience、Contact、Search 使用动态基础内容

AdminSiteContent
  -> services/siteContent.js 调用 GET /api/admin/content/site
  -> PUT /api/admin/content/site 修改身份联系信息、Hero 和经历内容
  -> site_content 表以 JSON 保存三段展示内容
```

### 管理后台

```text
AdminPage
  -> 校验 user.role === 'admin'
  -> GET /api/admin/comments
  -> DELETE /api/admin/guestbook-comments/:id
  -> DELETE /api/admin/project-comments/:id
  -> AdminProjects 调用项目增删改和媒体上传接口
  -> AdminStrengths 调用优势增删改接口
  -> AdminSiteContent 调用站点内容读取和更新接口
  -> GET /api/admin/users
  -> PATCH /api/admin/users/:id
  -> DELETE /api/admin/users/:id
  -> Express 使用 auth + admin 中间件校验权限
```

### 公网运行检查

```text
GET /api/health
  -> Express 执行 SELECT 1
  -> SQLite 连接正常时返回 200
  -> 反向代理和进程守护工具可据此判断 API 是否可用
```

## 5. 架构边界

- 页面只负责展示、交互和状态。
- `src/api.js` 负责统一 fetch、JSON、Bearer token 和错误处理。
- `AuthContext` 负责登录态，不直接操作数据库。
- Express 负责参数校验、鉴权、文件处理和数据库操作。
- SQLite 只保存用户、访客留言、项目评论、项目内容、个人优势、站点基础内容和账号资料。
- 旧 `comments` 表只在启动迁移时作为数据来源，迁移成功后删除，不参与业务读写。
- 项目、个人优势和站点基础内容以 SQLite 为准；`resume.js` 保留兜底数据，其他展示内容仍为前端静态数据。
- 头像文件由 Express 静态目录提供，数据库只保存 URL。
- 项目视频和封面由 Express 静态目录提供，数据库只保存 URL。
- 公网部署由前端静态托管、反向代理和独立 Node API 组成；数据库与上传目录必须位于持久化存储。
