import { Hono } from 'hono';
import { auth } from '../lib/auth.js';
import { hashPassword, verifyPassword } from '../password.js';
import { base64ToBytes, extFromMime, publicUser } from '../lib/util.js';

const r = new Hono();
r.use('*', auth);

r.put('/', async (c) => {
  const { nickname } = await c.req.json().catch(() => ({}));
  const user = c.get('user');
  const next = typeof nickname === 'string' && nickname.trim() ? nickname.trim() : user.nickname;
  await c.env.DB.prepare('UPDATE users SET nickname = ? WHERE id = ?').bind(next, user.id).run();
  const updated = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  return c.json({ user: publicUser(new URL(c.req.url).origin, updated) });
});

r.post('/avatar', async (c) => {
  const { dataUrl } = await c.req.json().catch(() => ({}));
  const m = /^data:(.+?);base64,(.*)$/.exec(dataUrl || '');
  if (!m) return c.json({ error: '图片数据无效' }, 400);
  const bytes = base64ToBytes(m[2]);
  if (bytes.length > 2 * 1024 * 1024) return c.json({ error: '图片不能超过 2MB' }, 400);
  const key = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}${extFromMime(m[1])}`;
  await c.env.MEDIA.put(key, bytes, { httpMetadata: { contentType: m[1] } });
  const user = c.get('user');
  await c.env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(key, user.id).run();
  const updated = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  return c.json({ user: publicUser(new URL(c.req.url).origin, updated) });
});

r.put('/password', async (c) => {
  const { oldPassword, newPassword } = await c.req.json().catch(() => ({}));
  const user = c.get('user');
  if (!(await verifyPassword(oldPassword || '', user.password_hash))) return c.json({ error: '原密码错误' }, 400);
  if (!newPassword || newPassword.length < 6) return c.json({ error: '新密码至少 6 位' }, 400);
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(await hashPassword(newPassword), user.id)
    .run();
  return c.json({ ok: true });
});

export default r;
