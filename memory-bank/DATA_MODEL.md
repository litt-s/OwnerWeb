# OwnerWeb 数据模型与接口说明

## 1. 数据范围

静态兜底数据：

- 个人基础信息
- Hero 文案
- 经历与统计

数据库保存：

- 用户账号
- 用户资料
- 用户头像 URL
- 访客留言与回复
- 项目多级评论
- 项目内容
- 个人优势内容
- Hero、个人身份、联系信息和经历内容

存储位置：

- 线上 Worker：结构化数据存 D1；头像和项目封面存 KV；数据库只保存 KV key，对外经 `/media/<key>` 返回可访问的绝对地址。项目视频不存文件，改为外链 URL（B站/YouTube/直链）。
- 本地 Node（已归档）：SQLite 文件 + `server/uploads` 磁盘目录 + `/uploads` 静态访问。

## 2. projects 表

SQLite 表名：

```text
projects
```

字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | TEXT PK | 稳定项目 ID，用于路由和评论关联 |
| `sort_order` | INTEGER | 排序值，不小于 1 |
| `name` | TEXT | 项目名称 |
| `en` | TEXT | 英文标题 |
| `tagline` | TEXT | 一句话定位 |
| `desc` | TEXT | 卡片简介 |
| `long_desc` | TEXT | 详情页长介绍 |
| `video` | TEXT | 演示视频 URL（腾讯云 COS 直链或 B站/YouTube/外链），可为空 |
| `cover` | TEXT | 上传封面 URL，可为空 |
| `link` | TEXT | 外部仓库地址，可为空 |
| `link_label` | TEXT | 外部链接显示文字 |
| `tech_json` | TEXT | 技术标签数组 JSON |
| `points_json` | TEXT | 核心实现数组 JSON |
| `requires_login` | INTEGER | 是否仅登录用户可查看，`0`/`1`，默认 `0` |
| `created_at` | TEXT | 创建时间 |
| `updated_at` | TEXT | 更新时间 |

序列化字段：

```js
{
  id,
  sort_order,
  index,
  name,
  en,
  tagline,
  desc,
  longDesc,
  video,
  cover,
  link,
  linkLabel,
  tech,
  points,
  requiresLogin,
  locked
}
```

`index` 不落库，由后端根据 `sort_order` 格式化为 `01`、`02`。`requiresLogin` 表示该项目是否仅登录用户可查看；`locked` 表示当前请求者（未登录）看到的是锁定卡片。

约束与校验：

- `id` 必填且唯一，只能使用小写字母、数字和短横线，最长 80 字符。
- `name` 必填，最长 100 字符。
- `sort_order` 必须是不小于 1 的整数。
- `tech` 和 `points` 接受数组或换行分隔文本，保存前去除空白项。
- `cover` 可为空；上传后保存存储 key（Worker 存 KV，Node 存 `/uploads/projects/...`），对外由后端转换为可访问 URL。`video` 保存可访问 URL：腾讯云 COS 直链（后台直传，数据库只存链接）或 B站/YouTube/直链外链，不存文件。
- `requires_login` 为 `1` 时，未登录访客在 `GET /api/projects` 只会拿到锁定卡片信息（`locked: true`，`desc`/`longDesc`/`video`/`link`/`points` 均为空），`GET /api/projects/:id` 返回 `401`；携带有效 token 的请求返回完整内容。
- 公开接口返回上述序列化字段，不返回时间戳。

初始化与兜底：

- `projects` 表为空时，后端播种逻辑（Worker `worker/src/lib/seed.js`；Node `server/db.js`）使用 `src/data/resume.js` 中的项目初始化。
- 前端 `ContentContext` 先保留 `resume.js` 作为静态兜底，公开接口成功后使用数据库数据。
- 老项目 `yuhu` 和 `zhiyun` 在未上传封面时继续使用前端 SVG 封面。

## 2.1 静态兜底数据

`src/data/resume.js` 仍保存个人基础信息、Hero、经历、优势和项目兜底数据。项目对象的关键字段：

当前项目对象的关键字段：

