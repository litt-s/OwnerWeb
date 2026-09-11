import {
  profile as seedProfile,
  hero as seedHero,
  experience as seedExperience,
  projects as seedProjects,
  strengths as seedStrengths,
} from '../../../src/data/resume.js';
import { hashPassword } from '../password.js';

let seeded = false;

// 首次运行：播种站点内容、项目、优势，并创建管理员
export async function ensureSeed(env) {
  if (seeded) return;

  const sc = await env.DB.prepare('SELECT id FROM site_content WHERE id = 1').first();
  if (!sc) {
    const profile = { ...seedProfile, certificate: '华为 HCIP 设备高级开发工程师' };
    await env.DB.prepare(
      'INSERT INTO site_content (id, profile_json, hero_json, experience_json) VALUES (1, ?, ?, ?)'
    )
      .bind(JSON.stringify(profile), JSON.stringify(seedHero), JSON.stringify(seedExperience))
      .run();
  }

  const pc = await env.DB.prepare('SELECT COUNT(*) AS c FROM projects').first();
  if (!pc || pc.c === 0) {
    for (let i = 0; i < seedProjects.length; i++) {
      const p = seedProjects[i];
      await env.DB.prepare(
        `INSERT INTO projects (id, sort_order, name, en, tagline, desc, long_desc, video, cover, link, link_label, tech_json, points_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          p.id,
          i + 1,
          p.name,
          p.en,
          p.tagline,
          p.desc,
          p.longDesc,
          p.video,
          null,
          p.link,
          p.linkLabel,
          JSON.stringify(p.tech),
          JSON.stringify(p.points)
        )
        .run();
    }
  }

  const stc = await env.DB.prepare('SELECT COUNT(*) AS c FROM strengths').first();
  if (!stc || stc.c === 0) {
    for (let i = 0; i < seedStrengths.length; i++) {
      const s = seedStrengths[i];
      await env.DB.prepare('INSERT INTO strengths (sort_order, title, description) VALUES (?, ?, ?)')
        .bind(i + 1, s.title, s.desc)
        .run();
    }
  }

  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const admin = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(env.ADMIN_EMAIL).first();
    if (!admin) {
      await env.DB.prepare('INSERT INTO users (email, password_hash, nickname, role) VALUES (?, ?, ?, ?)')
        .bind(env.ADMIN_EMAIL, await hashPassword(env.ADMIN_PASSWORD), '李浩然', 'admin')
        .run();
    }
  }

  seeded = true;
}
