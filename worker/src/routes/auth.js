import { Hono } from 'hono';
import { sign as jwtSign } from 'hono/jwt';
import { hashPassword, verifyPassword } from '../password.js';
import { auth } from '../lib/auth.js';
import { publicUser } from '../lib/util.js';

const r = new Hono();

const issue = async (c, user) =>
  jwtSign({ id: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 }, c.env.JWT_SECRET);

r.post('/register', async (c) => {
  const { email, password, nickname } = await c.req.json().catch(() => ({}));
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return c.json({ error: '邮箱格式不正确' }, 400);
  if (!password || password.length < 6) return c.json({ error: '密码至少 6 位' }, 400);
  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (exists) return c.json({ error: '该邮箱已注册' }, 409);
  const info = await c.env.DB.prepare('INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)')
    .bind(email, await hashPassword(password), nickname || email.split('@')[0])
    .run();
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(info.meta.last_row_id).first();
  return c.json({ token: await issue(c, user), user: publicUser(new URL(c.req.url).origin, user) });
});

r.post('/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}));
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user || !(await verifyPassword(password || '', user.password_hash))) {
    return c.json({ error: '邮箱或密码错误' }, 401);
  }
  if (user.banned) return c.json({ error: '账号已被封禁' }, 403);
  return c.json({ token: await issue(c, user), user: publicUser(new URL(c.req.url).origin, user) });
});

r.get('/me', auth, (c) => c.json({ user: publicUser(new URL(c.req.url).origin, c.get('user')) }));

export default r;
