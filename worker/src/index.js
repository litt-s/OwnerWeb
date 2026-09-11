import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ensureSeed } from './lib/seed.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import mediaRoutes from './routes/media.js';

const app = new Hono();

/* CORS */
app.use('/api/*', (c, next) =>
  cors({
    origin: (origin) => {
      const list = (c.env.CORS_ORIGIN || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length === 0) return origin || '*';
      return list.includes(origin) ? origin : '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })(c, next)
);

/* 首次访问自动播种 */
app.use('/api/*', async (c, next) => {
  await ensureSeed(c.env);
  await next();
});

/* 健康检查 */
app.get('/api/health', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1 AS ok').first();
    return c.json({ ok: true, service: 'ownerweb-api' });
  } catch {
    return c.json({ ok: false, error: '数据库不可用' }, 503);
  }
});

/* 路由模块 */
app.route('/api/auth', authRoutes);
app.route('/api/profile', profileRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api', publicRoutes);
app.route('/', mediaRoutes);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

export default app;