```js
{
  id: string,
  index: string,
  name: string,
  en: string,
  tagline: string,
  desc: string,
  video: string,
  longDesc: string,
  tech: string[],
  link: string,
  linkLabel: string,
  points: string[]
}
```

要求：

- 每个项目必须有稳定 `id`。
- 数据库项目评论通过 `project_id = projects.id` 关联项目。
- 访客留言独立保存在 `guestbook_comments`，不再使用 `topic` 混存。
- 初始化项目的视频路径仍可指向 `public/videos/`；后台上传的视频保存在 `server/uploads/projects/videos/`。

## 3. strengths 表

SQLite 表名：

```text
strengths
```

字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER PK | 自增优势 ID |
| `sort_order` | INTEGER | 排序值，不小于 1 |
| `title` | TEXT | 优势标题 |
| `description` | TEXT | 优势描述 |
| `created_at` | TEXT | 创建时间 |
| `updated_at` | TEXT | 更新时间 |

序列化字段：

```js
{
  id,
  sort_order,
  n,
  title,
  desc
}
```

`n` 不落库，由后端根据 `sort_order` 格式化，用于前端编号展示。

约束与校验：

- `title` 必填，最长 100 字符。
- `description` 必填，最长 500 字符。
- `sort_order` 必须是不小于 1 的整数。
- 公开接口按 `sort_order` 升序返回。

初始化与兜底：

- `strengths` 表为空时，后端播种逻辑（Worker `worker/src/lib/seed.js`；Node `server/db.js`）使用 `src/data/resume.js` 中的优势初始化。
- 前端 `ContentContext` 保留 `resume.js` 优势作为静态兜底，公开接口成功后使用数据库数据。

## 4. site_content 表

SQLite 表名：

```text
site_content
```

`site_content` 是单行配置表，`id` 固定为 `1`。四段 JSON 分别保存站点基础内容：

| 字段 | 类型 | 说明 |
|---|---|---|
| `profile_json` | TEXT | 个人身份、联系信息（含 `repos` 仓库平台）、教育背景和专业认证 |
| `hero_json` | TEXT | 首页 Hero 文案 |
| `experience_json` | TEXT | 经历简介和经历统计 |
| `contact_json` | TEXT | 「联系我」区块的大标题与小标签 |
| `updated_at` | TEXT | 更新时间 |

序列化字段：

```js
{
  content: {
    profile: {
      name,
      nameEn,
      role,
      roleEn,
      age,
      degree,
      location,
      phone,
      phoneRaw,
      email,
      github,
      githubUrl,
      repos: [{ key, username, url }],
      wechat,
      focus,
      certificate,
      education: { school, major, period }
    },
    hero: { eyebrow, statement, headFirst, headSecond, sub },
    contact: { title, eyebrow },
    experience: { intro, stats: [{ value, label, sub }] }
  }
}
```

约束与校验：

- `name`、`role`、`email`、`phone`、`phoneRaw` 必填。
- `email` 必须符合邮箱格式。
- `headFirst`、`headSecond`、`sub`、`intro` 必填。
- `stats` 最多 12 条，每条的 `value` 和 `label` 必填。
- `repos` 为仓库托管平台列表，`key` 仅允许 `gitee` / `github` / `gitcode`，同一平台不重复；`username` 最长 80 字，`url` 最长 300 字；未勾选的平台不写入数组。
- `github` / `githubUrl` 为旧字段保留兼容：当 `repos` 缺失时，前端与后台都会用它们自动生成 GitHub 项。
- `contact.title` 最长 160 字，`contact.eyebrow` 最长 120 字；为空时前端使用 `resume.js` 中的默认文案兜底。
- 公开接口返回完整展示内容，不包含密码等账号敏感字段。

初始化与兜底：

- 表为空时，后端播种逻辑（Worker `worker/src/lib/seed.js`；Node `server/db.js`）使用 `resume.js` 的个人基础信息、Hero 和经历初始化。
- 前端 `ContentContext` 使用 `resume.js` 作为异常兜底，公开接口成功后合并并使用数据库数据。

## 5. users 表

SQLite 表名：

```text
users
```

