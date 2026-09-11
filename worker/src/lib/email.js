// 注册邮箱校验：格式 + 常见拼写错误 + 一次性邮箱黑名单 + 域名 MX 记录

const EMAIL_RE =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

// 常见拼写错误域名 → 正确域名
const TYPO_DOMAINS = {
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'qq.con': 'qq.com',
  'qq.cm': 'qq.com',
  '163.con': '163.com',
  '126.con': '126.com',
  'outlook.con': 'outlook.com',
  'hotmail.con': 'hotmail.com',
  'yahoo.con': 'yahoo.com',
};

// 常见一次性 / 临时邮箱域名
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'tempr.email',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'getnada.com',
  'trashmail.com',
  'dispostable.com',
  'maildrop.cc',
  'fakeinbox.com',
  'mailnesia.com',
  'spam4.me',
  'discard.email',
  'mailcatch.com',
  'mytemp.email',
  'moakt.com',
  'emailondeck.com',
  'burnermail.io',
  'mail.tm',
  'mohmal.com',
  'tempinbox.com',
]);

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

// 同步格式校验：返回 { email, domain } 或 { error }
export function checkEmailFormat(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) return { error: '请输入邮箱' };
  if (email.length > 254) return { error: '邮箱过长' };
  const at = email.lastIndexOf('@');
  if (at <= 0 || at === email.length - 1) return { error: '邮箱格式不正确' };
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64) return { error: '邮箱格式不正确' };
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return { error: '邮箱格式不正确' };
  }
  if (!EMAIL_RE.test(email)) return { error: '邮箱格式不正确' };
  if (!/^[a-z]{2,}$/.test(domain.split('.').pop())) return { error: '邮箱格式不正确' };
  if (TYPO_DOMAINS[domain]) return { error: `邮箱域名可能有误，是否想输入 @${TYPO_DOMAINS[domain]}？` };
  if (DISPOSABLE_DOMAINS.has(domain)) return { error: '不支持使用一次性 / 临时邮箱注册' };
  return { email, domain };
}

async function queryDns(domain, type) {
  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
    { headers: { accept: 'application/dns-json' } }
  );
  if (!res.ok) throw new Error('dns-query-failed');
  return res.json();
}

// 异步域名校验：MX（兜底 A）存在才允许；DNS 查询异常时放行，避免临时故障挡住正常注册
export async function checkEmailDomain(domain) {
  try {
    const mx = await queryDns(domain, 'MX');
    if (mx.Status === 3) return { error: '邮箱域名不存在' };
    if (Array.isArray(mx.Answer) && mx.Answer.some((r) => r.type === 15)) return { ok: true };

    const a = await queryDns(domain, 'A');
    if (a.Status === 3) return { error: '邮箱域名不存在' };
    if (Array.isArray(a.Answer) && a.Answer.some((r) => r.type === 1)) return { ok: true };

    return { error: '该邮箱域名无法接收邮件' };
  } catch {
    return { ok: true };
  }
}
