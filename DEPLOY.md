# OwnerWeb 部署文档（GitHub + Cloudflare，全免费）

## 架构

| 层 | 技术 | Cloudflare 产品 |
|---|---|---|
| 前端 | React + Vite（静态） | **Pages**（连 GitHub 自动构建） |
| 后端 | Node → **Hono**（Workers 运行时） | **Workers**（`worker/`） |
| 数据库 | SQLite → **D1** | D1 数据库 `ownerweb` |
| 文件 | 本地磁盘 → **KV** | KV 命名空间 `ownerweb-media`（免出网流量费） |

> 代码位置：后端为 `worker/`（Workers+Hono+D1+KV）。Node 后端已归档到桌面，可选放回 `server/` 用于本地开发；两者接口完全一致，本地用 `npm run start` 自动切换。

免费额度足够个人作品集：Workers 10 万请求/天、D1 5GB、KV 1GB。

---

## 一、部署后端（Workers + D1 + KV）

### 1. 安装依赖并登录
```bash
cd worker
npm install
npx wrangler login
```

### 2. 创建 D1 与 KV
```bash
npx wrangler d1 create ownerweb        # 复制返回的 database_id
npx wrangler kv namespace create MEDIA
```
把返回的 `database_id` 填进根目录 **`.env.local`** 的 `CF_D1_ID`（先 `Copy-Item .env.local.example .env.local`），然后生成配置：
```bash
npm run config
```
`npm run config` 会据 `.env.local` 生成 `worker/wrangler.toml`（D1/KV 绑定）等。

### 3. 初始化数据库表
```bash
npx wrangler d1 execute ownerweb --remote --file=./schema.sql
```

> 注意：`schema.sql` 用的是 `CREATE TABLE IF NOT EXISTS`，**对已存在的表不会补列**。如果线上库是更早版本，需要手动执行增量迁移：
> ```bash
> # 「联系我」标题可编辑（3.28）
> npx wrangler d1 execute ownerweb --remote --command "ALTER TABLE site_content ADD COLUMN contact_json TEXT NOT NULL DEFAULT '{}'"
> ```
> 本地库同理（加 `--local`），或直接删除 `worker/.wrangler` 后重跑 `schema.sql`。

### 4. 配置密钥（不要写进代码/仓库）
在 `.env.local` 填好 `JWT_SECRET` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `CORS_ORIGIN`，运行 `npm run config` 生成 `worker/.secrets.json`，再上传：
```bash
cd worker
npx wrangler secret bulk .secrets.json
```

### 5. 部署
```bash
npx wrangler deploy
```
得到 Worker 域名，例如 `https://ownerweb-api.<你的子域>.workers.dev`。
首次访问任意 `/api/*` 时会自动建管理员并播种站点内容（项目/优势/个人介绍）。

---

## 二、部署前端（Cloudflare Pages）

1. 推送到 GitHub。
2. Cloudflare 控制台 → Workers & Pages → Pages → 连接 GitHub 仓库，构建配置：

   | 项 | 值 |
   |---|---|
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | 环境变量 | `NODE_VERSION=20`，`VITE_API_BASE=https://ownerweb-api.<子域>.workers.dev` |

   在 Pages 里设 `VITE_API_BASE`（Worker 域名，公开信息）；本地构建时 Vite 会自动读取 `.env.local` 的同名变量，无需额外文件。

3. SPA 回退：仓库已含 `public/_redirects`（`/* /index.html 200`），构建后自动生效，保证刷新 `/admin`、`/projects` 不 404。

---

## 三、可选：同源代理（免 CORS）

仓库含 `functions/api/[[path]].js`（Pages Function）。若想让前端同源请求 `/api`、免跨域：
- 前端不设 `VITE_API_BASE`（留空，走同源 `/api`）
- Pages 环境变量加 `API_ORIGIN = https://ownerweb-api.<子域>.workers.dev`

> 头像/封面由 Worker 的 `/media/*` 提供，返回 Worker 绝对地址；项目视频为外链（B站/YouTube/直链）。

---

## 三之五、项目视频：腾讯云 COS（公有读私有写）

项目视频存在腾讯云 COS：**后端发预签名、后台直传**，数据库只存最终链接。

