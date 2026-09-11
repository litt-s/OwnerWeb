// 后端检测与启动：项目里放了哪个后端，就用哪个
//   - server/server.js   → Node + SQLite（本地快速开发）
//   - worker/wrangler.toml → Cloudflare Worker（wrangler dev，本地模拟 D1/R2）
// 可用环境变量强制指定：BACKEND=node 或 BACKEND=worker
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function detectBackend() {
  const force = (process.env.BACKEND || '').toLowerCase();
  const hasNode = existsSync(resolve(ROOT, 'server/server.js'));
  const hasWorker = existsSync(resolve(ROOT, 'worker/wrangler.toml'));

  const useNode = force === 'node' || (force !== 'worker' && hasNode);
  if (useNode && hasNode) {
    return {
      kind: 'node',
      name: 'Node + SQLite (server/)',
      cwd: resolve(ROOT, 'server'),
      command: 'node',
      args: ['server.js'],
      port: 3001,
    };
  }
  if (hasWorker) {
    return {
      kind: 'worker',
      name: 'Cloudflare Worker (wrangler dev)',
      cwd: resolve(ROOT, 'worker'),
      command: 'npx',
      args: ['wrangler', 'dev', '--port', '8787'],
      port: 8787,
    };
  }
  return null;
}

// 直接运行本文件时：启动检测到的后端
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const backend = detectBackend();
  if (!backend) {
    console.error('未找到后端：请在 worker/（Cloudflare）或 server/（Node）中放入一个后端。');
    process.exit(1);
  }
  console.log(`启动后端：${backend.name}  →  http://localhost:${backend.port}`);
  if (backend.kind === 'worker') {
    console.log('提示：首次本地运行请先执行  cd worker && npx wrangler d1 execute ownerweb --local --file=./schema.sql');
  }
  const child = spawn(backend.command, backend.args, { cwd: backend.cwd, stdio: 'inherit', shell: true });
  child.on('exit', (code) => process.exit(code ?? 0));
}
