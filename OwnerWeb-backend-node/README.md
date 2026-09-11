# OwnerWeb Node 后端（归档备份）

这是 OwnerWeb 作品集的**本地 Node + Express + SQLite 后端**，已从主项目 `D:\OwnerWeb\server` 移出归档。

## 用途
- 本地快速开发调试（纯 Node，无需 Wrangler / Cloudflare）
- 与线上 Cloudflare Workers 后端（`worker/`）实现**同一套 API**

## 运行
```bash
npm install
# 配置 .env（JWT_SECRET 必填，参考 .env.example）
npm start        # http://localhost:3001
```

## 放回项目
把本文件夹整体复制回 `D:\OwnerWeb\server`，前端 vite 代理即可指向它（见项目 `vite.config.js`）。
它和 `worker/` 是同一套 API 的两种实现，前端通过 `VITE_API_BASE` 决定连哪个。

## 注意
- `.env` 含密钥，请勿提交到 Git 仓库。
- 数据库文件在运行时生成于 `data/`，上传文件在 `uploads/`（归档时未包含，运行后自动重建并播种）。
