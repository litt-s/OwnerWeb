import { Hono } from 'hono';
import { auth, adminOnly } from '../lib/auth.js';
import {
  extFromMime,
  normalizeProjectInput,
  normalizeSiteContentInput,
  normalizeStrengthInput,
  projectDto,
  publicUser,
  siteContentDto,
  strengthDto,
} from '../lib/util.js';

const r = new Hono();
r.use('*', auth, adminOnly);

/* ---------- 评论管理 ---------- */
r.get('/comments', async (c) => {
  const gb = (await c.env.DB.prepare('SELECT * FROM guestbook_comments ORDER BY created_at DESC').all()).results.map((row) => ({
    ...row,
    scope: 'guestbook',
    location: '访客留言',
  }));
  const names = {};
  const projs = (await c.env.DB.prepare('SELECT id, name FROM projects').all()).results;
  projs.forEach((p) => (names[p.id] = p.name));
  const pj = (await c.env.DB.prepare('SELECT * FROM project_comments ORDER BY created_at DESC').all()).results.map((row) => ({
    ...row,
    scope: 'project',
    location: names[row.project_id] || row.project_id,
  }));
  const comments = [...gb, ...pj].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return c.json({ comments });
});

async function deleteCommentTree(env, table, id) {
  const rows = (await env.DB.prepare(`SELECT id, parent_id FROM ${table}`).all()).results;
  const ids = new Set([Number(id)]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) {
      if (row.parent_id != null && ids.has(Number(row.parent_id)) && !ids.has(Number(row.id))) {
        ids.add(Number(row.id));
        changed = true;
      }
    }
  }
  const list = [...ids];
  const placeholders = list.map(() => '?').join(', ');
  await env.DB.prepare(`DELETE FROM ${table} WHERE id IN (${placeholders})`).bind(...list).run();
}

r.delete('/guestbook-comments/:id', async (c) => {
  await deleteCommentTree(c.env, 'guestbook_comments', c.req.param('id'));
  return c.json({ ok: true });
});
r.delete('/project-comments/:id', async (c) => {
  await deleteCommentTree(c.env, 'project_comments', c.req.param('id'));
  return c.json({ ok: true });
});

/* ---------- 项目管理 ---------- */
r.get('/projects', async (c) => {
  const origin = new URL(c.req.url).origin;
  const { results } = await c.env.DB.prepare('SELECT * FROM projects ORDER BY sort_order ASC, id ASC').all();
  return c.json({ projects: results.map((row) => projectDto(origin, row)) });
});

