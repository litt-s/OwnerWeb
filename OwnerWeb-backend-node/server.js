import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET. Copy server/.env.example to server/.env and set a strong random value.');
}
if (process.env.NODE_ENV === 'production' && configuredOrigins.length === 0) {
  throw new Error('Missing CORS_ORIGIN in production.');
}
if (process.env.NODE_ENV === 'production' && (!process.env.DB_DIR || !process.env.UPLOAD_DIR)) {
  throw new Error('Missing DB_DIR or UPLOAD_DIR in production.');
}

const app = express();
app.use(cors(configuredOrigins.length ? {
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
} : undefined));
app.use(express.json());

const UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

const PROJECT_MEDIA_DIR = path.join(UPLOAD_DIR, 'projects');
const projectMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = file.fieldname === 'video' ? 'videos' : 'covers';
    const dir = path.join(PROJECT_MEDIA_DIR, subDir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || (file.fieldname === 'video' ? '.mp4' : '.png');
    cb(null, `${req.params.id}-${file.fieldname}-${Date.now()}${ext}`);
  },
});
const projectMediaUpload = multer({
  storage: projectMediaStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype);
    const isVideo = file.mimetype.startsWith('video/');
    if ((file.fieldname === 'cover' && isImage) || (file.fieldname === 'video' && isVideo)) cb(null, true);
    else cb(new Error(file.fieldname === 'video' ? '仅支持视频文件' : '仅支持 PNG、JPG 或 WebP 图片'));
  },
});

function handleUpload(uploader) {
  return (req, res, next) => {
    uploader(req, res, (error) => {
      if (error) return res.status(400).json({ error: error.message });
      next();
    });
  };
}

const uploadProjectVideo = handleUpload(projectMediaUpload.single('video'));
const uploadProjectCover = handleUpload(projectMediaUpload.single('cover'));

function getProjectRow(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

function projectExists(id) {
  return !!getProjectRow(id);
}

function projectName(id) {
  return getProjectRow(id)?.name || id;
}

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  nickname: u.nickname,
  avatar: u.avatar,
  role: u.role,
  banned: !!u.banned,
  created_at: u.created_at,
});

const publicGuestbookComment = (c) => ({
  id: c.id,
  nickname: c.nickname,
  avatar: c.user_avatar ?? null,
  content: c.content,
  parent_id: c.parent_id,
  root_id: c.root_id,
  created_at: c.created_at,
});

const publicProjectComment = (c) => ({
  id: c.id,
  nickname: c.nickname,
  avatar: c.user_avatar ?? null,
  content: c.content,
  parent_id: c.parent_id,
  root_id: c.root_id,
  created_at: c.created_at,
});

const adminGuestbookComment = (c) => ({
  ...c,
  scope: 'guestbook',
  location: '访客留言',
});

const adminProjectComment = (c) => ({
  ...c,
  scope: 'project',
  location: projectName(c.project_id),
});

app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1 AS ok').get();
    res.json({ ok: true, service: 'ownerweb-api' });
  } catch {
    res.status(503).json({ ok: false, error: '数据库不可用' });
  }
});

function normalizeCommentInput({ content, parent_id }) {
  const trimmed = typeof content === 'string' ? content.trim() : '';
  if (!trimmed) return { error: '内容必填' };
  if (trimmed.length > 500) return { error: '内容不能超过 500 字' };

  if (parent_id === undefined || parent_id === null) return { content: trimmed, parent_id: null };
  const parentId = Number(parent_id);
  if (!Number.isInteger(parentId) || parentId <= 0) return { error: '回复目标不正确' };
  return { content: trimmed, parent_id: parentId };
}

function insertComment({ table, columns, values, rootId = null }) {
  const insertColumns = rootId === null ? columns : [...columns, 'root_id'];
  const insertValues = rootId === null ? values : [...values, rootId];
  const placeholders = insertValues.map(() => '?').join(', ');
  const info = db.prepare(
    `INSERT INTO ${table} (${insertColumns.join(', ')}) VALUES (${placeholders})`
  ).run(...insertValues);
  const comment = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
  if (rootId === null) {
    db.prepare(`UPDATE ${table} SET root_id = id WHERE id = ?`).run(info.lastInsertRowid);
    comment.root_id = info.lastInsertRowid;
  }
  return comment;
}

