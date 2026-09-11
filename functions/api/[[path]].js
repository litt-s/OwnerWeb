// Cloudflare Pages Function：把 /api/* 反向代理到后端服务，避免跨域。
// 在 Cloudflare Pages 项目设置里添加环境变量 API_ORIGIN（后端域名，如 https://your-api.onrender.com）
export async function onRequest(context) {
  const { request, env } = context;
  const origin = env.API_ORIGIN;
  if (!origin) {
    return new Response(JSON.stringify({ error: 'API_ORIGIN 未配置' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const target = origin.replace(/\/$/, '') + url.pathname + url.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('cf-connecting-ip');

  const init = { method: request.method, headers, redirect: 'manual' };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  const resp = await fetch(target, init);
  return new Response(resp.body, {
    status: resp.status,
    headers: resp.headers,
  });
}