字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER PK | 自增用户 ID |
| `email` | TEXT UNIQUE | 登录邮箱，必填 |
| `password_hash` | TEXT | 密码哈希（Worker 用 PBKDF2；Node 用 bcrypt，格式不同、数据不通用） |
| `nickname` | TEXT | 昵称，可为空 |
| `avatar` | TEXT | 头像存储 key（Worker 为 KV key，Node 为 `/uploads/...`），对外由后端转为 URL，可为空 |
| `bio` | TEXT | 历史兼容字段，账号设置不再展示或更新，可为空 |
| `role` | TEXT | `user` 或 `admin`，默认 `user` |
| `banned` | INTEGER | `0` 正常，`1` 封禁 |
| `created_at` | TEXT | 注册时间 |

`publicUser` 返回给前端的字段：

```js
{
  id,
  email,
  nickname,
  avatar,
  role,
  banned,
  created_at
}
```

## 6. guestbook_comments 表

SQLite 表名：

```text
guestbook_comments
```

字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER PK | 自增评论 ID |
| `nickname` | TEXT | 提交时的昵称快照 |
| `email` | TEXT | 提交时的邮箱快照 |
| `content` | TEXT | 访客留言或回复内容 |
| `user_id` | INTEGER | 提交用户 ID，删除用户时置空 |
| `parent_id` | INTEGER | 被回复的留言 ID，可为空 |
| `root_id` | INTEGER | 该留言所属顶层留言 ID，顶层留言为自己的 ID |
| `created_at` | TEXT | 创建时间 |

约束与索引：

- `user_id` 外键指向 `users.id`，策略为 `ON DELETE SET NULL`。
- `parent_id` 外键指向本表 `id`，策略为 `ON DELETE CASCADE`。
- `root_id` 外键指向本表 `id`，策略为 `ON DELETE CASCADE`。
- `parent_id` 与 `root_id` 均已建立索引。
- 昵称和邮箱保留提交时快照，用户被删除后留言仍可展示。
- 新增留言或回复时，后端会自动写入 `root_id`；历史数据在启动时自动回填。

## 7. project_comments 表

SQLite 表名：

```text
project_comments
```

字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER PK | 自增评论 ID |
| `project_id` | TEXT | 项目 ID，对应 `projects.id` |
| `nickname` | TEXT | 提交时的昵称快照 |
| `email` | TEXT | 提交时的邮箱快照 |
| `content` | TEXT | 项目评论或回复内容 |
| `user_id` | INTEGER | 提交用户 ID，删除用户时置空 |
| `parent_id` | INTEGER | 被回复的评论 ID，可为空 |
| `root_id` | INTEGER | 该评论所属顶层评论 ID，顶层评论为自己的 ID |
| `created_at` | TEXT | 创建时间 |

约束与索引：

- `project_id` 必填，接口会校验它必须存在于 `projects` 表。
- `user_id` 外键指向 `users.id`，策略为 `ON DELETE SET NULL`。
- `parent_id` 外键指向本表 `id`，策略为 `ON DELETE CASCADE`。
- `root_id` 外键指向本表 `id`，策略为 `ON DELETE CASCADE`。
- `project_id`、`parent_id`、`root_id` 均已建立索引。
- 任意层级回复通过 `parent_id` 递归关联，前端按评论树渲染。
- 新增评论或回复时，后端会继承父评论所在线程的 `root_id`；历史数据在启动时自动回填。

## 8. 旧表迁移逻辑

首次导入 `server/db.js` 时，如果存在旧版 `comments` 表，会在同一个事务中执行：

1. 按 `topic` 把旧数据拆分复制到 `guestbook_comments` 和 `project_comments`。
2. 复制成功后删除旧 `comments` 表。
3. 同时清理已存在的 `comments_legacy` 备份表。

当前数据库不保留旧评论表。

## 9. 当前校验规则

注册：