### 1. 控制台准备
1. 对象存储 COS → 创建存储桶：名称全局唯一（如 `ownerweb-media`，控制台会加 APPID 后缀）、地域就近（如 `ap-guangzhou`）、访问权限选 **公有读私有写**。
2. 访问管理 CAM → 新建**子账号**（仅编程访问），授予 `QcloudCOSDataFullControl`（或仅该桶读写策略），保存 `SecretId` / `SecretKey`（SecretKey 只显示一次）。**不要用主账号密钥**。
3. 桶 → 安全管理 → 跨域访问 CORS，添加规则：
   - 来源：`https://ownerweb.pages.dev`（本地调试再加 `http://localhost:5173`）
   - 操作：`PUT, GET, HEAD, POST`
   - Allow-Headers：`*`；Expose-Headers：`ETag, x-cos-request-id`；Max-Age：`600`

### 2. 配置密钥
在根目录 `.env.local` 填：
```text
COS_SECRET_ID=
COS_SECRET_KEY=
COS_BUCKET=ownerweb-media-<APPID>
COS_REGION=ap-guangzhou
COS_VIDEO_PREFIX=videos/
COS_DOMAIN=            # 可选，自定义/CDN 域名；留空用 COS 默认域名
```
然后 `npm run config` 生成配置，再上传 secrets：
```bash
cd worker
npx wrangler secret bulk .secrets.json
npx wrangler deploy
```

### 3. 使用
后台 → 项目管理 → 编辑项目 → 「演示视频链接」下点 **上传视频到 COS**（自动填入链接）→ 保存项目。
也可直接粘贴 B站 / YouTube / 直链。新项目请先保存再上传。

> 说明：上传走浏览器直传 COS，不经 Worker；桶为公有读，视频直链可直接播放。若用自定义/CDN 域名，需自行备案。

---

## 四、验证清单

1. 打开 Pages 域名 → 首页、PCB 交互、蜂鸣器跳转留言页正常。
2. 注册邮箱账号 → 登录 → 个人主页上传头像（写入 KV）→ 改密码。
3. 管理员登录（`ADMIN_EMAIL` + `ADMIN_PASSWORD`）→ 后台：删除留言/评论、管理用户、管理项目/优势/站点内容、上传项目封面/视频。
4. 刷新 `/projects`、`/admin` 不 404。
5. 视频播放：外链视频（B站/YouTube/直链）在前端嵌入播放。

---

## 五、常见问题排查

| 现象 | 原因 / 解决 |
|---|---|
| 前端请求失败 / CORS | Worker 未设 `CORS_ORIGIN` 为 Pages 域名；或 `VITE_API_BASE` 填错 |
| 刷新 `/admin` 404 | `public/_redirects` 未生效（确认构建输出 `dist/_redirects`） |
| `no such table` | 未执行 `wrangler d1 execute ... --file=./schema.sql` |
| 管理员登录不了 | 未设 `ADMIN_PASSWORD` secret，或 `ADMIN_EMAIL` 不对 |
| 上传报错 | 未创建 KV 命名空间 / `wrangler.toml` 的 `kv_namespaces` 未绑定 |
| Worker 报 CPU 超限 | 免费版 CPU 10ms；PBKDF2 已用 10 万次迭代，若超限可在 `worker/src/password.js` 调低 `ITERATIONS` |
| 图片不显示 | `/media/*` 路由或 KV 绑定问题；确认返回的是 Worker 绝对地址 |

---

## 六、本地开发（一键切换后端）

后端**放哪个用哪个**：项目里有 `worker/` 就用 Cloudflare Worker，有 `server/` 就用 Node+SQLite（两者优先 Node）。脚本会自动检测并让前端代理指向对应端口。

### 一键启动（推荐）
```bash
npm run start
```
自动：启动检测到的后端 + 启动前端，vite 代理自动指向该后端端口。

### 分开启动
```bash
npm run backend     # 只启动检测到的后端
npm run dev         # 只启动前端
```

### 首次使用 Worker 本地环境
```bash
cd worker && npm install
npx wrangler d1 execute ownerweb --local --file=./schema.sql   # 初始化本地 D1（仅首次）
```

### 强制指定后端
```bash
# Windows PowerShell
$env:BACKEND="node";   npm run start    # 强制 Node（需先有 server/）
$env:BACKEND="worker"; npm run start    # 强制 Worker
```

### 切换后端
- 想用 **Node + SQLite**：把桌面 `OwnerWeb-backend-node/` 复制回 `D:\OwnerWeb\server`，再 `npm run start` 即自动切换。
- 想用 **Cloudflare Worker**：删除 `server/`（或设 `BACKEND=worker`），`npm run start`。
- 后端改动：Worker 改 `worker/src/`，改完 `cd worker && npx wrangler deploy` 上线；Node 改 `server/`。

> 检测逻辑在 `scripts/backend.mjs`，vite 代理在 `vite.config.js` 中自动读取其端口。
