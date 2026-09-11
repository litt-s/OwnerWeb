# OwnerWeb 部署说明

代码仓库：

```text
GitHub：https://github.com/litt-s/OwnerWeb.git   （origin）
Gitee ：https://gitee.com/soft-hardli/my-blog.git （gitee，保留）
```

部署形态：**GitHub + Cloudflare**（前端 Pages，后端 Workers，数据 D1 + KV），全免费。

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

## 2. 部署后端（Workers + D1 + KV）

```bash
cd worker

# 创建 D1 与 KV
npx wrangler d1 create ownerweb            # 复制返回的 database_id
npx wrangler kv namespace create MEDIA
# 把 database_id 填进 worker/wrangler.toml 的 [[d1_databases]]

# 初始化数据库表
npx wrangler d1 execute ownerweb --remote --file=./schema.sql

# 配置密钥：先在根目录 .env.local 填好，运行 `npm run config` 生成 worker/.secrets.json
npx wrangler secret bulk .secrets.json

# 部署
npx wrangler deploy
```

## 2.1 隐私与配置集中到 .env.local

所有需要填写的 ID / 密码 / 邮箱 / 域名集中在根目录 **`.env.local`**（已被 `.gitignore` 忽略）：

```text
CF_WORKER_NAME / CF_D1_NAME / CF_D1_ID / CF_KV_ID
ADMIN_EMAIL / ADMIN_PASSWORD / JWT_SECRET
CORS_ORIGIN / VITE_API_BASE
```

`npm run config`（脚本 `scripts/gen-config.mjs`）据 `.env.local` 生成：

```text
worker/wrangler.toml    D1/KV 绑定（database_id、bucket_name）
worker/.dev.vars        本地 wrangler dev 的密钥
worker/.secrets.json    线上 secrets（wrangler secret bulk 用）
```

`VITE_API_BASE` 不生成文件：Vite 会自动加载根目录 `.env.local`，且只有 `VITE_` 前缀变量会暴露给前端，直接读取即可。线上构建在 Cloudflare Pages 设置环境变量 `VITE_API_BASE`（或本地构建时 `.env.local` 已填）。

`.env.local` 不存在时脚本跳过；`npm run start` 会自动先执行 `config`。提交到仓库的是模板 `.env.local.example`，真实 `.env.local` 与生成物均不提交。

首次访问任意 `/api/*` 时会自动建管理员并播种站点内容（项目/优势/个人介绍）。

## 3. 部署前端（Cloudflare Pages）

1. 推送到 GitHub。
2. Cloudflare 控制台 → Workers & Pages → Pages → 连接 GitHub 仓库，构建配置（`VITE_API_BASE` 在 Pages 环境变量里设为 Worker 域名；本地构建时 Vite 会自动读取 `.env.local`）：

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

头像/封面由 Worker `/media/*` 提供，返回绝对地址；项目视频为外链。

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
- 项目详情页能播放演示视频（外链 B站/YouTube/直链）。
- 刷新 `/projects`、`/admin` 不 404。
- `GET /api/health` 返回 200。
- 重新部署 Worker 后，D1 数据与 KV 文件仍在。

## 7. 常见问题

| 现象 | 原因 / 解决 |
|---|---|
| 前端请求失败 / CORS | Worker 未设 `CORS_ORIGIN`；或 `VITE_API_BASE` 填错 |
| 刷新 `/admin` 404 | `public/_redirects` 未生效（确认构建输出 `dist/_redirects`） |
| `no such table` | 未执行 `wrangler d1 execute ... --file=./schema.sql` |
| 管理员登录不了 | 未设 `ADMIN_EMAIL` / `ADMIN_PASSWORD` secret |
| 上传报错 | 未创建 KV 命名空间，或 `wrangler.toml` 未绑定 `kv_namespaces` |
| Worker CPU 超限 | 免费版 CPU 10ms；PBKDF2 迭代数见 `worker/src/password.js`，可调低 |
| 图片不显示 | `/media/*` 路由或 KV 绑定问题 |