function projectDto(row) {
  return {
    id: row.id,
    sort_order: row.sort_order,
    index: String(row.sort_order).padStart(2, '0'),
    name: row.name,
    en: row.en,
    tagline: row.tagline,
    desc: row.desc,
    longDesc: row.long_desc,
    video: row.video,
    cover: row.cover,
    link: row.link,
    linkLabel: row.link_label,
    tech: JSON.parse(row.tech_json || '[]'),
    points: JSON.parse(row.points_json || '[]'),
  };
}

function parseListValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function textOrEmpty(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeProjectInput(body, existing = {}) {
  const id = textOrEmpty(body.id ?? existing.id).toLowerCase().replace(/\s+/g, '-');
  const name = textOrEmpty(body.name ?? existing.name);
  if (!id) return { error: '项目 ID 必填' };
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return { error: '项目 ID 只能包含小写字母、数字和短横线' };
  if (id.length > 80) return { error: '项目 ID 不能超过 80 个字符' };
  if (!name) return { error: '项目名称必填' };
  if (name.length > 100) return { error: '项目名称不能超过 100 个字符' };

  const parsedSort = Number(body.sort_order ?? existing.sort_order);
  if (!Number.isInteger(parsedSort) || parsedSort < 1) return { error: '排序必须是不小于 1 的整数' };
  return {
    id,
    sort_order: Number.isInteger(parsedSort) ? parsedSort : (existing.sort_order || 1),
    name,
    en: textOrEmpty(body.en ?? existing.en),
    tagline: textOrEmpty(body.tagline ?? existing.tagline),
    desc: textOrEmpty(body.desc ?? existing.desc),
    longDesc: textOrEmpty(body.longDesc ?? body.long_desc ?? existing.long_desc),
    video: body.video === undefined ? existing.video ?? null : textOrEmpty(body.video) || null,
    cover: body.cover === undefined ? existing.cover ?? null : textOrEmpty(body.cover) || null,
    link: textOrEmpty(body.link ?? existing.link),
    linkLabel: textOrEmpty(body.linkLabel ?? body.link_label ?? existing.link_label),
    tech: parseListValue(body.tech ?? (existing.tech_json ? JSON.parse(existing.tech_json) : [])),
    points: parseListValue(body.points ?? (existing.points_json ? JSON.parse(existing.points_json) : [])),
  };
}

function strengthDto(row) {
  return {
    id: row.id,
    sort_order: row.sort_order,
    n: String(row.sort_order).padStart(2, '0'),
    title: row.title,
    desc: row.description,
  };
}

function normalizeStrengthInput(body, existing = {}) {
  const title = textOrEmpty(body.title ?? existing.title);
  const desc = textOrEmpty(body.desc ?? existing.description);
  if (!title) return { error: '优势标题必填' };
  if (title.length > 100) return { error: '优势标题不能超过 100 个字符' };
  if (!desc) return { error: '优势描述必填' };
  if (desc.length > 500) return { error: '优势描述不能超过 500 个字符' };

  const parsedSort = Number(body.sort_order ?? existing.sort_order);
  if (!Number.isInteger(parsedSort) || parsedSort < 1) return { error: '排序必须是不小于 1 的整数' };

  return {
    sort_order: parsedSort,
    title,
    desc,
  };
}

function getStrengthRow(id) {
  return db.prepare('SELECT * FROM strengths WHERE id = ?').get(id);
}

function getSiteContentRow() {
  return db.prepare('SELECT * FROM site_content WHERE id = 1').get();
}

function parseStoredObject(value) {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function siteContentDto(row) {
  return {
    profile: parseStoredObject(row.profile_json),
    hero: parseStoredObject(row.hero_json),
    experience: parseStoredObject(row.experience_json),
  };
}

function textWithLimit(value, fallback, label, limit) {
  const text = typeof value === 'string' ? value.trim() : fallback ?? '';
  if (text.length > limit) throw new Error(`${label}不能超过 ${limit} 个字符`);
  return text;
}

function normalizeSiteContentInput(body, current) {
  const profileInput = body.profile ?? {};
  const heroInput = body.hero ?? {};
  const experienceInput = body.experience ?? {};
  const currentProfile = current.profile ?? {};
  const currentHero = current.hero ?? {};
  const currentExperience = current.experience ?? {};

  try {
    const profile = {
      name: textWithLimit(profileInput.name ?? currentProfile.name, '', '姓名', 80),
      nameEn: textWithLimit(profileInput.nameEn ?? currentProfile.nameEn, '', '英文名', 100),
      role: textWithLimit(profileInput.role ?? currentProfile.role, '', '职业定位', 100),
      roleEn: textWithLimit(profileInput.roleEn ?? currentProfile.roleEn, '', '英文职业定位', 120),
      age: textWithLimit(profileInput.age ?? currentProfile.age, '', '年龄', 20),
      degree: textWithLimit(profileInput.degree ?? currentProfile.degree, '', '学历', 50),
      location: textWithLimit(profileInput.location ?? currentProfile.location, '', '所在地', 120),
      phone: textWithLimit(profileInput.phone ?? currentProfile.phone, '', '联系电话', 40),
      phoneRaw: textWithLimit(profileInput.phoneRaw ?? currentProfile.phoneRaw, '', '电话拨号号码', 40),
      email: textWithLimit(profileInput.email ?? currentProfile.email, '', '邮箱', 160),
      github: textWithLimit(profileInput.github ?? currentProfile.github, '', 'GitHub 用户名', 80),
      githubUrl: textWithLimit(profileInput.githubUrl ?? currentProfile.githubUrl, '', 'GitHub 地址', 300),
      wechat: textWithLimit(profileInput.wechat ?? currentProfile.wechat, '', '微信号', 80),
      focus: textWithLimit(profileInput.focus ?? currentProfile.focus, '', '技术方向', 160),
      certificate: textWithLimit(profileInput.certificate ?? currentProfile.certificate, '', '专业认证', 200),
      education: {
        school: textWithLimit(
          profileInput.education?.school ?? currentProfile.education?.school,
          '',
          '学校',
          120
        ),
        major: textWithLimit(
          profileInput.education?.major ?? currentProfile.education?.major,
          '',
          '专业',
          160
        ),
        period: textWithLimit(
          profileInput.education?.period ?? currentProfile.education?.period,
          '',
          '教育时间',
          80
        ),
      },
    };

    if (!profile.name) throw new Error('姓名必填');
    if (!profile.role) throw new Error('职业定位必填');
    if (!profile.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) throw new Error('联系邮箱格式不正确');
    if (!profile.phone) throw new Error('联系电话必填');
    if (!profile.phoneRaw) throw new Error('电话拨号号码必填');

    const hero = {
      eyebrow: textWithLimit(heroInput.eyebrow ?? currentHero.eyebrow, '', 'Hero 标签', 120),
      statement: textWithLimit(heroInput.statement ?? currentHero.statement, '', 'Hero 宣言', 160),
      headFirst: textWithLimit(heroInput.headFirst ?? currentHero.headFirst, '', '主标题前段', 40),
      headSecond: textWithLimit(heroInput.headSecond ?? currentHero.headSecond, '', '主标题后段', 40),
      sub: textWithLimit(heroInput.sub ?? currentHero.sub, '', 'Hero 副标题', 300),
    };
    if (!hero.headFirst || !hero.headSecond || !hero.sub) throw new Error('Hero 主标题和副标题必填');

    const intro = textWithLimit(
      experienceInput.intro ?? currentExperience.intro,
      '',
      '经历简介',
      1200
    );
    if (!intro) throw new Error('经历简介必填');

    const statsSource = Array.isArray(experienceInput.stats)
      ? experienceInput.stats
      : Array.isArray(currentExperience.stats)
        ? currentExperience.stats
        : [];
    if (statsSource.length > 12) throw new Error('经历统计最多 12 条');
    const stats = statsSource.map((item) => ({
      value: textWithLimit(item?.value, '', '统计数值', 20),
      label: textWithLimit(item?.label, '', '统计标题', 80),
      sub: textWithLimit(item?.sub, '', '统计说明', 120),
    }));
    if (stats.some((item) => !item.value || !item.label)) throw new Error('经历统计的数值和标题必填');

    return {
      profile,
      hero,
      experience: { intro, stats },
    };
  } catch (error) {
    return { error: error.message };
  }
}

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: '用户不存在' });
    if (user.banned) return res.status(403).json({ error: '账号已被封禁' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: '登录已失效' });
  }
}

