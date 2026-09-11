// 读取根目录 .env.local，生成各配置文件
//   worker/wrangler.toml   Cloudflare Worker 的 D1 / R2 绑定
//   worker/.dev.vars       本地 wrangler dev 的密钥
//   worker/.secrets.json   线上 secrets（wrangler secret bulk 用）
//   .env.production        前端生产 VITE_API_BASE
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

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "${get('CF_R2_BUCKET', 'ownerweb-media')}"
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

  writeFileSync(resolve(ROOT, '.env.production'), `VITE_API_BASE=${get('VITE_API_BASE')}\n`);

  console.log('[config] 已生成 worker/wrangler.toml、worker/.dev.vars、worker/.secrets.json、.env.production');
  warnIfEmpty('CF_D1_ID');
  warnIfEmpty('VITE_API_BASE');
  return true;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) generate();
