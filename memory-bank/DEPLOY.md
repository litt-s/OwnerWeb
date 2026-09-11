# OwnerWeb 部署说明

代码仓库：

```text
https://gitee.com/soft-hardli/my-blog.git
```

## 1. 前置条件

- Node.js 版本必须支持 `node:sqlite`。
- 已安装根目录依赖：

```bash
npm install
```

- 已安装 API 依赖：

```bash
cd server
npm install
```

- 已在 `server/.env` 配置：

```text
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://blog.example.com
DB_DIR=/var/lib/ownerweb/data
UPLOAD_DIR=/var/lib/ownerweb/uploads
JWT_SECRET=强随机密钥
ADMIN_EMAIL=管理员邮箱
ADMIN_PASSWORD=强密码
```

如果还没有环境变量文件，先复制示例：

```powershell
Copy-Item server/.env.example server/.env
```

API 启动时必须存在 `JWT_SECRET`，否则服务会直接退出。初始管理员只有在 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 同时配置时才会创建。

## 2. 本地启动

需要两个终端。

终端一，启动 API：

```bash
cd server
npm run dev
```

终端二，启动前端：

```bash
npm run dev
```

本地地址：

```text
前端：http://localhost:5173
API：http://localhost:3001
```

重要协作规则：AI 不自动打开浏览器。需要用户查看页面时，只提供以上文本链接，由用户手动打开。

当前 `vite.config.js` 已配置 `server.open: false`，启动前端开发服务不会自动打开浏览器。

## 3. 构建前端

```bash
npm run build
```

构建产物在：

```text
dist/
```

## 4. API 服务部署

当前项目还没有确定的线上部署平台。部署 API 时必须满足：

- 使用进程守护工具运行 `server/server.js`。
- 生产环境显式配置 `JWT_SECRET`。
- 生产环境必须设置 `NODE_ENV=production`；缺少 `CORS_ORIGIN`、`DB_DIR` 或 `UPLOAD_DIR` 时 API 会拒绝启动。
- 生产环境显式配置 `CORS_ORIGIN`，填写真实前端 HTTPS 地址；多个来源用逗号分隔。
- 初始管理员账号密码通过环境变量注入。
- `DB_DIR` 和 `UPLOAD_DIR` 必须指向服务器持久化磁盘；相对路径相对于 `server/` 目录解析。
- 数据库目录必须允许 API 进程读写，并纳入定期备份。
- 上传目录必须允许 API 进程读写，并纳入定期备份。
- 首次启动新版 API 时会自动把旧 `comments` 表数据拆入两张新评论表，迁移成功后删除旧表。
- 首次启动时，如果 `projects` 表为空，会使用 `src/data/resume.js` 初始化项目数据。
- 首次启动时，如果 `site_content` 表为空，会使用 `src/data/resume.js` 初始化 Hero、身份联系信息和经历内容。
- `server/uploads/projects/videos/` 和 `server/uploads/projects/covers/` 必须随 `server/uploads/` 持久化。
- API 域名必须允许前端域名跨域访问，当前代码已启用 `cors()`。
- 上传目录必须通过 `/uploads` 暴露。
- API 健康检查为 `GET /api/health`，返回 `{"ok":true,"service":"ownerweb-api"}` 时表示数据库连接正常。

## 5. 前端部署

当前项目还没有确定的线上域名和托管平台。部署静态前端时必须满足：

- 托管 `dist/` 静态文件。
- 将 `/api/*` 反向代理到 API 服务。
- 将 `/uploads/*` 反向代理到 API 服务或静态存储。
- 上传项目视频时，反向代理必须允许足够大的请求体；当前应用端限制为 500MB。
- Nginx 配置可参考 `deploy/nginx.conf.example`，其中包含 History fallback、`/api/`、`/uploads/` 和 500MB 请求体配置。
- 为 React Router 配置 History 回退，未知路径回退到 `index.html`。

## 6. 上线验证

- 首页能打开，视觉背景和导航正常。
- `/experience`、`/projects`、`/strengths`、`/comments` 能打开。
- `/experience` 的身份、教育认证、经历简介和统计读取后台站点内容。
- `/strengths` 能读取后台维护的优势数据。
- 项目详情页能打开并播放演示视频。
- `/projects` 和 `/projects/:id` 能读取后台维护的项目数据。
- 注册新账号成功。
- 登录、退出、刷新后登录态恢复正常。
- 账号设置中的昵称修改和头像上传成功。
- 密码修改成功，旧密码不能再登录。
- 访客留言和回复能提交并展示。
- 项目详情页能提交顶层评论，并能看到任意层级回复。
- 管理员能分别删除访客留言和项目评论。
- 管理员能新增、编辑、删除项目；删除项目前出现二次确认。
- 管理员能上传或替换项目视频和封面；公网访问对应媒体 URL 正常。
- 管理员能新增、编辑、删除个人优势，并调整排序。
- 管理员能修改 Hero、身份联系信息、教育认证和经历内容；保存后前台刷新可见。
- 管理员能查看、调整、封禁、解封和删除用户。
- 普通用户访问 `/admin` 时被拒绝。
- `GET /api/health` 返回 200，且 API 能访问持久化数据库目录。
- 重启 API 后用户、评论、项目内容、个人优势和站点配置仍然存在。
- 从后台上传的视频和封面在重启 API 后仍可通过 `/uploads/` 访问。
- 生产环境只允许配置的前端来源通过 CORS 访问 API。