function admin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: '无权限' });
  next();
}

/* ---------- Auth ---------- */
app.post('/api/auth/register', (req, res) => {
  const { email, password, nickname } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: '邮箱格式不正确' });
  if (!password || password.length < 6) return res.status(400).json({ error: '密码至少 6 位' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: '该邮箱已注册' });
  const info = db.prepare('INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)').run(
    email,
    bcrypt.hashSync(password, 10),
    nickname || email.split('@')[0]
  );
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.json({ token: sign(user), user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }
  if (user.banned) return res.status(403).json({ error: '账号已被封禁' });
  res.json({ token: sign(user), user: publicUser(user) });
});

app.get('/api/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

/* ---------- Profile ---------- */
app.put('/api/profile', auth, (req, res) => {
  const { nickname } = req.body || {};
  db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(
    typeof nickname === 'string' && nickname.trim() ? nickname.trim() : req.user.nickname,
    req.user.id
  );
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

app.post('/api/profile/avatar', auth, (req, res) => {
  const dataUrl = (req.body || {}).dataUrl;
  const m = /^data:(.+?);base64,(.*)$/.exec(dataUrl || '');
  if (!m) return res.status(400).json({ error: '图片数据无效' });
  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length > 2 * 1024 * 1024) return res.status(400).json({ error: '图片不能超过 2MB' });
  const ext = (m[1].split('/')[1] || 'png').replace('jpeg', 'jpg');
  const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  const url = `/uploads/${filename}`;
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(url, req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

app.put('/api/profile/password', auth, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!bcrypt.compareSync(oldPassword || '', req.user.password_hash)) return res.status(400).json({ error: '原密码错误' });
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: '新密码至少 6 位' });
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ ok: true });
});

