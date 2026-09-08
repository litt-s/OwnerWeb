# OwnerWeb 数据模型与接口说明

## 1. 数据范围

静态数据：

- 个人基础信息
- Hero 文案
- 经历与统计
- 项目列表和项目详情
- 个人优势

数据库保存：

- 用户账号
- 用户资料
- 用户头像 URL
- 留言与回复

文件系统保存：

- 用户上传头像
- SQLite 数据库文件

## 2. 静态项目数据

项目数据放在 `src/data/resume.js`。

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
- 留言通过 `topic = project.id` 关联项目。
- 通用留言使用 `topic = 'guestbook'`。
- 项目视频文件放在 `public/videos/`。

## 3. users 表

SQLite 表名：

```text
users
```

字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER PK | 自增用户 ID |
| `email` | TEXT UNIQUE | 登录邮箱，必填 |
| `password_hash` | TEXT | bcrypt 哈希 |
| `nickname` | TEXT | 昵称，可为空 |
| `avatar` | TEXT | 头像 URL，可为空 |
| `bio` | TEXT | 个性签名，可为空 |
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
  bio,
  role,
  banned,
  created_at
}
```

## 4. comments 表

SQLite 表名：

```text
comments
```

字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER PK | 自增评论 ID |
| `nickname` | TEXT | 提交时的昵称快照 |
| `email` | TEXT | 提交时的邮箱快照 |
| `content` | TEXT | 留言内容 |
| `user_id` | INTEGER | 提交用户 ID |
| `parent_id` | INTEGER | 回复的顶层留言 ID，可为空 |
| `topic` | TEXT | `guestbook` 或项目 ID，可为空 |
| `created_at` | TEXT | 创建时间 |

当前逻辑说明：

- 顶层留言 `parent_id` 为空。
- 回复通过 `parent_id` 关联顶层留言。
- 前端按 `topic` 过滤展示。
- `GET /api/comments` 当前返回全部评论。

## 5. 当前校验规则

注册：

- `email` 必须符合邮箱正则。
- `password` 至少 6 位。
- 邮箱重复时返回 409。
- 昵称为空时默认取邮箱前缀。

资料：

- 必须登录。
- 头像文件最大 2MB。

密码修改：

- 原密码必须正确。
- 新密码至少 6 位。

留言：

- 必须登录。
- `content` 去除首尾空白后不能为空。
- 昵称取用户昵称或邮箱前缀。

待补强：

- 留言内容缺少最大长度限制。
- `topic` 未校验是否为合法项目 ID 或 `guestbook`。
- `parent_id` 未校验目标留言是否存在。
- 删除用户时留言未级联处理。
- `GET /api/comments` 当前会带出 `email` 和 `user_id`，应改为公开安全字段。

## 6. API 清单

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| POST | `/api/auth/register` | 邮箱注册，返回 token 和用户 | 否 |
| POST | `/api/auth/login` | 邮箱登录，返回 token 和用户 | 否 |
| GET | `/api/auth/me` | 恢复登录态 | 是 |
| PUT | `/api/profile` | 修改昵称和个性签名 | 是 |
| POST | `/api/profile/avatar` | 上传头像，multipart 字段名 `avatar` | 是 |
| PUT | `/api/profile/password` | 修改密码 | 是 |
| GET | `/api/comments` | 获取全部评论 | 否 |
| POST | `/api/comments` | 提交评论或回复 | 是 |
| DELETE | `/api/admin/comments/:id` | 删除评论 | 管理员 |
| GET | `/api/admin/users` | 获取用户列表 | 管理员 |
| PATCH | `/api/admin/users/:id` | 修改用户角色或封禁状态 | 管理员 |
| DELETE | `/api/admin/users/:id` | 删除用户 | 管理员 |

当前响应格式尚未统一。现有约定：

- 成功返回业务对象，如 `{ token, user }`、`{ comments }`、`{ ok: true }`。
- 失败返回 `{ error: string }`。
- 前端 `src/api.js` 优先读取 `data.error` 作为错误提示。

## 7. 管理员鉴权

- 密码使用 bcryptjs 哈希后保存。
- API 启动时必须配置 `JWT_SECRET`，缺失时直接退出。
- 初始管理员仅在 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 同时配置时创建。
- 登录成功返回 JWT。
- JWT payload 包含 `id` 和 `role`。
- JWT 有效期当前为 7 天。
- 前端把 token 保存到 localStorage，并通过 `Authorization: Bearer <token>` 发送。
- Express 的 `auth` 中间件校验 token、用户存在性和封禁状态。
- Express 的 `admin` 中间件校验 `role === 'admin'`。
- 生产环境必须配置强随机 `JWT_SECRET`。
