# OwnerWeb 踩坑记录

开发过程中遇到的问题记录在这里。

格式建议：

```markdown
## YYYY-MM-DD 问题标题

现象：
原因：
解决：
以后注意：
```

## 2026-09-08 Agentrouter / GLM 只接受文本消息

现象：

通过 CC Switch local proxy 调用 Codex endpoint `/responses` 时，上游返回 HTTP 400，错误为 `messages.content.type 参数非法，取值范围 ['text']`。

原因：

Agentrouter 的 GLM 上游只接受 `text` 类型消息内容。一旦对话中混入图片、截图或浏览器自动化产生的非文本内容，请求就会失败，可能导致当前会话不可用。

解决：

- 所有对话输出保持纯文本。
- 不发送图片、截图或非文本消息。
- 不使用会注入截图的浏览器或 GUI 自动化工具。
- 需要用户查看网页时，只提供文本链接，由用户手动打开。

以后注意：

该规则已写入 `AGENTS.md` 和 `TECH_STACK.md`，属于本项目 AI 协作的强制规则。

## 2026-09-09 单表混存两种评论导致模型含糊

现象：

旧版 `comments` 表同时保存访客留言和项目评论，用 `topic` 区分场景；`parent_id` 语义写的是“回复顶层留言”，前端也只能渲染一层回复。

原因：

表结构把两种业务边界压在同一张表里，又没有明确多级评论树约束，导致接口需要返回全量评论再由前端按 `topic` 过滤。

解决：

- 拆分为 `guestbook_comments` 和 `project_comments`。
- 项目评论使用 `project_id + parent_id`，支持任意层级回复。
- 迁移旧表时先在同一事务内复制数据；复制成功后删除旧表。
- 本地先短暂保留 `comments_legacy` 校验迁移结果，用户确认后已删除。

以后注意：

结构性迁移要放在事务里执行；生产环境执行前应先做好数据库备份。

## 2026-09-09 评论头像只显示首字，没有读取用户头像

现象：

上传头像后进入留言区，评论头像没有变成新上传的图片，仍然显示昵称首字。

原因：

评论公开接口没有返回 `avatar`，前端评论组件也没有渲染 `<img>`，只写死了 `(comment.nickname || '访')[0]`。

解决：

- 评论查询通过 `LEFT JOIN users` 动态带出 `u.avatar AS user_avatar`。
- 公开评论字段增加 `avatar`。
- 前端优先渲染图片，加载失败或没有头像时回退到昵称首字。

以后注意：

头像这类可随时变更的资料，评论展示不要只用昵称首字占位；动态关联用户资料能保证修改头像后旧评论也同步更新。

## 2026-09-10 SQLite 不接受 undefined 绑定参数

现象：

后台新增项目接口返回 `Provided value cannot be bound to SQLite parameter`，创建请求失败。

原因：

请求没有传 `video` 时，序列化后的字段值为 `undefined`，而 `node:sqlite` 不接受该类型作为绑定参数。

解决：

- 项目内容序列化时把可为空的媒体字段统一转换为 `null`。
- 数据库字段允许 `NULL`，前端用空状态提示“尚未上传视频/封面”。

以后注意：

新增 SQLite 字段时，序列化层必须显式把 `undefined` 转换为 `null`，不能依赖默认值。

## 2026-09-10 动态内容切换阶段不能假设对象完整

现象：

站点内容改为动态加载后，`Search` 在请求返回或热更新过程中读取 `profile.name` 抛出 `Cannot read properties of undefined`。

原因：

搜索索引直接假设 `profile`、项目技术标签和优势描述一定存在，没有处理内容上下文初始化和异常兜底状态。

解决：

- `ContentContext` 在接口返回后与 `resume.js` 兜底合并。
- 优势列表统一补充稳定 `id`。
- `Search` 对 `profile`、`tech` 和 `desc` 提供空值兜底。

以后注意：

动态内容上下文在加载、失败和热更新阶段都可能不完整，所有派生数据必须做空值和数组兜底。

## 2026-09-10 公网配置需要固定持久化路径和正确拒绝 CORS

现象：

生产配置模拟时，不允许的来源让 CORS 中间件抛出异常并返回 HTML 500；相对数据目录也可能随启动工作目录变化。

原因：

- CORS 回调把来源拒绝作为 Express 异常处理。
- `path.resolve()` 直接使用相对环境变量时依赖进程当前工作目录。

解决：

- 不允许的来源返回 `callback(null, false)`，响应不携带跨域许可头，由浏览器阻止跨域读取。
- `DB_DIR` 和 `UPLOAD_DIR` 的相对路径固定相对于 `server/` 解析；生产环境推荐使用绝对持久化路径。