/* ---------- Public Strengths ---------- */
app.get('/api/strengths', (req, res) => {
  const rows = db.prepare('SELECT * FROM strengths ORDER BY sort_order ASC, id ASC').all();
  res.json({ strengths: rows.map(strengthDto) });
});

/* ---------- Public Site Content ---------- */
app.get('/api/content/site', (req, res) => {
  const row = getSiteContentRow();
  if (!row) return res.status(404).json({ error: '站点内容不存在' });
  res.json({ content: siteContentDto(row) });
});

/* ---------- Public Projects ---------- */
app.get('/api/projects', (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, id ASC').all();
  res.json({ projects: rows.map(projectDto) });
});

app.get('/api/projects/:projectId', (req, res) => {
  const row = getProjectRow(req.params.projectId);
  if (!row) return res.status(404).json({ error: '项目不存在' });
  res.json({ project: projectDto(row) });
});

/* ---------- Comments ---------- */
app.get('/api/guestbook-comments', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, u.avatar AS user_avatar
    FROM guestbook_comments AS c
    LEFT JOIN users AS u ON u.id = c.user_id
    ORDER BY c.created_at ASC, c.id ASC
  `).all();
  res.json({ comments: rows.map(publicGuestbookComment) });
});

app.post('/api/guestbook-comments', auth, (req, res) => {
  const normalized = normalizeCommentInput(req.body || {});
  if (normalized.error) return res.status(400).json({ error: normalized.error });

  let rootId = null;
  if (normalized.parent_id !== null) {
    const parent = db.prepare(
      'SELECT id, root_id FROM guestbook_comments WHERE id = ?'
    ).get(normalized.parent_id);
    if (!parent) return res.status(400).json({ error: '回复的留言不存在' });
    rootId = parent.root_id ?? parent.id;
  }

  const nickname = req.user.nickname || req.user.email.split('@')[0];
  const comment = insertComment({
    table: 'guestbook_comments',
    columns: ['nickname', 'email', 'content', 'user_id', 'parent_id'],
    values: [nickname, req.user.email, normalized.content, req.user.id, normalized.parent_id],
    rootId,
  });
  comment.user_avatar = req.user.avatar;

  res.status(201).json({ comment: publicGuestbookComment(comment) });
});

app.get('/api/projects/:projectId/comments', (req, res) => {
  if (!projectExists(req.params.projectId)) return res.status(404).json({ error: '项目不存在' });
  const rows = db.prepare(
    `SELECT c.*, u.avatar AS user_avatar
     FROM project_comments AS c
     LEFT JOIN users AS u ON u.id = c.user_id
     WHERE c.project_id = ?
     ORDER BY c.created_at ASC, c.id ASC`
  ).all(req.params.projectId);
  res.json({ comments: rows.map(publicProjectComment) });
});

app.post('/api/projects/:projectId/comments', auth, (req, res) => {
  if (!projectExists(req.params.projectId)) return res.status(404).json({ error: '项目不存在' });

  const normalized = normalizeCommentInput(req.body || {});
  if (normalized.error) return res.status(400).json({ error: normalized.error });

  let rootId = null;
  if (normalized.parent_id !== null) {
    const parent = db.prepare(
      'SELECT id, root_id FROM project_comments WHERE id = ? AND project_id = ?'
    ).get(normalized.parent_id, req.params.projectId);
    if (!parent) return res.status(400).json({ error: '回复的评论不存在' });
    rootId = parent.root_id ?? parent.id;
  }

  const nickname = req.user.nickname || req.user.email.split('@')[0];
  const comment = insertComment({
    table: 'project_comments',
    columns: ['project_id', 'nickname', 'email', 'content', 'user_id', 'parent_id'],
    values: [
      req.params.projectId,
      nickname,
      req.user.email,
      normalized.content,
      req.user.id,
      normalized.parent_id,
    ],
    rootId,
  });
  comment.user_avatar = req.user.avatar;

  res.status(201).json({ comment: publicProjectComment(comment) });
});

/* ---------- Admin ---------- */
app.get('/api/admin/comments', auth, admin, (req, res) => {
  const guestbook = db.prepare('SELECT * FROM guestbook_comments ORDER BY created_at DESC').all();
  const project = db.prepare('SELECT * FROM project_comments ORDER BY created_at DESC').all();
  const comments = [
    ...guestbook.map(adminGuestbookComment),
    ...project.map(adminProjectComment),
  ].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  res.json({ comments });
});

app.delete('/api/admin/guestbook-comments/:id', auth, admin, (req, res) => {
  db.prepare(`
    WITH RECURSIVE comment_tree(id) AS (
      SELECT id FROM guestbook_comments WHERE id = ?
      UNION ALL
      SELECT c.id FROM guestbook_comments AS c
      JOIN comment_tree AS t ON c.parent_id = t.id
    )
    DELETE FROM guestbook_comments WHERE id IN (SELECT id FROM comment_tree)
  `).run(req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/project-comments/:id', auth, admin, (req, res) => {
  db.prepare(`
    WITH RECURSIVE comment_tree(id) AS (
      SELECT id FROM project_comments WHERE id = ?
      UNION ALL
      SELECT c.id FROM project_comments AS c
      JOIN comment_tree AS t ON c.parent_id = t.id
    )
    DELETE FROM project_comments WHERE id IN (SELECT id FROM comment_tree)
  `).run(req.params.id);
  res.json({ ok: true });
});

/* ---------- Admin Projects ---------- */
app.get('/api/admin/projects', auth, admin, (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, id ASC').all();
  res.json({ projects: rows.map(projectDto) });
});

app.post('/api/admin/projects', auth, admin, (req, res) => {
  const maxRow = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM projects').get();
  const normalized = normalizeProjectInput(req.body || {}, { sort_order: maxRow.max_order + 1 });
  if (normalized.error) return res.status(400).json({ error: normalized.error });
  if (getProjectRow(normalized.id)) return res.status(409).json({ error: '该项目 ID 已存在' });

  db.prepare(`
    INSERT INTO projects (
      id,
      sort_order,
      name,
      en,
      tagline,
      desc,
      long_desc,
      video,
      cover,
      link,
      link_label,
      tech_json,
      points_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
    JSON.stringify(normalized.points)
  );

  res.status(201).json({ project: projectDto(getProjectRow(normalized.id)) });
});

