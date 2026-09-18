-- OwnerWeb D1 数据库结构（与本地 SQLite 对齐）
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT,
  avatar TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  banned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS guestbook_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  email TEXT,
  content TEXT NOT NULL,
  user_id INTEGER,
  parent_id INTEGER,
  root_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_guestbook_parent_id ON guestbook_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_root_id ON guestbook_comments(root_id);

CREATE TABLE IF NOT EXISTS project_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT,
  content TEXT NOT NULL,
  user_id INTEGER,
  parent_id INTEGER,
  root_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_project_project_id ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_parent_id ON project_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_project_root_id ON project_comments(root_id);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  en TEXT,
  tagline TEXT,
  desc TEXT,
  long_desc TEXT,
  video TEXT,
  cover TEXT,
  link TEXT,
  link_label TEXT,
  tech_json TEXT NOT NULL DEFAULT '[]',
  points_json TEXT NOT NULL DEFAULT '[]',
  requires_login INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

CREATE TABLE IF NOT EXISTS strengths (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_strengths_sort_order ON strengths(sort_order);

CREATE TABLE IF NOT EXISTS site_content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  profile_json TEXT NOT NULL,
  hero_json TEXT NOT NULL,
  experience_json TEXT NOT NULL,
  contact_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  cover TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_articles_status_order ON articles(status, sort_order, id);
