import { Hono } from 'hono';
import { auth, maybeAuth } from '../lib/auth.js';
import {
  publicComment,
  projectDto,
  siteContentDto,
  strengthDto,
  normalizeCommentInput,
} from '../lib/util.js';

const r = new Hono();

// 顶层评论分页参数：limit（默认 10，上限 50）、cursor（keyset，取上页最后一个 id）
function pageParams(c) {
  const sp = new URL(c.req.url).searchParams;
  const rawLimit = Number(sp.get('limit'));
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 10;
  const rawCursor = Number(sp.get('cursor'));
  const cursor = Number.isInteger(rawCursor) && rawCursor > 0 ? rawCursor : 0;
  return { limit, cursor };
}

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

/* 项目（未登录时，需登录的项目只返回锁定卡片信息） */
r.get('/projects', maybeAuth, async (c) => {
  const origin = new URL(c.req.url).origin;
  const user = c.get('user');
  const { results } = await c.env.DB.prepare('SELECT * FROM projects ORDER BY sort_order ASC, id ASC').all();
  return c.json({
    projects: results.map((row) => projectDto(origin, row, { locked: !user && !!row.requires_login })),
  });
});

r.get('/projects/:projectId', maybeAuth, async (c) => {
  const origin = new URL(c.req.url).origin;
  const user = c.get('user');
  const row = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(c.req.param('projectId')).first();
  if (!row) return c.json({ error: '项目不存在' }, 404);
  if (row.requires_login && !user) return c.json({ error: '该作品需要登录后查看' }, 401);
  return c.json({ project: projectDto(origin, row) });
});

/* 留言（访客留言）：顶层评论 keyset 分页 */
r.get('/guestbook-comments', async (c) => {
  const origin = new URL(c.req.url).origin;
  const { limit, cursor } = pageParams(c);
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, u.avatar AS user_avatar,
       (SELECT COUNT(*) FROM guestbook_comments r WHERE r.root_id = c.id AND r.parent_id IS NOT NULL) AS reply_count
     FROM guestbook_comments c LEFT JOIN users u ON u.id = c.user_id
     WHERE c.parent_id IS NULL AND c.id > ?
     ORDER BY c.id ASC LIMIT ?`
  )
    .bind(cursor, limit + 1)
    .all();
  const hasMore = results.length > limit;
  const page = hasMore ? results.slice(0, limit) : results;
  return c.json({
    comments: page.map((row) => publicComment(origin, row)),
    hasMore,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});

/* 某条顶层留言下的全部回复（按需加载） */
r.get('/guestbook-comments/:rootId/replies', async (c) => {
  const origin = new URL(c.req.url).origin;
  const rootId = Number(c.req.param('rootId'));
  if (!Number.isInteger(rootId) || rootId <= 0) return c.json({ error: '参数不正确' }, 400);
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, u.avatar AS user_avatar FROM guestbook_comments c LEFT JOIN users u ON u.id = c.user_id
     WHERE c.root_id = ? AND c.parent_id IS NOT NULL ORDER BY c.id ASC`
  )
    .bind(rootId)
    .all();
  return c.json({ replies: results.map((row) => publicComment(origin, row)) });
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

/* 项目评论：顶层评论 keyset 分页 */
r.get('/projects/:projectId/comments', async (c) => {
  const origin = new URL(c.req.url).origin;
  const pid = c.req.param('projectId');
  const project = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ?').bind(pid).first();
  if (!project) return c.json({ error: '项目不存在' }, 404);
  const { limit, cursor } = pageParams(c);
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, u.avatar AS user_avatar,
       (SELECT COUNT(*) FROM project_comments r WHERE r.root_id = c.id AND r.parent_id IS NOT NULL) AS reply_count
     FROM project_comments c LEFT JOIN users u ON u.id = c.user_id
     WHERE c.project_id = ? AND c.parent_id IS NULL AND c.id > ?
     ORDER BY c.id ASC LIMIT ?`
  )
    .bind(pid, cursor, limit + 1)
    .all();
  const hasMore = results.length > limit;
  const page = hasMore ? results.slice(0, limit) : results;
  return c.json({
    comments: page.map((row) => publicComment(origin, row)),
    hasMore,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});

/* 某条顶层项目评论下的全部回复（按需加载） */
r.get('/projects/:projectId/comments/:rootId/replies', async (c) => {
  const origin = new URL(c.req.url).origin;
  const pid = c.req.param('projectId');
  const rootId = Number(c.req.param('rootId'));
  if (!Number.isInteger(rootId) || rootId <= 0) return c.json({ error: '参数不正确' }, 400);
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, u.avatar AS user_avatar FROM project_comments c LEFT JOIN users u ON u.id = c.user_id
     WHERE c.project_id = ? AND c.root_id = ? AND c.parent_id IS NOT NULL ORDER BY c.id ASC`
  )
    .bind(pid, rootId)
    .all();
  return c.json({ replies: results.map((row) => publicComment(origin, row)) });
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
