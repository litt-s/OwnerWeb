import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { detectBackend } from './scripts/backend.mjs';

// 自动检测项目里放了哪个后端，把 /api 代理到它的端口
//   server/ → 3001（Node + SQLite）   worker/ → 8787（Cloudflare Worker）
const backend = detectBackend();
const proxyPort = backend?.port ?? 8787;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': `http://localhost:${proxyPort}`,
    },
  },
});
