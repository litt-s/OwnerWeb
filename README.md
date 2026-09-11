# OwnerWeb

个人的嵌入式软件工程师个人博客。项目包含首页展示、项目详情、个人优势、访客留言、账号体系、账号设置和管理后台。

## 技术栈

- 前端：Vite、React、React Router、Three.js、OGL
- 后端：Node.js、Express
- 数据库：SQLite
- 鉴权：bcryptjs、jsonwebtoken

## 本地启动

安装依赖：

```bash
npm install
cd server
npm install
```

配置环境变量：

```powershell
Copy-Item server/.env.example server/.env
```

编辑 `server/.env`，至少填写 `JWT_SECRET`。如需自动创建初始管理员，同时填写 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD`。

启动 API：

```bash
cd server
npm run dev
```

启动前端：

```bash
npm run dev
```

访问地址：

```text
前端：http://localhost:5173
API：http://localhost:3001
```

## 构建

```bash
npm run build
```

构建产物在 `dist/`。`node_modules/`、`dist/`、`server/data/`、`server/uploads/` 和 `.env` 不会提交到 Git。

## 公网部署

API 服务需要把 `server/data/` 和 `server/uploads/` 放在服务器持久化磁盘上。生产环境建议在 `server/.env` 设置：

```text
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://blog.example.com
DB_DIR=/var/lib/ownerweb/data
UPLOAD_DIR=/var/lib/ownerweb/uploads
JWT_SECRET=强随机密钥
```

前端静态文件托管 `dist/`，反向代理将 `/api/` 和 `/uploads/` 转发到 API 服务。Nginx 示例见 `deploy/nginx.conf.example`。API 健康检查地址为 `/api/health`。
