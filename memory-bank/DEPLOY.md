# OwnerWeb 部署说明

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
PORT=3001
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
- 初始管理员账号密码通过环境变量注入。
- `server/data/` 和 `server/uploads/` 挂载到持久化存储。
- API 域名必须允许前端域名跨域访问，当前代码已启用 `cors()`。
- 上传目录必须通过 `/uploads` 暴露。

## 5. 前端部署

当前项目还没有确定的线上域名和托管平台。部署静态前端时必须满足：

- 托管 `dist/` 静态文件。
- 将 `/api/*` 反向代理到 API 服务。
- 将 `/uploads/*` 反向代理到 API 服务或静态存储。
- 为 React Router 配置 History 回退，未知路径回退到 `index.html`。

## 6. 上线验证

- 首页能打开，视觉背景和导航正常。
- `/experience`、`/projects`、`/strengths`、`/comments` 能打开。
- 项目详情页能打开并播放演示视频。
- 注册新账号成功。
- 登录、退出、刷新后登录态恢复正常。
- 资料修改和头像上传成功。
- 密码修改成功，旧密码不能再登录。
- 留言和回复能提交并展示。
- 管理员能删除留言。
- 管理员能查看、调整、封禁、解封和删除用户。
- 普通用户访问 `/admin` 时被拒绝。
