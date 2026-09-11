// 通用工具、DTO 与输入校验（纯函数，无运行时依赖）
export const now = () => new Date().toISOString();

export const base64ToBytes = (b64) => Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));

export const extFromMime = (mime, fallback = '.png') => {
  const map = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
  };
  return map[mime] || fallback;
};

export function mediaUrl(origin, key) {
  if (!key) return null;
  if (/^https?:\/\//i.test(key) || key.startsWith('/')) return key;
  return `${origin}/media/${key}`;
}

export function publicUser(origin, u) {
  return {
    id: u.id,
    email: u.email,
    nickname: u.nickname,
    avatar: mediaUrl(origin, u.avatar),
    role: u.role,
    banned: !!u.banned,
    created_at: u.created_at,
  };
}

export const publicComment = (origin, c) => ({
  id: c.id,
  nickname: c.nickname,
  avatar: mediaUrl(origin, c.user_avatar ?? null),
  content: c.content,
  parent_id: c.parent_id,
  root_id: c.root_id,
  created_at: c.created_at,
});

export function projectDto(origin, row) {
  return {
    id: row.id,
    sort_order: row.sort_order,
    index: String(row.sort_order).padStart(2, '0'),
    name: row.name,
    en: row.en,
    tagline: row.tagline,
    desc: row.desc,
    longDesc: row.long_desc,
    video: mediaUrl(origin, row.video),
    cover: mediaUrl(origin, row.cover),
    link: row.link,
    linkLabel: row.link_label,
    tech: JSON.parse(row.tech_json || '[]'),
    points: JSON.parse(row.points_json || '[]'),
  };
}

export function strengthDto(row) {
  return {
    id: row.id,
    sort_order: row.sort_order,
    n: String(row.sort_order).padStart(2, '0'),
    title: row.title,
    desc: row.description,
  };
}

export const parseStoredObject = (value) => {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const siteContentDto = (row) => ({
  profile: parseStoredObject(row.profile_json),
  hero: parseStoredObject(row.hero_json),
  experience: parseStoredObject(row.experience_json),
});

export const textOrEmpty = (v) => (typeof v === 'string' ? v.trim() : '');

export const parseListValue = (value) => {
  if (Array.isArray(value)) return value.map((i) => String(i).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/\r?\n|,/).map((i) => i.trim()).filter(Boolean);
  return [];
};

export function normalizeCommentInput({ content, parent_id }) {
  const trimmed = typeof content === 'string' ? content.trim() : '';
  if (!trimmed) return { error: '内容必填' };
  if (trimmed.length > 500) return { error: '内容不能超过 500 字' };
  if (parent_id === undefined || parent_id === null) return { content: trimmed, parent_id: null };
  const parentId = Number(parent_id);
  if (!Number.isInteger(parentId) || parentId <= 0) return { error: '回复目标不正确' };
  return { content: trimmed, parent_id: parentId };
}

export function normalizeProjectInput(body, existing = {}) {
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
    sort_order: parsedSort,
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

export function normalizeStrengthInput(body, existing = {}) {
  const title = textOrEmpty(body.title ?? existing.title);
  const desc = textOrEmpty(body.desc ?? existing.description);
  if (!title) return { error: '优势标题必填' };
  if (title.length > 100) return { error: '优势标题不能超过 100 个字符' };
  if (!desc) return { error: '优势描述必填' };
  if (desc.length > 500) return { error: '优势描述不能超过 500 个字符' };
  const parsedSort = Number(body.sort_order ?? existing.sort_order);
  if (!Number.isInteger(parsedSort) || parsedSort < 1) return { error: '排序必须是不小于 1 的整数' };
  return { sort_order: parsedSort, title, desc };
}

export function textWithLimit(value, fallback, label, limit) {
  const text = typeof value === 'string' ? value.trim() : fallback ?? '';
  if (text.length > limit) throw new Error(`${label}不能超过 ${limit} 个字符`);
  return text;
}

export function normalizeSiteContentInput(body, current) {
  const p = body.profile ?? {};
  const h = body.hero ?? {};
  const e = body.experience ?? {};
  const cp = current.profile ?? {};
  const ch = current.hero ?? {};
  const ce = current.experience ?? {};
  try {
    const profile = {
      name: textWithLimit(p.name ?? cp.name, '', '姓名', 80),
      nameEn: textWithLimit(p.nameEn ?? cp.nameEn, '', '英文名', 100),
      role: textWithLimit(p.role ?? cp.role, '', '职业定位', 100),
      roleEn: textWithLimit(p.roleEn ?? cp.roleEn, '', '英文职业定位', 120),
      age: textWithLimit(p.age ?? cp.age, '', '年龄', 20),
      degree: textWithLimit(p.degree ?? cp.degree, '', '学历', 50),
      location: textWithLimit(p.location ?? cp.location, '', '所在地', 120),
      phone: textWithLimit(p.phone ?? cp.phone, '', '联系电话', 40),
      phoneRaw: textWithLimit(p.phoneRaw ?? cp.phoneRaw, '', '电话拨号号码', 40),
      email: textWithLimit(p.email ?? cp.email, '', '邮箱', 160),
      github: textWithLimit(p.github ?? cp.github, '', 'GitHub 用户名', 80),
      githubUrl: textWithLimit(p.githubUrl ?? cp.githubUrl, '', 'GitHub 地址', 300),
      wechat: textWithLimit(p.wechat ?? cp.wechat, '', '微信号', 80),
      focus: textWithLimit(p.focus ?? cp.focus, '', '技术方向', 160),
      certificate: textWithLimit(p.certificate ?? cp.certificate, '', '专业认证', 200),
      education: {
        school: textWithLimit(p.education?.school ?? cp.education?.school, '', '学校', 120),
        major: textWithLimit(p.education?.major ?? cp.education?.major, '', '专业', 160),
        period: textWithLimit(p.education?.period ?? cp.education?.period, '', '教育时间', 80),
      },
    };
    if (!profile.name) throw new Error('姓名必填');
    if (!profile.role) throw new Error('职业定位必填');
    if (!profile.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) throw new Error('联系邮箱格式不正确');
    if (!profile.phone) throw new Error('联系电话必填');
    if (!profile.phoneRaw) throw new Error('电话拨号号码必填');
    const hero = {
      eyebrow: textWithLimit(h.eyebrow ?? ch.eyebrow, '', 'Hero 标签', 120),
      statement: textWithLimit(h.statement ?? ch.statement, '', 'Hero 宣言', 160),
      headFirst: textWithLimit(h.headFirst ?? ch.headFirst, '', '主标题前段', 40),
      headSecond: textWithLimit(h.headSecond ?? ch.headSecond, '', '主标题后段', 40),
      sub: textWithLimit(h.sub ?? ch.sub, '', 'Hero 副标题', 300),
    };
    if (!hero.headFirst || !hero.headSecond || !hero.sub) throw new Error('Hero 主标题和副标题必填');
    const intro = textWithLimit(e.intro ?? ce.intro, '', '经历简介', 1200);
    if (!intro) throw new Error('经历简介必填');
    const statsSource = Array.isArray(e.stats) ? e.stats : Array.isArray(ce.stats) ? ce.stats : [];
    if (statsSource.length > 12) throw new Error('经历统计最多 12 条');
    const stats = statsSource.map((item) => ({
      value: textWithLimit(item?.value, '', '统计数值', 20),
      label: textWithLimit(item?.label, '', '统计标题', 80),
      sub: textWithLimit(item?.sub, '', '统计说明', 120),
    }));
    if (stats.some((item) => !item.value || !item.label)) throw new Error('经历统计的数值和标题必填');
    return { profile, hero, experience: { intro, stats } };
  } catch (error) {
    return { error: error.message };
  }
}
