// Cloudflare Pages Function：把 /media/* 反向代理到后端 Worker，
// 让浏览器只访问 Pages 域名（国内可访问），媒体加载无需直连 workers.dev。
// 在 Cloudflare Pages 项目设置里添加环境变量 API_ORIGIN（后端 Worker 域名）
export async function onRequest(context) {
  const { request, env } = context;
  const origin = env.API_ORIGIN;
  if (!origin) {
    return new Response('API_ORIGIN 未配置', { status: 500 });
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
