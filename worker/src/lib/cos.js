// 腾讯云 COS：生成 PUT Object 预签名，供前端直传（桶权限：公有读私有写）

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha1Hex(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  return bufToHex(sig);
}

async function sha1Hex(message) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(message));
  return bufToHex(digest);
}

const encodePath = (key) => '/' + String(key).split('/').map(encodeURIComponent).join('/');

export function isCosConfigured(env) {
  return !!(env.COS_SECRET_ID && env.COS_SECRET_KEY && env.COS_BUCKET && env.COS_REGION);
}

export function cosHost(env) {
  return `${env.COS_BUCKET}.cos.${env.COS_REGION}.myqcloud.com`;
}

// 对外可访问地址：优先自定义/CDN 域名，否则 COS 默认域名
export function cosPublicUrl(env, key) {
  const base = env.COS_DOMAIN
    ? String(env.COS_DOMAIN).replace(/\/+$/, '')
    : `https://${cosHost(env)}`;
  return `${base}${encodePath(key)}`;
}

// 生成 PUT Object 的 Authorization 头（签名 host）
export async function signCosPut(env, key, expires = 900) {
  const host = cosHost(env);
  const now = Math.floor(Date.now() / 1000);
  const keyTime = `${now};${now + expires}`;
  const signKey = await hmacSha1Hex(env.COS_SECRET_KEY, keyTime);
  const uriPath = encodePath(key);
  const httpString = `put\n${uriPath}\n\nhost=${encodeURIComponent(host)}\n`;
  const stringToSign = `sha1\n${keyTime}\n${await sha1Hex(httpString)}\n`;
  const signature = await hmacSha1Hex(signKey, stringToSign);
  const authorization = [
    'q-sign-algorithm=sha1',
    `q-ak=${env.COS_SECRET_ID}`,
    `q-sign-time=${keyTime}`,
    `q-key-time=${keyTime}`,
    'q-header-list=host',
    'q-url-param-list=',
    `q-signature=${signature}`,
  ].join('&');
  return { authorization, uploadUrl: `https://${host}${uriPath}`, key, expires };
}