r.post('/projects', async (c) => {
  const maxRow = await c.env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM projects').first();
  const normalized = normalizeProjectInput(await c.req.json().catch(() => ({})), { sort_order: maxRow.max_order + 1 });
  if (normalized.error) return c.json({ error: normalized.error }, 400);
  const dup = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ?').bind(normalized.id).first();
  if (dup) return c.json({ error: '该项目 ID 已存在' }, 409);
  await c.env.DB.prepare(
    `INSERT INTO projects (id, sort_order, name, en, tagline, desc, long_desc, video, cover, link, link_label, tech_json, points_json, requires_login)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      normalized.id,
      normalized.sort_order,
      normalized.name,
      normalized.en,
      normalized.tagline,
      normalized.desc,
      normalized.longDesc,
      normalized.video,
      normalized.cover,
      normalized.link,
      normalized.linkLabel,
      JSON.stringify(normalized.tech),
      JSON.stringify(normalized.points),
      normalized.requires_login
    )
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(normalized.id).first();
  return c.json({ project: projectDto(new URL(c.req.url).origin, row) }, 201);
});

r.put('/projects/:id', async (c) => {
  const existing = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(c.req.param('id')).first();
  if (!existing) return c.json({ error: '项目不存在' }, 404);
  const normalized = normalizeProjectInput({ ...(await c.req.json().catch(() => ({}))), id: existing.id }, existing);
  if (normalized.error) return c.json({ error: normalized.error }, 400);
  await c.env.DB.prepare(
    `UPDATE projects SET sort_order=?, name=?, en=?, tagline=?, desc=?, long_desc=?, video=?, cover=?, link=?, link_label=?, tech_json=?, points_json=?, requires_login=?, updated_at=datetime('now') WHERE id=?`
  )
    .bind(
      normalized.sort_order,
      normalized.name,
      normalized.en,
      normalized.tagline,
      normalized.desc,
      normalized.longDesc,
      normalized.video,
      normalized.cover,
      normalized.link,
      normalized.linkLabel,
      JSON.stringify(normalized.tech),
      JSON.stringify(normalized.points),
      normalized.requires_login,
      existing.id
    )
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(existing.id).first();
  return c.json({ project: projectDto(new URL(c.req.url).origin, row) });
});

r.delete('/projects/:id', async (c) => {
  const existing = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ?').bind(c.req.param('id')).first();
  if (!existing) return c.json({ error: '项目不存在' }, 404);
  await c.env.DB.prepare('DELETE FROM project_comments WHERE project_id = ?').bind(existing.id).run();
  await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(existing.id).run();
  return c.json({ ok: true });
});

// 封面存 KV；视频改为外链（通过项目 PUT 的 video 字段填写）
async function uploadProjectCover(c) {
  const row = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ?').bind(c.req.param('id')).first();
  if (!row) return c.json({ error: '项目不存在' }, 404);
  const form = await c.req.formData();
  const file = form.get('cover');
  if (!file || typeof file === 'string') return c.json({ error: '未上传封面' }, 400);
  const key = `projects/covers/${row.id}-${Date.now()}${extFromMime(file.type, '.png')}`;
  await c.env.MEDIA.put(key, await file.arrayBuffer());
  await c.env.DB.prepare("UPDATE projects SET cover = ?, updated_at = datetime('now') WHERE id = ?").bind(key, row.id).run();
  const updated = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(row.id).first();
  return c.json({ project: projectDto(new URL(c.req.url).origin, updated) });
}
r.post('/projects/:id/cover', uploadProjectCover);

/* ---------- 优势管理 ---------- */
r.get('/strengths', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM strengths ORDER BY sort_order ASC, id ASC').all();
  return c.json({ strengths: results.map(strengthDto) });
});
r.post('/strengths', async (c) => {
  const maxRow = await c.env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM strengths').first();
  const normalized = normalizeStrengthInput(await c.req.json().catch(() => ({})), { sort_order: maxRow.max_order + 1 });
  if (normalized.error) return c.json({ error: normalized.error }, 400);
  const info = await c.env.DB.prepare('INSERT INTO strengths (sort_order, title, description) VALUES (?, ?, ?)')
    .bind(normalized.sort_order, normalized.title, normalized.desc)
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM strengths WHERE id = ?').bind(info.meta.last_row_id).first();
  return c.json({ strength: strengthDto(row) }, 201);
});
r.put('/strengths/:id', async (c) => {
  const existing = await c.env.DB.prepare('SELECT * FROM strengths WHERE id = ?').bind(c.req.param('id')).first();
  if (!existing) return c.json({ error: '优势不存在' }, 404);
  const normalized = normalizeStrengthInput(await c.req.json().catch(() => ({})), existing);
  if (normalized.error) return c.json({ error: normalized.error }, 400);
  await c.env.DB.prepare(`UPDATE strengths SET sort_order=?, title=?, description=?, updated_at=datetime('now') WHERE id=?`)
    .bind(normalized.sort_order, normalized.title, normalized.desc, existing.id)
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM strengths WHERE id = ?').bind(existing.id).first();
  return c.json({ strength: strengthDto(row) });
});
r.delete('/strengths/:id', async (c) => {
  const existing = await c.env.DB.prepare('SELECT id FROM strengths WHERE id = ?').bind(c.req.param('id')).first();
  if (!existing) return c.json({ error: '优势不存在' }, 404);
  await c.env.DB.prepare('DELETE FROM strengths WHERE id = ?').bind(existing.id).run();
  return c.json({ ok: true });
});

/* ---------- 站点内容 ---------- */
r.get('/content/site', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM site_content WHERE id = 1').first();
  if (!row) return c.json({ error: '站点内容不存在' }, 404);
  return c.json({ content: siteContentDto(row) });
});
r.put('/content/site', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM site_content WHERE id = 1').first();
  if (!row) return c.json({ error: '站点内容不存在' }, 404);
  const normalized = normalizeSiteContentInput(await c.req.json().catch(() => ({})), siteContentDto(row));
  if (normalized.error) return c.json({ error: normalized.error }, 400);
  await c.env.DB.prepare(`UPDATE site_content SET profile_json=?, hero_json=?, experience_json=?, contact_json=?, updated_at=datetime('now') WHERE id=1`)
    .bind(
      JSON.stringify(normalized.profile),
      JSON.stringify(normalized.hero),
      JSON.stringify(normalized.experience),
      JSON.stringify(normalized.contact)
    )
    .run();
  const updated = await c.env.DB.prepare('SELECT * FROM site_content WHERE id = 1').first();
  return c.json({ content: siteContentDto(updated) });
});

/* ---------- 用户管理 ---------- */
r.get('/users', async (c) => {
  const origin = new URL(c.req.url).origin;
  const { results } = await c.env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  return c.json({ users: results.map((u) => publicUser(origin, u)) });
});
r.patch('/users/:id', async (c) => {
  const { role, banned } = await c.req.json().catch(() => ({}));
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.req.param('id')).first();
  if (!user) return c.json({ error: '用户不存在' }, 404);
  if (user.id === c.get('user').id && banned) return c.json({ error: '不能封禁自己' }, 400);
  if (role) await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role === 'admin' ? 'admin' : 'user', user.id).run();
  if (banned !== undefined) await c.env.DB.prepare('UPDATE users SET banned = ? WHERE id = ?').bind(banned ? 1 : 0, user.id).run();
  const updated = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  return c.json({ user: publicUser(new URL(c.req.url).origin, updated) });
});
r.delete('/users/:id', async (c) => {
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.req.param('id')).first();
  if (!user) return c.json({ error: '用户不存在' }, 404);
  if (user.id === c.get('user').id) return c.json({ error: '不能删除自己' }, 400);
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();
  return c.json({ ok: true });
});

export default r;
