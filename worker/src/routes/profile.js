import { Hono } from 'hono';
import { auth } from '../lib/auth.js';
import { hashPassword, verifyPassword } from '../password.js';
import { base64ToBytes, extFromMime, publicUser } from '../lib/util.js';

const r = new Hono();
r.use('*', auth);

const NICKNAME_MAX = 30;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

r.put('/', async (c) => {
  const { nickname } = await c.req.json().catch(() => ({}));
  const user = c.get('user');
  let next = user.nickname;
  if (typeof nickname === 'string' && nickname.trim()) {
    const trimmed = nickname.trim();
    if (trimmed.length > NICKNAME_MAX) return c.json({ error: `昵称不能超过 ${NICKNAME_MAX} 个字符` }, 400);
    next = trimmed;
  }
  await c.env.DB.prepare('UPDATE users SET nickname = ? WHERE id = ?').bind(next, user.id).run();
  const updated = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  return c.json({ user: publicUser(new URL(c.req.url).origin, updated) });
});

r.post('/avatar', async (c) => {
  const { dataUrl } = await c.req.json().catch(() => ({}));
  const m = /^data:([\w.+-]+\/[\w.+-]+);base64,([\s\S]*)$/.exec(dataUrl || '');
  if (!m) return c.json({ error: '图片数据无效' }, 400);
  const mime = m[1].toLowerCase();
  if (!AVATAR_TYPES.includes(mime)) return c.json({ error: '仅支持 PNG / JPG / WebP / GIF 图片' }, 400);
  let bytes;
  try {
    bytes = base64ToBytes(m[2]);
  } catch {
    return c.json({ error: '图片数据无效' }, 400);
  }
  if (bytes.length > AVATAR_MAX_BYTES) return c.json({ error: '图片不能超过 2MB' }, 400);
  const key = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}${extFromMime(mime)}`;
  await c.env.MEDIA.put(key, bytes);
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
