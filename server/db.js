import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'ownerweb.db'));
db.exec('PRAGMA journal_mode = WAL;');

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
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    email TEXT,
    content TEXT NOT NULL,
    user_id INTEGER,
    parent_id INTEGER,
    topic TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

try { db.exec('ALTER TABLE comments ADD COLUMN parent_id INTEGER'); } catch {}
try { db.exec('ALTER TABLE comments ADD COLUMN topic TEXT'); } catch {}

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
