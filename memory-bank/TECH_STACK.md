# OwnerWeb 技术栈规范

## 1. 技术栈结论

当前版本采用：

```text
前端框架：Vite + React 18 + JavaScript JSX
路由：React Router DOM 6
样式：普通 CSS
视觉增强：Three.js + @react-three/fiber + OGL
后端：Node.js + Express
数据库：SQLite（node:sqlite DatabaseSync）
鉴权：bcryptjs 密码哈希 + jsonwebtoken Bearer Token
文件上传：multer
调用方式：标准 HTTP fetch，统一封装在 src/api.js
业务接口：领域服务统一封装在 src/services/
部署形态：前端静态构建 + 独立 Node API 服务
```

## 2. 为什么这样选

- Vite 启动快，适合持续迭代个人站。
- React 适合把首页、项目详情、账号和管理后台拆成页面与组件。
- React Router 支持项目详情、登录、后台等独立 URL。
- 普通 CSS 保持依赖少，当前视觉体系已经集中在 `src/styles/global.css`。
- Three.js、@react-three/fiber 和 OGL 支撑首页的科技感视觉场景。
- Express API 结构直观，便于实现认证、资料、留言和后台接口。
- SQLite 适合单人作品站的本地数据存储，运维成本低。
- JWT 适合前后端分离的登录态管理。

## 3. 目录约定

```text
src/pages       页面组件
src/components  首页区块、留言区、视觉组件和通用组件
src/data        简历、项目和个人介绍等静态数据
src/context     登录态与用户上下文
src/services    认证、内容、评论等领域接口封装
src/hooks       通用 React Hook
src/styles      全局样式
server          Express API、SQLite 初始化与数据库文件
server/uploads  用户头像与项目媒体上传目录
deploy          公网反向代理示例配置
memory-bank     项目上下文文档
public          静态资源，包括项目演示视频
dist            前端构建产物
```

## 4. 环境变量

API 服务读取 `server/.env`：

```text
NODE_ENV=运行环境，生产部署设置为 production
PORT=API 端口，默认 3001
CORS_ORIGIN=允许访问 API 的前端来源，多个来源用逗号分隔
DB_DIR=SQLite 数据目录，相对路径相对于 server/，生产环境建议使用绝对路径
UPLOAD_DIR=上传文件目录，相对路径相对于 server/，生产环境建议使用绝对路径
JWT_SECRET=JWT 签名密钥，生产环境必须使用强随机值
ADMIN_EMAIL=初始管理员邮箱
ADMIN_PASSWORD=初始管理员密码
```

注意：

- API 启动时必须配置 `JWT_SECRET`，缺失时直接退出。
- `NODE_ENV=production` 时，`CORS_ORIGIN`、`DB_DIR` 和 `UPLOAD_DIR` 都是必填项。
- 初始管理员仅在 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 同时配置时创建。
- 生产环境必须显式配置 `JWT_SECRET`，不能使用开发默认值。
- 初始管理员密码必须通过环境变量注入，不能用代码里的默认弱密码。
- 公网环境应将 `CORS_ORIGIN` 配置为真实前端 HTTPS 地址，不使用任意来源。
- `DB_DIR` 和 `UPLOAD_DIR` 必须使用持久化存储；相对路径相对于 `server/` 目录解析。
- `.env`、数据库文件和上传目录不应提交到 Git。

## 5. 编码约束

- 页面组件不直接写 `fetch`；`src/api.js` 只负责基础请求封装，业务接口统一放在 `src/services/`。
- 动态内容请求使用 `cache: 'no-store'`，避免后台更新后浏览器继续使用旧响应。
- 登录态统一通过 `AuthContext` 读写，不散落多个 localStorage 逻辑。
- `src/data/resume.js` 是静态兜底数据和项目初始化种子数据；已接管的内容模块以 SQLite 为准。
- 访客留言、项目评论、项目内容、个人优势、站点基础内容、用户、头像等动态数据必须走 Express API。
- 访客留言和项目评论分别保存在 `guestbook_comments` 与 `project_comments`，不再混用 `topic` 字段。
- 项目评论的项目 ID 以 `projects` 表为准，Express 校验 `projectId` 必须存在。
- SQLite 连接必须开启 `PRAGMA foreign_keys = ON`，保证用户与评论外键策略生效。
- 密码只能以 bcrypt 哈希保存，不能明文入库。
- JWT 不能写入前端源码。
- 后台操作必须同时校验登录态和管理员角色。
- 新增接口必须同步更新 `DATA_MODEL.md`。
- 新增页面或路由必须同步更新 `ARCHITECTURE.md` 和 `DESIGN.md`。
- AI 协作期间只使用纯文本输出，不发送图片、截图或非文本消息。
- AI 不自动打开浏览器；需要用户查看页面时只提供文本链接。

## 6. 本地运行命令

前端：

```bash
npm run dev
```

API：

```bash
cd server
npm run dev
```

构建前端：

```bash
npm run build
```

当前没有 lint 和测试命令。验证以构建、接口手工检查和页面手工检查为主。

本地地址：

```text
前端：http://localhost:5173
API：http://localhost:3001
```

注意：当前 `vite.config.js` 中 `server.open: false`，启动前端开发服务不会自动打开浏览器；如需查看页面，由用户手动打开本地地址。
项目封面限制为 PNG、JPG 或 WebP；项目视频上传上限当前为 500MB。
