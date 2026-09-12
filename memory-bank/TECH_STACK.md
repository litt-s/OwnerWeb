# OwnerWeb 技术栈规范

## 1. 技术栈结论

前端：

```text
框架：Vite + React 18 + JavaScript JSX
路由：React Router DOM 6
样式：普通 CSS
视觉增强：Three.js + @react-three/fiber + OGL
请求封装：src/api.js（支持 VITE_API_BASE）
业务接口：src/services/
```

后端（线上，主）：

```text
运行时：Cloudflare Workers
框架：Hono
数据库：Cloudflare D1（SQLite）
对象存储：Cloudflare KV（头像、项目封面）；项目视频存腾讯云 COS（公有读私有写，后端发预签名、后台直传，数据库只存链接），也兼容 B站/YouTube/直链外链
鉴权：PBKDF2（Web Crypto）密码哈希 + hono/jwt Bearer Token
上传：头像走 base64 JSON；项目封面走 multipart（视频改外链，不上传）
```

后端（本地，可选，已归档）：

```text
运行时：Node.js
框架：Express
数据库：SQLite（node:sqlite DatabaseSync）
鉴权：bcryptjs + jsonwebtoken
上传：本地 server/uploads 磁盘 + /uploads 静态目录
```

部署形态：

```text
前端：Cloudflare Pages（连 GitHub 自动构建）
后端：Cloudflare Workers（worker/）
数据：D1 数据库 + KV 命名空间
```

## 2. 为什么这样选

- Cloudflare Workers + D1 + KV 免费额度足够个人作品集，项目视频用外链，不占存储。
- Hono 轻量、原生适配 Workers，路由/中间件清晰。
- D1 是 SQLite，与本地数据模型一致，迁移成本低。
- KV 替代本地磁盘，解决 Serverless 无持久化磁盘的问题。
- 前端通过 `VITE_API_BASE` 解耦，后端可替换（见「一键切换后端」）。
- Node + Express 后端保留为本地开发备选，归档在桌面 `OwnerWeb-backend-node/`。

## 3. 目录约定

```text
src/pages        页面组件
src/components   首页区块、留言/评论、视觉组件、后台子组件
src/data         简历、项目和个人介绍等静态兜底/种子数据
src/context      登录态（AuthContext）与内容上下文（ContentContext）
src/services     认证、内容、评论等领域接口封装
src/hooks        通用 React Hook
src/styles       全局样式
worker/          Cloudflare Workers 后端（Hono + D1 + KV，唯一在库后端）
worker/src/lib   工具、播种、鉴权中间件
worker/src/routes 各业务路由模块
scripts/         一键切换/启动后端脚本
functions/       Cloudflare Pages Functions（可选：同源代理 /api）
deploy/          公网反向代理示例配置
memory-bank      项目上下文文档
public/          静态资源，包括项目演示视频与 SPA 回退 _redirects
dist/            前端构建产物
```

## 4. 环境变量与密钥

所有隐私与配置集中在根目录 **`.env.local`**（`.gitignore` 忽略），由 `npm run config`（`scripts/gen-config.mjs`）生成到各处：

```text
.env.local 字段            生成到
CF_WORKER_NAME/CF_D1_NAME/CF_D1_ID/CF_KV_ID  -> worker/wrangler.toml
JWT_SECRET/ADMIN_EMAIL/ADMIN_PASSWORD/CORS_ORIGIN -> worker/.dev.vars（本地）+ worker/.secrets.json（线上）
VITE_API_BASE                                    -> 无需生成，Vite 自动读取 .env.local（仅 VITE_ 前缀暴露给前端）
```

仓库提交的是模板 `.env.local.example`；真实 `.env.local`、`worker/wrangler.toml`、`worker/.dev.vars`、`worker/.secrets.json` 均不提交。

前端（构建期）：

```text
VITE_API_BASE=线上 Worker 域名；本地留空走 Vite 代理
```

Worker（`worker/wrangler.toml` 与 secrets）：

```text
wrangler.toml 绑定：D1（binding DB，database_id）、KV（binding MEDIA，id）
secret：JWT_SECRET、ADMIN_EMAIL、ADMIN_PASSWORD、CORS_ORIGIN
```

Node 后端（`server/.env`，归档时保留）：

```text
NODE_ENV、PORT、CORS_ORIGIN、DB_DIR、UPLOAD_DIR、JWT_SECRET、ADMIN_EMAIL、ADMIN_PASSWORD
```

注意：

- 密钥只放 Cloudflare secret 或本地 `.env`，**不写入代码或提交仓库**。
- 初始管理员在 `ADMIN_EMAIL` 与 `ADMIN_PASSWORD` 同时存在时创建。
- `CORS_ORIGIN` 为前端 Pages 域名（多个用逗号分隔）；未配置时允许任意来源。
- `.env`、`server/.env`、`worker/.dev.vars`、数据库与上传目录均被 `.gitignore` 忽略。

## 5. 编码约束

- 页面组件不直接写 `fetch`；统一经 `src/api.js` + `src/services/`。
- 动态内容请求使用 `cache: 'no-store'`。
- 登录态统一经 `AuthContext`。
- 两套后端实现**同一套 API**，前端不感知差异。
- Worker 密码使用 **PBKDF2（Web Crypto）**；Node 后端使用 bcryptjs。两者哈希格式不同，数据不通用。
- Worker 文件存 **KV**，数据库只保存 key；对外通过 `/media/<key>` 读取，返回 Worker 绝对地址。
- 头像上传用 **base64 JSON**（`{ dataUrl }`），项目封面用 **multipart**（`FormData`）；视频用外链 URL。
- D1/SQLite 连接需保证外键与索引；公开评论接口不返回 `email`/`user_id`。
- 后台操作必须同时校验登录态和管理员角色。
- 新增接口同步更新 `DATA_MODEL.md`；新增页面/路由同步更新 `ARCHITECTURE.md` 和 `DESIGN.md`。
- AI 协作只使用纯文本输出，不发送图片/截图；不自动打开浏览器。

## 6. 本地运行命令（一键切换后端）

后端**放哪个用哪个**：有 `server/server.js` 用 Node，否则用 Worker。

```bash
npm run start      # 一键：自动检测后端 + 启动前端（Vite 代理自动指向该后端端口）
npm run backend    # 只启动检测到的后端
npm run dev        # 只启动前端
npm run build      # 构建前端到 dist/
```

首次使用 Worker 本地环境：

```bash
cd worker && npm install
npx wrangler d1 execute ownerweb --local --file=./schema.sql
```

强制指定后端：`$env:BACKEND="node"` 或 `$env:BACKEND="worker"`（Windows PowerShell）。

本地地址：

```text
前端：http://localhost:5173
Worker（wrangler dev）：http://localhost:8787
Node（server/）：http://localhost:3001
```

检测逻辑在 `scripts/backend.mjs`，Vite 代理在 `vite.config.js` 自动读取其端口。

## 7. 部署命令

```bash
# 后端（Worker）
cd worker
npx wrangler d1 create ownerweb          # 首次，填 database_id
npx wrangler kv namespace create MEDIA
npx wrangler d1 execute ownerweb --remote --file=./schema.sql
npx wrangler secret put JWT_SECRET / ADMIN_EMAIL / ADMIN_PASSWORD / CORS_ORIGIN
npx wrangler deploy
```

前端：推送到 GitHub → Cloudflare Pages 连仓库（Build `npm run build`，输出 `dist`，`VITE_API_BASE` = Worker 域名）。

当前没有 lint 和测试命令，验证以构建、`wrangler deploy --dry-run`、接口手工检查和页面手工检查为主。
