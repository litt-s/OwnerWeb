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

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET. Copy server/.env.example to server/.env and set a strong random value.');
}

const app = express();
app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  nickname: u.nickname,
  avatar: u.avatar,
  bio: u.bio,
  role: u.role,
  banned: !!u.banned,
  created_at: u.created_at,
});

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
  const { nickname, bio } = req.body || {};
  db.prepare('UPDATE users SET nickname = ?, bio = ? WHERE id = ?').run(nickname ?? null, bio ?? null, req.user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

app.post('/api/profile/avatar', auth, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未上传文件' });
  const url = `/uploads/${req.file.filename}`;
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

/* ---------- Comments ---------- */
app.get('/api/comments', (req, res) => {
  const rows = db.prepare('SELECT * FROM comments ORDER BY created_at ASC').all();
  res.json({ comments: rows });
});

app.post('/api/comments', auth, (req, res) => {
  const { content, parent_id, topic } = req.body || {};
  if (!content || !content.trim()) return res.status(400).json({ error: '内容必填' });
  const nickname = req.user.nickname || req.user.email.split('@')[0];
  const info = db.prepare(
    'INSERT INTO comments (nickname, email, content, user_id, parent_id, topic) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    nickname,
    req.user.email,
    content.trim(),
    req.user.id,
    parent_id || null,
    topic || null
  );
  res.json({ comment: db.prepare('SELECT * FROM comments WHERE id = ?').get(info.lastInsertRowid) });
});

/* ---------- Admin ---------- */
app.delete('/api/admin/comments/:id', auth, admin, (req, res) => {
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
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
