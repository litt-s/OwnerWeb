// 读取根目录 .env.local，生成 Worker 侧配置文件
//   worker/wrangler.toml   Cloudflare Worker 的 D1 / R2 绑定
//   worker/.dev.vars       本地 wrangler dev 的密钥
//   worker/.secrets.json   线上 secrets（wrangler secret bulk 用）
// 注：不生成 .env.production；Vite 会自动读取 .env.local 的 VITE_ 前缀变量
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = resolve(ROOT, '.env.local');

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i < 0) continue;
    const key = s.slice(0, i).trim();
    let value = s.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

export function generate() {
  if (!existsSync(ENV_PATH)) {
    console.warn('[config] 未找到 .env.local，跳过配置生成。');
    return false;
  }
  const env = parseEnv(readFileSync(ENV_PATH, 'utf8'));
  const get = (key, fallback = '') => (env[key] !== undefined && env[key] !== '' ? env[key] : fallback);
  const warnIfEmpty = (key) => {
    if (!get(key)) console.warn(`  [config] 注意：${key} 尚未填写`);
  };

  const wrangler = `name = "${get('CF_WORKER_NAME', 'ownerweb-api')}"
main = "src/index.js"
compatibility_date = "2024-11-01"

# 本文件由 scripts/gen-config.mjs 从 .env.local 生成，请勿手改
[[d1_databases]]
binding = "DB"
database_name = "${get('CF_D1_NAME', 'ownerweb')}"
database_id = "${get('CF_D1_ID', 'local-dev-placeholder')}"

[[kv_namespaces]]
binding = "MEDIA"
id = "${get('CF_KV_ID', 'local-dev-placeholder')}"
`;
  writeFileSync(resolve(ROOT, 'worker/wrangler.toml'), wrangler);

  const devVars = `JWT_SECRET=${get('JWT_SECRET')}
ADMIN_EMAIL=${get('ADMIN_EMAIL')}
ADMIN_PASSWORD=${get('ADMIN_PASSWORD')}
CORS_ORIGIN=${get('CORS_ORIGIN', 'http://localhost:5173')}
`;
  writeFileSync(resolve(ROOT, 'worker/.dev.vars'), devVars);

  const secrets = {
    JWT_SECRET: get('JWT_SECRET'),
    ADMIN_EMAIL: get('ADMIN_EMAIL'),
    ADMIN_PASSWORD: get('ADMIN_PASSWORD'),
    CORS_ORIGIN: get('CORS_ORIGIN'),
  };
  writeFileSync(resolve(ROOT, 'worker/.secrets.json'), JSON.stringify(secrets, null, 2) + '\n');

  // 注意：不再生成 .env.production。Vite 会自动加载根目录 .env.local，
  // 且只有 VITE_ 前缀变量会暴露给前端，因此 VITE_API_BASE 直接从 .env.local 读取即可。
  console.log('[config] 已生成 worker/wrangler.toml、worker/.dev.vars、worker/.secrets.json');
  warnIfEmpty('CF_D1_ID');
  warnIfEmpty('CF_KV_ID');
  return true;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) generate();
