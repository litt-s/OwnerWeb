import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  experience as seedExperience,
  hero as seedHero,
  profile as seedProfile,
  projects as seedProjects,
  strengths as seedStrengths,
} from '../src/data/resume.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, process.env.DB_DIR || 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'ownerweb.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
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
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES guestbook_comments(id) ON DELETE CASCADE,
    root_id INTEGER REFERENCES guestbook_comments(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    email TEXT,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES project_comments(id) ON DELETE CASCADE,
    root_id INTEGER REFERENCES project_comments(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_guestbook_parent_id ON guestbook_comments(parent_id);
  CREATE INDEX IF NOT EXISTS idx_project_project_id ON project_comments(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_parent_id ON project_comments(parent_id);

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
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function migrateLegacyComments() {
  const legacyTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'comments'"
  ).get();
  if (!legacyTable) return;

  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`
      INSERT INTO guestbook_comments (id, nickname, email, content, user_id, parent_id, created_at)
      SELECT
        c.id,
        c.nickname,
        c.email,
        c.content,
        CASE WHEN u.id IS NULL THEN NULL ELSE c.user_id END,
        c.parent_id,
        c.created_at
      FROM comments AS c
      LEFT JOIN users AS u ON u.id = c.user_id
      WHERE c.topic IS NULL OR c.topic = 'guestbook';
    `);

    db.exec(`
      INSERT INTO project_comments (id, project_id, nickname, email, content, user_id, parent_id, created_at)
      SELECT
        c.id,
        c.topic,
        c.nickname,
        c.email,
        c.content,
        CASE WHEN u.id IS NULL THEN NULL ELSE c.user_id END,
        c.parent_id,
        c.created_at
      FROM comments AS c
      LEFT JOIN users AS u ON u.id = c.user_id
      WHERE c.topic IS NOT NULL AND c.topic <> 'guestbook';
    `);

    db.exec('DROP TABLE comments');
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

migrateLegacyComments();
db.exec('DROP TABLE IF EXISTS comments_legacy');

function ensureRootIdColumn(table) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN root_id INTEGER REFERENCES ${table}(id) ON DELETE CASCADE`);
  } catch {}
}

function backfillRootIds(table) {
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`UPDATE ${table} SET root_id = id WHERE parent_id IS NULL AND root_id IS NULL`).run();

    let changed = 1;
    while (changed > 0) {
      changed = db.prepare(`
        UPDATE ${table}
        SET root_id = (
          SELECT p.root_id FROM ${table} AS p WHERE p.id = ${table}.parent_id
        )
        WHERE root_id IS NULL
          AND parent_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM ${table} AS p
            WHERE p.id = ${table}.parent_id AND p.root_id IS NOT NULL
          )
      `).run().changes;
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function seedProjectsTable() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO projects (
      id,
      sort_order,
      name,
      en,
      tagline,
      desc,
      long_desc,
      video,
      link,
      link_label,
      tech_json,
      points_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN IMMEDIATE');
  try {
    seedProjects.forEach((project, index) => {
      insert.run(
        project.id,
        index + 1,
        project.name,
        project.en,
        project.tagline,
        project.desc,
        project.longDesc,
        project.video,
        project.link,
        project.linkLabel,
        JSON.stringify(project.tech),
        JSON.stringify(project.points)
      );
    });
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function seedStrengthsTable() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM strengths').get().count;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO strengths (sort_order, title, description)
    VALUES (?, ?, ?)
  `);

  db.exec('BEGIN IMMEDIATE');
  try {
    seedStrengths.forEach((strength, index) => {
      insert.run(index + 1, strength.title, strength.desc);
    });
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function seedSiteContent() {
  const exists = db.prepare('SELECT id FROM site_content WHERE id = 1').get();
  if (exists) return;

  const profile = {
    ...seedProfile,
    certificate: '华为 HCIP 设备高级开发工程师',
  };
  const insert = db.prepare(`
    INSERT INTO site_content (id, profile_json, hero_json, experience_json)
    VALUES (1, ?, ?, ?)
  `);

  db.exec('BEGIN IMMEDIATE');
  try {
    insert.run(
      JSON.stringify(profile),
      JSON.stringify(seedHero),
      JSON.stringify(seedExperience)
    );
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

ensureRootIdColumn('guestbook_comments');
ensureRootIdColumn('project_comments');
backfillRootIds('guestbook_comments');
backfillRootIds('project_comments');
seedProjectsTable();
seedStrengthsTable();
seedSiteContent();

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_guestbook_root_id ON guestbook_comments(root_id);
  CREATE INDEX IF NOT EXISTS idx_project_root_id ON project_comments(root_id);
`);

function seed() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPass) return;

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!exists) {
    db.prepare(
      'INSERT INTO users (email, password_hash, nickname, role) VALUES (?, ?, ?, ?)'
    ).run(adminEmail, bcrypt.hashSync(adminPass, 10), '李浩然', 'admin');
    console.log(`[seed] 管理员已创建: ${adminEmail}`);
  }
}
seed();

export default db;
