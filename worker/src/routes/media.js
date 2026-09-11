import { Hono } from 'hono';
import { contentTypeFromKey } from '../lib/util.js';

const r = new Hono();

// 从 KV 读取媒体（头像 / 项目封面）
r.get('/media/*', async (c) => {
  const key = c.req.path.replace(/^\/media\//, '');
  if (!key) return c.notFound();
  const buf = await c.env.MEDIA.get(key, { type: 'arrayBuffer' });
  if (!buf) return c.notFound();
  const headers = new Headers();
  headers.set('content-type', contentTypeFromKey(key));
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(buf, { headers });
});

export default r;
