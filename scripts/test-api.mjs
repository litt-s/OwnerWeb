// 最小 API 冒烟测试：注册、登录、留言、管理员权限
// 用法：node scripts/test-api.mjs [BASE_URL]   默认 http://localhost:8787
//   也可设 API_BASE 环境变量；管理员账号从 .env.local 读取（ADMIN_EMAIL / ADMIN_PASSWORD）
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] || process.env.API_BASE || 'http://localhost:8787';

function readEnv() {
  const path = resolve(ROOT, '.env.local');
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i < 0) continue;
    env[s.slice(0, i).trim()] = s.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name} ${extra}`);
  }
}

async function req(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const env = readEnv();
const adminEmail = env.ADMIN_EMAIL;
const adminPassword = env.ADMIN_PASSWORD;
const stamp = Date.now();
const testEmail = `ownerweb-test-${stamp}@qq.com`;
const testPassword = 'test123456';

console.log(`API 冒烟测试 -> ${BASE}\n`);

// 公开接口
const health = await req('/api/health');
check('健康检查 /api/health', health.status === 200 && health.data.ok === true, JSON.stringify(health.data));

const site = await req('/api/content/site');
check('站点内容 /api/content/site', site.status === 200 && !!site.data.content?.profile);

const projects = await req('/api/projects');
check('项目列表 /api/projects', projects.status === 200 && Array.isArray(projects.data.projects));

// 注册 + 登录
const reg = await req('/api/auth/register', { method: 'POST', body: { email: testEmail, password: testPassword, nickname: '冒烟测试' } });
check('注册 /api/auth/register', reg.status === 200 && !!reg.data.token, JSON.stringify(reg.data));
const userToken = reg.data.token;

const me = await req('/api/auth/me', { token: userToken });
check('当前用户 /api/auth/me', me.status === 200 && me.data.user?.email === testEmail);

const login = await req('/api/auth/login', { method: 'POST', body: { email: testEmail, password: testPassword } });
check('登录 /api/auth/login', login.status === 200 && !!login.data.token);

// 留言
const comment = await req('/api/guestbook-comments', { method: 'POST', body: { content: `冒烟测试留言 ${stamp}` }, token: userToken });
check('提交留言 /api/guestbook-comments', comment.status === 201 && !!comment.data.comment?.id, JSON.stringify(comment.data));
const commentId = comment.data.comment?.id;

// 权限
const noAuth = await req('/api/admin/users');
check('未登录访问后台被拒 401', noAuth.status === 401, `status=${noAuth.status}`);

const notAdmin = await req('/api/admin/users', { token: userToken });
check('普通用户访问后台被拒 403', notAdmin.status === 403, `status=${notAdmin.status}`);

if (adminEmail && adminPassword) {
  const adminLogin = await req('/api/auth/login', { method: 'POST', body: { email: adminEmail, password: adminPassword } });
  check('管理员登录', adminLogin.status === 200 && adminLogin.data.user?.role === 'admin', JSON.stringify(adminLogin.data));
  const adminToken = adminLogin.data.token;

  if (adminToken) {
    const users = await req('/api/admin/users', { token: adminToken });
    check('管理员获取用户列表', users.status === 200 && Array.isArray(users.data.users));

    // 清理测试数据
    const testUser = (users.data.users || []).find((u) => u.email === testEmail);
    if (testUser) {
      const delUser = await req(`/api/admin/users/${testUser.id}`, { method: 'DELETE', token: adminToken });
      check('清理测试用户', delUser.status === 200);
    }
    if (commentId) {
      const delComment = await req(`/api/admin/guestbook-comments/${commentId}`, { method: 'DELETE', token: adminToken });
      check('清理测试留言', delComment.status === 200);
    }
  }
} else {
  console.log('  ! 跳过管理员测试：.env.local 未配置 ADMIN_EMAIL / ADMIN_PASSWORD');
}

console.log(`\n结果：通过 ${pass}，失败 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
