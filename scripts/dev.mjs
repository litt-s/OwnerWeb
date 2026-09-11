// 一键启动：自动检测并启动后端 + 启动前端（vite 代理会自动指向该后端端口）
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectBackend, ROOT } from './backend.mjs';
import { generate } from './gen-config.mjs';

// 若存在 .env.local，先据它生成各配置（wrangler.toml / .dev.vars / .env.production）
if (existsSync(resolve(ROOT, '.env.local'))) {
  try { generate(); } catch (e) { console.warn('[config] 生成失败：' + e.message); }
}

const backend = detectBackend();
if (!backend) {
  console.error('未找到后端：请在 worker/（Cloudflare）或 server/（Node）中放入一个后端。');
  process.exit(1);
}

console.log('');
console.log(`  后端：${backend.name}   (端口 ${backend.port})`);
if (backend.kind === 'worker') {
  console.log('  提示：首次本地运行请先执行  cd worker && npx wrangler d1 execute ownerweb --local --file=./schema.sql');
}
console.log('  前端：http://localhost:5173');
console.log('');

const be = spawn(backend.command, backend.args, { cwd: backend.cwd, stdio: 'inherit', shell: true });
const fe = spawn('npm', ['run', 'dev'], { cwd: ROOT, stdio: 'inherit', shell: true });

let closing = false;
const shutdown = () => {
  if (closing) return;
  closing = true;
  try { be.kill(); } catch { /* ignore */ }
  try { fe.kill(); } catch { /* ignore */ }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
be.on('exit', shutdown);
fe.on('exit', shutdown);
