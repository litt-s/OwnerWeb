import { Hono } from 'hono';

const r = new Hono();

// 从 R2 读取媒体（头像 / 项目封面 / 视频）
r.get('/media/*', async (c) => {
  const key = c.req.path.replace(/^\/media\//, '');
  if (!key) return c.notFound();
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.notFound();
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
});

export default r;