- `email` 先规范化（去空白、转小写），再做严格格式校验：整体 ≤254、本地部分 ≤64、不允许首尾点或连续点、TLD 至少 2 位字母，不通过返回 400「邮箱格式不正确」。
- 常见拼写错误域名（如 `gmail.con`、`qq.con`）返回 400 并提示正确域名。
- 一次性 / 临时邮箱域名（`mailinator.com`、`10minutemail.com` 等）返回 400。
- 域名 MX 校验：通过 Cloudflare DNS-over-HTTPS 查询，无 MX（且无 A 记录兜底）返回 400「邮箱域名不存在」或「该邮箱域名无法接收邮件」；DNS 查询异常时放行，避免临时故障挡住正常注册。校验逻辑见 `worker/src/lib/email.js`。
- `password` 至少 6 位。
- 邮箱重复时返回 409。
- 昵称为空时默认取邮箱前缀。
- 登录同样对邮箱做小写规范化，保证大小写不影响匹配。

资料：

- 必须登录。
- 头像文件最大 2MB。

密码修改：

- 原密码必须正确。
- 新密码至少 6 位。

访客留言和项目评论：

- 必须登录。
- `content` 去除首尾空白后不能为空。
- `content` 最大 500 字。
- 昵称取用户昵称或邮箱前缀。
- 项目评论的 `project_id` 来自路由，必须对应存在的项目。
- `parent_id` 必须指向同表、同项目下存在的评论。
- 公开评论接口只返回 `id`、`nickname`、`avatar`、`content`、`parent_id`、`root_id`、`created_at`、`replyCount`（顶层评论的回复总数，回复项为 `0`）。
- `avatar` 通过 `LEFT JOIN users` 读取用户当前头像，不把评论邮箱或 `user_id` 暴露给公开接口；用户上传新头像后，已有评论头像会同步变化。

项目内容：

- 新增和修改项目必须管理员登录。
- `id` 必填，新增时不能重复，格式为小写字母、数字或短横线，最长 80 字符。
- `name` 必填，最长 100 字符。
- `sort_order` 必须是不小于 1 的整数。
- `tech` 和 `points` 保存为 JSON 数组。
- 封面只接受 PNG、JPG 或 WebP，上传上限 2MB 的通用头像限制不适用于项目封面，当前项目媒体上限为 500MB。
- 视频必须使用视频 MIME 类型，上传后数据库只保存 `/uploads/projects/videos/...` URL。
- 删除项目会同时删除该项目全部评论。

个人优势：

- 新增和修改优势必须管理员登录。
- `title` 必填，最长 100 字符。
- `description` 必填，最长 500 字符。
- `sort_order` 必须是不小于 1 的整数。

站点内容：

- 修改 Hero、身份联系信息和经历内容必须管理员登录。
- 姓名、职业定位、邮箱、电话、主标题和经历简介必填。
- 邮箱格式、各类文本长度和经历统计条数由后端校验。

分页与线程加载：

- 公开的顶层评论列表使用 **keyset 分页**：`GET ...?limit=<1-50>&cursor=<上页最后一个顶层评论 id>`，按 `id ASC` 取 `parent_id IS NULL` 的评论，返回 `{ comments, hasMore, nextCursor }`（`limit` 默认 10）。
- 每条顶层评论带 `replyCount`（该线程回复总数）；回复不随列表返回，点击「查看 N 条回复」时再请求 `GET .../<rootId>/replies` 按需加载整条线程的回复。

待补强：

- 删除父评论时当前会连同整棵子树一起删除，后续可考虑改为保留子回复并提升层级。
- 管理端评论列表仍返回 `email` 和 `user_id`，属于管理员可见字段。
- 顶层评论按 `id ASC` 顺序分页（旧评论在前）；如需「最新在前」可改为 `id DESC`。

