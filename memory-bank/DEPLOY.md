# OwnerWeb 部署说明

代码仓库：

```text
GitHub：https://github.com/litt-s/OwnerWeb.git   （origin）
Gitee ：https://gitee.com/soft-hardli/my-blog.git （gitee，保留）
```

部署形态：**GitHub + Cloudflare**（前端 Pages，后端 Workers，数据 D1 + R2），全免费。

## 1. 前置条件

- Node.js 16+ 与 npm。
- 已安装根目录依赖：

```bash
npm install
```

- 已安装 Worker 依赖并登录 Wrangler：

```bash
cd worker
npm install
npx wrangler login
```

## 2. 部署后端（Workers + D1 + R2）

```bash
cd worker

# 创建 D1 与 R2
npx wrangler d1 create ownerweb            # 复制返回的 database_id
npx wrangler r2 bucket create ownerweb-media
# 把 database_id 填进 worker/wrangler.toml 的 [[d1_databases]]

# 初始化数据库表
npx wrangler d1 execute ownerweb --remote --file=./schema.sql

# 配置密钥（不写入代码）
npx wrangler secret put JWT_SECRET
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put CORS_ORIGIN        # 前端 Pages 域名

# 部署
npx wrangler deploy
```

首次访问任意 `/api/*` 时会自动建管理员并播种站点内容（项目/优势/个人介绍）。

## 3. 部署前端（Cloudflare Pages）

1. 复制 `.env.production.example` 为 `.env.production`，填入 Worker 域名：

```text
VITE_API_BASE=https://ownerweb-api.<你的子域>.workers.dev
```

2. 推送到 GitHub。
3. Cloudflare 控制台 → Workers & Pages → Pages → 连接 GitHub 仓库，构建配置：

```text
Build command：npm run build
Build output directory：dist
环境变量：NODE_VERSION=20，VITE_API_BASE=https://ownerweb-api.<子域>.workers.dev
```

4. SPA 回退：仓库含 `public/_redirects`（`/* /index.html 200`），构建后自动生效，保证刷新 `/admin`、`/projects` 不 404。

## 4. 可选：同源代理（免 CORS）

仓库含 `functions/api/[[path]].js`（Pages Function）：

- 前端不设 `VITE_API_BASE`（走同源 `/api`）
- Pages 环境变量加 `API_ORIGIN = https://ownerweb-api.<子域>.workers.dev`

头像/视频由 Worker `/media/*` 提供，返回绝对地址，`<img>/<video>` 跨域加载无需 CORS。

## 5. 本地开发（一键切换后端）

后端放哪个用哪个：有 `server/` 用 Node，否则用 Worker。

```bash
npm run start      # 一键：自动检测后端 + 启动前端
npm run backend    # 只启动检测到的后端
npm run dev        # 只启动前端
```

首次使用 Worker 本地环境：

```bash
cd worker && npm install
npx wrangler d1 execute ownerweb --local --file=./schema.sql
```

强制指定：`$env:BACKEND="node"` 或 `$env:BACKEND="worker"`。

本地地址：前端 `http://localhost:5173`；Worker `http://localhost:8787`；Node `http://localhost:3001`。

## 6. 上线验证

- 首页、`/experience`、`/projects`、`/strengths`、`/comments` 能打开。
- 注册新账号、登录、退出、刷新后登录态正常。
- 账号设置中昵称修改、头像上传成功；头像经 `/media/...` 可访问。
- 密码修改成功后旧密码不能登录。
- 访客留言与项目评论（含任意层级回复）能提交并展示。
- 管理员能删除留言/评论、管理用户、管理项目/优势/站点内容、上传项目封面/视频。
- 项目详情页能播放演示视频（R2 出网免费）。
- 刷新 `/projects`、`/admin` 不 404。
- `GET /api/health` 返回 200。
- 重新部署 Worker 后，D1 数据与 R2 文件仍在。

## 7. 常见问题

| 现象 | 原因 / 解决 |
|---|---|
| 前端请求失败 / CORS | Worker 未设 `CORS_ORIGIN`；或 `VITE_API_BASE` 填错 |
| 刷新 `/admin` 404 | `public/_redirects` 未生效（确认构建输出 `dist/_redirects`） |
| `no such table` | 未执行 `wrangler d1 execute ... --file=./schema.sql` |
| 管理员登录不了 | 未设 `ADMIN_EMAIL` / `ADMIN_PASSWORD` secret |
| 上传报错 | 未创建 R2 桶，或 `wrangler.toml` 未绑定 `r2_buckets` |
| Worker CPU 超限 | 免费版 CPU 10ms；PBKDF2 迭代数见 `worker/src/password.js`，可调低 |
| 图片不显示 | `/media/*` 路由或 R2 绑定问题 |