app.put('/api/admin/projects/:id', auth, admin, (req, res) => {
  const existing = getProjectRow(req.params.id);
  if (!existing) return res.status(404).json({ error: '项目不存在' });
  const normalized = normalizeProjectInput({ ...(req.body || {}), id: existing.id }, existing);
  if (normalized.error) return res.status(400).json({ error: normalized.error });

  db.prepare(`
    UPDATE projects SET
      sort_order = ?,
      name = ?,
      en = ?,
      tagline = ?,
      desc = ?,
      long_desc = ?,
      video = ?,
      cover = ?,
      link = ?,
      link_label = ?,
      tech_json = ?,
      points_json = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
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
    existing.id
  );

  res.json({ project: projectDto(getProjectRow(existing.id)) });
});

app.delete('/api/admin/projects/:id', auth, admin, (req, res) => {
  const existing = getProjectRow(req.params.id);
  if (!existing) return res.status(404).json({ error: '项目不存在' });

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('DELETE FROM project_comments WHERE project_id = ?').run(existing.id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(existing.id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  res.json({ ok: true });
});

app.post('/api/admin/projects/:id/cover', auth, admin, uploadProjectCover, (req, res) => {
  const row = getProjectRow(req.params.id);
  if (!row) {
    fs.unlink(req.file?.path, () => {});
    return res.status(404).json({ error: '项目不存在' });
  }
  if (!req.file) return res.status(400).json({ error: '未上传封面' });
  const url = `/uploads/projects/covers/${req.file.filename}`;
  db.prepare("UPDATE projects SET cover = ?, updated_at = datetime('now') WHERE id = ?").run(url, row.id);
  res.json({ project: projectDto(getProjectRow(row.id)) });
});

app.post('/api/admin/projects/:id/video', auth, admin, uploadProjectVideo, (req, res) => {
  const row = getProjectRow(req.params.id);
  if (!row) {
    fs.unlink(req.file?.path, () => {});
    return res.status(404).json({ error: '项目不存在' });
  }
  if (!req.file) return res.status(400).json({ error: '未上传视频' });
  const url = `/uploads/projects/videos/${req.file.filename}`;
  db.prepare("UPDATE projects SET video = ?, updated_at = datetime('now') WHERE id = ?").run(url, row.id);
  res.json({ project: projectDto(getProjectRow(row.id)) });
});

/* ---------- Admin Strengths ---------- */
app.get('/api/admin/strengths', auth, admin, (req, res) => {
  const rows = db.prepare('SELECT * FROM strengths ORDER BY sort_order ASC, id ASC').all();
  res.json({ strengths: rows.map(strengthDto) });
});

app.post('/api/admin/strengths', auth, admin, (req, res) => {
  const maxRow = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM strengths').get();
  const normalized = normalizeStrengthInput(req.body || {}, { sort_order: maxRow.max_order + 1 });
  if (normalized.error) return res.status(400).json({ error: normalized.error });

  const info = db.prepare(`
    INSERT INTO strengths (sort_order, title, description)
    VALUES (?, ?, ?)
  `).run(normalized.sort_order, normalized.title, normalized.desc);

  res.status(201).json({ strength: strengthDto(getStrengthRow(info.lastInsertRowid)) });
});

app.put('/api/admin/strengths/:id', auth, admin, (req, res) => {
  const existing = getStrengthRow(req.params.id);
  if (!existing) return res.status(404).json({ error: '优势不存在' });
  const normalized = normalizeStrengthInput(req.body || {}, existing);
  if (normalized.error) return res.status(400).json({ error: normalized.error });

  db.prepare(`
    UPDATE strengths SET
      sort_order = ?,
      title = ?,
      description = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(normalized.sort_order, normalized.title, normalized.desc, existing.id);

  res.json({ strength: strengthDto(getStrengthRow(existing.id)) });
});

app.delete('/api/admin/strengths/:id', auth, admin, (req, res) => {
  const existing = getStrengthRow(req.params.id);
  if (!existing) return res.status(404).json({ error: '优势不存在' });
  db.prepare('DELETE FROM strengths WHERE id = ?').run(existing.id);
  res.json({ ok: true });
});

/* ---------- Admin Site Content ---------- */
app.get('/api/admin/content/site', auth, admin, (req, res) => {
  const row = getSiteContentRow();
  if (!row) return res.status(404).json({ error: '站点内容不存在' });
  res.json({ content: siteContentDto(row) });
});

app.put('/api/admin/content/site', auth, admin, (req, res) => {
  const row = getSiteContentRow();
  if (!row) return res.status(404).json({ error: '站点内容不存在' });

  const current = siteContentDto(row);
  const normalized = normalizeSiteContentInput(req.body || {}, current);
  if (normalized.error) return res.status(400).json({ error: normalized.error });

  db.prepare(`
    UPDATE site_content SET
      profile_json = ?,
      hero_json = ?,
      experience_json = ?,
      updated_at = datetime('now')
    WHERE id = 1
  `).run(
    JSON.stringify(normalized.profile),
    JSON.stringify(normalized.hero),
    JSON.stringify(normalized.experience)
  );

  res.json({ content: siteContentDto(getSiteContentRow()) });
});

app.get('/api/admin/users', auth, admin, (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all().map(publicUser);
  res.json({ users: rows });
});

app.patch('/api/admin/users/:id', auth, admin, (req, res) => {
  const { role, banned } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.id === req.user.id && banned) return res.status(400).json({ error: '不能封禁自己' });
  if (role) db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role === 'admin' ? 'admin' : 'user', user.id);
  if (banned !== undefined) db.prepare('UPDATE users SET banned = ? WHERE id = ?').run(banned ? 1 : 0, user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)) });
});

app.delete('/api/admin/users/:id', auth, admin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.id === req.user.id) return res.status(400).json({ error: '不能删除自己' });
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API 服务已启动: http://localhost:${PORT}`);
});