## 10. API 清单

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| POST | `/api/auth/register` | 邮箱注册，返回 token 和用户 | 否 |
| POST | `/api/auth/login` | 邮箱登录，返回 token 和用户 | 否 |
| GET | `/api/auth/me` | 恢复登录态 | 是 |
| PUT | `/api/profile` | 修改昵称 | 是 |
| POST | `/api/profile/avatar` | 上传头像，JSON `{ dataUrl }`（base64） | 是 |
| PUT | `/api/profile/password` | 修改密码 | 是 |
| GET | `/api/strengths` | 获取个人优势列表 | 否 |
| GET | `/api/content/site` | 获取 Hero、身份联系信息和经历内容 | 否 |
| GET | `/api/health` | 检查 API 与 SQLite 数据库状态 | 否 |
| GET | `/api/guestbook-comments` | 获取访客留言顶层评论（keyset 分页：`limit`/`cursor`） | 否 |
| GET | `/api/guestbook-comments/:rootId/replies` | 获取某条顶层留言下的全部回复 | 否 |
| POST | `/api/guestbook-comments` | 提交访客留言或回复 | 是 |
| GET | `/api/projects` | 获取项目列表；可选携带 token，登录后返回受限项目完整内容 | 否（可选登录） |
| GET | `/api/projects/:projectId` | 获取项目详情；受限项目未登录返回 401 | 否（可选登录） |
| GET | `/api/projects/:projectId/comments` | 获取项目顶层评论（keyset 分页：`limit`/`cursor`） | 否 |
| GET | `/api/projects/:projectId/comments/:rootId/replies` | 获取某条顶层项目评论下的全部回复 | 否 |
| POST | `/api/projects/:projectId/comments` | 提交项目评论或任意层级回复 | 是 |
| GET | `/api/admin/comments` | 获取访客留言和项目评论管理列表 | 管理员 |
| DELETE | `/api/admin/guestbook-comments/:id` | 删除访客留言及其回复 | 管理员 |
| DELETE | `/api/admin/project-comments/:id` | 删除项目评论及其回复 | 管理员 |
| GET | `/api/admin/projects` | 获取项目管理列表 | 管理员 |
| POST | `/api/admin/projects` | 新增项目 | 管理员 |
| PUT | `/api/admin/projects/:id` | 修改项目 | 管理员 |
| DELETE | `/api/admin/projects/:id` | 删除项目及其评论 | 管理员 |
| POST | `/api/admin/projects/:id/cover` | 上传或替换项目封面，multipart 字段名 `cover` | 管理员 |
| POST | `/api/admin/projects/:id/video/sign` | 获取项目视频直传 COS 的预签名（请求 `{ filename }`，返回 `uploadUrl` / `authorization` / `publicUrl`） | 管理员 |
| GET | `/api/admin/strengths` | 获取优势管理列表 | 管理员 |
| POST | `/api/admin/strengths` | 新增优势 | 管理员 |
| PUT | `/api/admin/strengths/:id` | 修改优势 | 管理员 |
| DELETE | `/api/admin/strengths/:id` | 删除优势 | 管理员 |
| GET | `/api/admin/content/site` | 获取站点内容管理数据 | 管理员 |
| PUT | `/api/admin/content/site` | 修改 Hero、身份联系信息和经历内容 | 管理员 |
| GET | `/api/admin/users` | 获取用户列表 | 管理员 |
| PATCH | `/api/admin/users/:id` | 修改用户角色或封禁状态 | 管理员 |
| DELETE | `/api/admin/users/:id` | 删除用户 | 管理员 |

当前响应格式尚未统一。现有约定：

- 成功返回业务对象，如 `{ token, user }`、`{ comments }`、`{ ok: true }`。
- 失败返回 `{ error: string }`。
- 前端 `src/api.js` 优先读取 `data.error` 作为错误提示。

## 11. 管理员鉴权

- 密码哈希：Worker 使用 PBKDF2（Web Crypto），Node 后端使用 bcryptjs。
- JWT：Worker 使用 `hono/jwt`，Node 后端使用 `jsonwebtoken`；两者用同一 `JWT_SECRET` 概念。
- 必须配置 `JWT_SECRET`，缺失时鉴权不可用。
- 初始管理员仅在 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 同时配置时创建。
- 登录成功返回 JWT。
- JWT payload 包含 `id` 和 `role`。
- JWT 有效期当前为 7 天。
- 前端把 token 保存到 localStorage，并通过 `Authorization: Bearer <token>` 发送。
- Express 的 `auth` 中间件校验 token、用户存在性和封禁状态。
- Express 的 `admin` 中间件校验 `role === 'admin'`。
- 生产环境必须配置强随机 `JWT_SECRET`。
