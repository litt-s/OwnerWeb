# OwnerWeb

嵌入式软件工程师的个人作品集网站。包含全屏 3D PCB 首屏、个人经历、精选项目（含详情与视频）、个人优势、访客留言与项目评论、邮箱注册登录、账号设置和管理后台。

线上采用 **GitHub + Cloudflare** 全免费部署：前端 Cloudflare Pages，后端 Cloudflare Workers + D1 + R2。

## 功能特性

- **首页**：全屏 Hero，three.js 渲染的可交互 STM32 PCB（点击元件跳转各页面）、红色极光背景。
- **内容展示**：个人经历（含 three.js 金属硬币）、精选项目列表与详情页（介绍 + 视频）、个人优势。
- **账号体系**：邮箱注册 / 登录（JWT），账号设置（昵称、头像、修改密码）。
- **留言与评论**：访客留言、项目多级评论与回复，评论展示用户头像。
- **管理后台**：评论管理、用户管理（角色 / 封禁 / 删除）、项目管理（含封面上传）、优势管理、站点内容管理。
- **内容可后台维护**：项目、优势、Hero / 身份联系信息 / 经历均由数据库驱动，`src/data/resume.js` 作为兜底与初始种子。

## 技术栈

前端：

- Vite + React 18 + JavaScript JSX
- React Router DOM 6
- 视觉：Three.js + @react-three/fiber + OGL（PCB、硬币、Aurora 等）

后端（线上，主）：

- Cloudflare Workers + Hono
- 数据库：Cloudflare D1（SQLite）
- 对象存储：Cloudflare R2（头像、项目封面、视频，经 `/media/*` 访问）
- 鉴权：PBKDF2（Web Crypto）+ `hono/jwt`

后端（本地，可选，已归档在文件 `OwnerWeb-backend-node/`）：

- Node.js + Express
- 数据库：SQLite（`node:sqlite`）
- 鉴权：bcryptjs + jsonwebtoken
- 上传：本地 `server/uploads` 磁盘

两套后端实现**同一套 API**，前端通过 `VITE_API_BASE` 解耦，不感知差异。

## 项目结构

```text
src/            前端源码（pages / components / context / services / data / styles）
worker/         Cloudflare Workers 后端（Hono + D1 + R2，唯一在库后端）
  src/index.js    入口：CORS、播种、健康检查、挂载路由、/media
  src/lib/        工具、播种、鉴权中间件
  src/routes/     auth / profile / public / admin / media
  schema.sql      D1 建表
  wrangler.toml   D1 / R2 绑定与配置
scripts/        一键检测/启动后端（backend.mjs、dev.mjs）
functions/      Cloudflare Pages Functions（可选：同源代理 /api）
deploy/         反向代理示例配置
public/         静态资源、SPA 回退 `_redirects`
memory-bank/    项目上下文文档（PRD / 架构 / 数据模型 / 部署等）
```

## 本地开发

先准备隐私与配置：复制 `.env.local.example` 为 `.env.local`，填写 ID / 密码 / 邮箱等，然后生成各处配置。

```powershell
Copy-Item .env.local.example .env.local
# 编辑 .env.local 后：
npm run config
```

`npm run config` 会据 `.env.local` 生成：`worker/wrangler.toml`（D1/R2 绑定）、`worker/.dev.vars`（本地密钥）、`worker/.secrets.json`（线上 secrets）。前端 `VITE_API_BASE` 由 Vite 自动从 `.env.local` 读取，无需额外文件。`.env.local` 已被 `.gitignore` 忽略。

一键启动（自动检测后端并启动前端；`npm run start` 会自动先跑 `config`）：

```bash
npm install
npm run start
```

后端「放哪个用哪个」：项目里有 `server/server.js` 用 Node，否则用 Cloudflare Worker（`wrangler dev`）。可用 `BACKEND=node|worker` 强制指定。Vite 会自动把 `/api` 代理到对应后端端口。

首次使用 Worker 本地环境：

```bash
cd worker
npm install
npx wrangler d1 execute ownerweb --local --file=./schema.sql
```

其他命令：

```bash
npm run backend    # 只启动检测到的后端
npm run dev        # 只启动前端
npm run build      # 构建前端到 dist/
```

本地地址：

```text
前端：http://localhost:5173
Worker（wrangler dev）：http://localhost:8787
Node（server/）：http://localhost:3001
```

## 环境变量与密钥

所有隐私与配置集中在根目录 **`.env.local`**（已被 `.gitignore` 忽略），由 `npm run config` 生成到各处：

| `.env.local` 字段 | 生成到 | 说明 |
|---|---|---|
| `CF_D1_ID` / `CF_D1_NAME` / `CF_R2_BUCKET` / `CF_WORKER_NAME` | `worker/wrangler.toml` | D1 / R2 绑定 |
| `JWT_SECRET` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `CORS_ORIGIN` | `worker/.dev.vars`（本地）、`worker/.secrets.json`（线上） | 密钥 |
| `VITE_API_BASE` | 无需生成，Vite 自动从 `.env.local` 读取 | 前端线上 API 地址 |

线上 secrets 上传：

```bash
cd worker
npx wrangler secret bulk .secrets.json
```

密钥只放 `.env.local` 或 Cloudflare secret，**不写入代码或提交仓库**；`.env.local`、`worker/.dev.vars`、`worker/.secrets.json`、`worker/wrangler.toml` 均已被 `.gitignore` 忽略。

## 部署（GitHub + Cloudflare）

后端：

```bash
cd worker
npm install
npx wrangler login
npx wrangler d1 create ownerweb            # 填 database_id 到 wrangler.toml
npx wrangler r2 bucket create ownerweb-media
npx wrangler d1 execute ownerweb --remote --file=./schema.sql
npx wrangler secret bulk .secrets.json     # 由 npm run config 从 .env.local 生成
npx wrangler deploy
```

前端：推送到 GitHub → Cloudflare Pages 连接仓库（Build `npm run build`，输出 `dist`，环境变量 `VITE_API_BASE` = Worker 域名）。仓库含 `public/_redirects`，自动处理 SPA 回退。

完整步骤、验证清单与排查见 **`DEPLOY.md`**。

## 文档

项目上下文文档在 `memory-bank/`：

- `PRD.md` 产品需求 · `DESIGN.md` 视觉与交互
- `ARCHITECTURE.md` 项目结构 · `DATA_MODEL.md` 数据模型与接口
- `TECH_STACK.md` 技术栈 · `DEPLOY.md` 部署 · `TASKS.md` 任务 · `PROGRESS.md` 进度 · `LEARNINGS.md` 踩坑
