import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { PhoneIcon, MailIcon, GitHubIcon, WeChatIcon, PinIcon } from './icons';
import { profile, experience } from '../data/resume';

const CONTACTS = [
  { icon: PhoneIcon, label: '电话', value: profile.phone, href: `tel:${profile.phoneRaw}` },
  { icon: MailIcon, label: '邮箱', value: profile.email, href: `mailto:${profile.email}` },
  { icon: WeChatIcon, label: '微信', value: profile.wechat, href: null },
  { icon: GitHubIcon, label: 'GitHub', value: `@${profile.github}`, href: profile.githubUrl },
  { icon: PinIcon, label: '所在地', value: profile.location, href: null },
];

export default function Experience() {
  return (
    <section id="experience" className="section exp">
      <div className="container">
        <SectionHeading
          index="01"
          eyebrow="About · 个人介绍"
          title="把复杂硬件，讲成能跑的代码"
          sub="嵌入式软件工程师 · 2023 级软件工程（华为产业学院）"
        />

        <div className="exp-grid">
          <Reveal className="exp-left">
            <div className="portrait-card">
              <div className="portrait-media">
                <img src="/portrait.svg" alt={profile.name} />
              </div>
              <div className="portrait-meta">
                <span className="portrait-name">{profile.name}</span>
                <span className="portrait-role">{profile.role}</span>
              </div>
              <div className="portrait-tag">{profile.focus}</div>
            </div>
          </Reveal>

          <Reveal className="exp-right" delay={140}>
            <p className="exp-intro">{experience.intro}</p>

            <div className="exp-meta">
              <div className="exp-edu">
                <span className="meta-label">教育背景</span>
                <span className="meta-value">
                  {profile.education.school} · {profile.education.major}
                </span>
                <span className="meta-sub">{profile.education.period}</span>
              </div>
              <div className="exp-cert">
                <span className="meta-label">专业认证</span>
                <span className="meta-value">华为 HCIP 设备高级开发工程师</span>
              </div>
            </div>

            <ul className="contact-list">
              {CONTACTS.map((c) => (
                <li key={c.label}>
                  <span className="cl-icon">
                    <c.icon />
                  </span>
                  <span className="cl-label">{c.label}</span>
                  {c.href ? (
                    <a className="cl-value" href={c.href}>
                      {c.value}
                    </a>
                  ) : (
                    <span className="cl-value">{c.value}</span>
                  )}
                </li>
              ))}
            </ul>

            <div className="exp-stats">
              {experience.stats.map((s) => (
                <div className="stat" key={s.label}>
                  <span className="stat-v">{s.value}</span>
                  <span className="stat-l">{s.label}</span>
                  <span className="stat-s">{s.sub}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