以后注意：

部署验证必须同时检查允许来源、不允许来源、无 Origin 的健康检查，以及 API 重启后的数据和媒体持久性。

## 2026-09-10 绝对定位子元素不能支撑父容器高度

现象：

个人介绍页移除 `.portrait-media` 内的 `<img>` 背景图、改用 CSS 渐变作底后，整块头像卡从页面中消失。

原因：

`.portrait-media` 的高度原先由 `<img>` 的 `aspect-ratio: 4 / 5` 撑开；删除图片后，容器内只剩绝对定位子元素（`.portrait-space`、`.portrait-badge`），绝对定位元素不参与父容器高度计算，容器塌陷为 0 高。

解决：

- 为 `.portrait-media` 显式声明 `width: 100%` 与 `aspect-ratio: 4 / 5`，由容器自身提供尺寸。
- 同步删除已无对应元素的 `.portrait-media img` 死规则。

以后注意：

删除充当尺寸来源的填充元素（图片、占位块）时，必须同时给父容器补上显式尺寸或宽高比；容器内若只剩绝对定位子元素，父级不会自动撑高。

## 2026-09-11 Serverless 无持久化磁盘：SQLite 与本地文件不可用

现象：

计划把 Node + Express + SQLite 后端迁到 Serverless（Cloudflare Workers / 云函数）时，数据库文件与 `server/uploads` 本地磁盘无法持久保存，实例重启即丢失。

原因：

Serverless 运行时无状态、磁盘临时且不共享；`node:sqlite`、`node:fs` 等 Node 能力在 Workers 也不可用。

解决：

- 数据库改用 Cloudflare D1（SQLite），文件改用 R2 对象存储。
- 数据库只保存 R2 key，对外经 `/media/<key>` 返回绝对地址。
- 本地开发用 Wrangler 模拟 D1/R2（`wrangler dev` + `wrangler d1 execute --local`）。

以后注意：

选 Serverless 前先确认「数据库 + 文件存储」是否持久；纯静态前端可直接 Serverless，但带数据库/上传的后端必须换成托管数据库 + 对象存储。

## 2026-09-11 Workers 免费版 CPU 限制：不要用 bcrypt 做密码哈希

现象：

把后端迁到 Cloudflare Workers 后，用 bcryptjs 做密码哈希可能超过免费版每请求 10ms 的 CPU 限制，导致请求失败。

原因：

bcrypt 是纯 JS 实现、CPU 开销大；Workers 免费版 CPU 预算很小，付费版才宽裕。

解决：

- Worker 端改用 **PBKDF2（Web Crypto `crypto.subtle`）**，原生实现、开销可控。
- Node 后端仍用 bcryptjs；两者哈希格式不同，数据不通用。

以后注意：

Serverless 免费版要留意 CPU 限制；密码哈希优先用运行时的原生加密能力（Web Crypto），并控制迭代次数。

## 2026-09-11 两套后端容易分叉：前端解耦 + 一键切换

现象：

同时维护 Node（本地）与 Worker（线上）两套后端时，接口与字段容易改一处漏一处，行为不一致。

原因：

两套后端是独立代码，改动不会自动同步；本地与线上运行时不同（Node vs Workers）。

解决：

- 让两套后端实现**同一套 API**，前端只认 `VITE_API_BASE`。
- 新增 `scripts/backend.mjs` 自动检测「项目里放了哪个后端」，`scripts/dev.mjs` 一键启动，Vite 代理自动指向对应端口。
- 本地开发默认用 Worker（一套代码），Node 后端归档到桌面备选。

以后注意：

多后端并存时，务必约定统一 API 契约并做自动化切换，避免手工同步；能只维护一套就只维护一套。

## 2026-09-11 推送 GitHub 前必须清理敏感信息

现象：

准备推送到新的 GitHub 仓库时，需确认账号、密码、密钥等不会泄漏。

原因：

`wrangler.toml` 里写了管理员邮箱，`.env`、数据库、上传目录等本地文件可能被误提交。

解决：

- 管理员邮箱/密码/`JWT_SECRET` 改用 `wrangler secret put`，不写入提交文件。
- 完善 `.gitignore`（`.env`、`worker/.dev.vars`、`worker/.wrangler`、`node_modules`、`dist`、`*.db`、上传目录等）。
- 用 `git ls-files` 与历史检索确认从未提交过 `.env`；扫描源码无硬编码密钥。
- 保留 Gitee 为 `gitee`，`origin` 指向 GitHub。

以后注意：

每次推送前先 `git status` 与 `.gitignore` 核对；密钥只放环境变量/secret；如历史中已提交过密钥，必须视为已泄漏并轮换。
