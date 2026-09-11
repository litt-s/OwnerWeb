import { Hono } from 'hono';
import { auth } from '../lib/auth.js';
import {
  publicComment,
  projectDto,
  siteContentDto,
  strengthDto,
  normalizeCommentInput,
} from '../lib/util.js';

const r = new Hono();

/* 优势 */
r.get('/strengths', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM strengths ORDER BY sort_order ASC, id ASC').all();
  return c.json({ strengths: results.map(strengthDto) });
});

/* 站点内容 */
r.get('/content/site', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM site_content WHERE id = 1').first();
  if (!row) return c.json({ error: '站点内容不存在' }, 404);
  return c.json({ content: siteContentDto(row) });
});

/* 项目 */
r.get('/projects', async (c) => {
  const origin = new URL(c.req.url).origin;
  const { results } = await c.env.DB.prepare('SELECT * FROM projects ORDER BY sort_order ASC, id ASC').all();
  return c.json({ projects: results.map((row) => projectDto(origin, row)) });
});

r.get('/projects/:projectId', async (c) => {
  const origin = new URL(c.req.url).origin;
  const row = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(c.req.param('projectId')).first();
  if (!row) return c.json({ error: '项目不存在' }, 404);
  return c.json({ project: projectDto(origin, row) });
});

/* 留言（访客留言） */
r.get('/guestbook-comments', async (c) => {
  const origin = new URL(c.req.url).origin;
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, u.avatar AS user_avatar FROM guestbook_comments c LEFT JOIN users u ON u.id = c.user_id ORDER BY c.created_at ASC, c.id ASC`
  ).all();
  return c.json({ comments: results.map((row) => publicComment(origin, row)) });
});

async function insertComment(env, table, columns, values, rootId) {
  const cols = rootId === null ? columns : [...columns, 'root_id'];
  const vals = rootId === null ? values : [...values, rootId];
  const placeholders = vals.map(() => '?').join(', ');
  const info = await env.DB.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`).bind(...vals).run();
  const id = info.meta.last_row_id;
  if (rootId === null) await env.DB.prepare(`UPDATE ${table} SET root_id = id WHERE id = ?`).bind(id).run();
  return env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
}

r.post('/guestbook-comments', auth, async (c) => {
  const normalized = normalizeCommentInput(await c.req.json().catch(() => ({})));
  if (normalized.error) return c.json({ error: normalized.error }, 400);
  const user = c.get('user');
  let rootId = null;
  if (normalized.parent_id !== null) {
    const parent = await c.env.DB.prepare('SELECT id, root_id FROM guestbook_comments WHERE id = ?').bind(normalized.parent_id).first();
    if (!parent) return c.json({ error: '回复的留言不存在' }, 400);
    rootId = parent.root_id ?? parent.id;
  }
  const nickname = user.nickname || user.email.split('@')[0];
  const comment = await insertComment(
    c.env,
    'guestbook_comments',
    ['nickname', 'email', 'content', 'user_id', 'parent_id'],
    [nickname, user.email, normalized.content, user.id, normalized.parent_id],
    rootId
  );
  comment.user_avatar = user.avatar;
  return c.json({ comment: publicComment(new URL(c.req.url).origin, comment) }, 201);
});

/* 项目评论 */
r.get('/projects/:projectId/comments', async (c) => {
  const origin = new URL(c.req.url).origin;
  const pid = c.req.param('projectId');
  const project = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ?').bind(pid).first();
  if (!project) return c.json({ error: '项目不存在' }, 404);
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, u.avatar AS user_avatar FROM project_comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.project_id = ? ORDER BY c.created_at ASC, c.id ASC`
  ).bind(pid).all();
  return c.json({ comments: results.map((row) => publicComment(origin, row)) });
});

r.post('/projects/:projectId/comments', auth, async (c) => {
  const pid = c.req.param('projectId');
  const project = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ?').bind(pid).first();
  if (!project) return c.json({ error: '项目不存在' }, 404);
  const normalized = normalizeCommentInput(await c.req.json().catch(() => ({})));
  if (normalized.error) return c.json({ error: normalized.error }, 400);
  const user = c.get('user');
  let rootId = null;
  if (normalized.parent_id !== null) {
    const parent = await c.env.DB.prepare('SELECT id, root_id FROM project_comments WHERE id = ? AND project_id = ?')
      .bind(normalized.parent_id, pid)
      .first();
    if (!parent) return c.json({ error: '回复的评论不存在' }, 400);
    rootId = parent.root_id ?? parent.id;
  }
  const nickname = user.nickname || user.email.split('@')[0];
  const comment = await insertComment(
    c.env,
    'project_comments',
    ['project_id', 'nickname', 'email', 'content', 'user_id', 'parent_id'],
    [pid, nickname, user.email, normalized.content, user.id, normalized.parent_id],
    rootId
  );
  comment.user_avatar = user.avatar;
  return c.json({ comment: publicComment(new URL(c.req.url).origin, comment) }, 201);
});

export default r;
