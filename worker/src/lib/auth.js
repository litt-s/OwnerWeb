import { verify as jwtVerify } from 'hono/jwt';

// 登录校验：解析 Bearer token，加载用户，挂到 c.get('user')
export const auth = async (c, next) => {
  const header = c.req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return c.json({ error: '未登录' }, 401);
  try {
    const payload = await jwtVerify(token, c.env.JWT_SECRET, 'HS256');
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.id).first();
    if (!user) return c.json({ error: '用户不存在' }, 401);
    if (user.banned) return c.json({ error: '账号已被封禁' }, 403);
    c.set('user', user);
    await next();
  } catch {
    return c.json({ error: '登录已失效' }, 401);
  }
};

// 可选登录：带了有效 token 就挂载 user，否则按访客继续（不拦截）
export const maybeAuth = async (c, next) => {
  const header = c.req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = await jwtVerify(token, c.env.JWT_SECRET, 'HS256');
      const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.id).first();
      if (user && !user.banned) c.set('user', user);
    } catch {
      // 无效 token 按访客处理
    }
  }
  await next();
};

export const adminOnly = async (c, next) => {
  if (c.get('user')?.role !== 'admin') return c.json({ error: '无权限' }, 403);
  await next();
};
