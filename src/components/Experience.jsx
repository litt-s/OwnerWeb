import { lazy, Suspense, useEffect, useRef } from 'react';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { PhoneIcon, MailIcon, GitHubIcon, WeChatIcon, PinIcon } from './icons';
import { useContent } from '../context/ContentContext';

const Portrait3D = lazy(() => import('./Portrait3D'));

export default function Experience() {
  const { siteContent } = useContent();
  const { profile, experience } = siteContent;
  const mediaRef = useRef(null);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return undefined;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--par-x', (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
      el.style.setProperty('--par-y', (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
    };
    const onLeave = () => {
      el.style.setProperty('--par-x', '0');
      el.style.setProperty('--par-y', '0');
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);
  const contacts = [
    { icon: PhoneIcon, label: '电话', value: profile.phone, href: `tel:${profile.phoneRaw}` },
    { icon: MailIcon, label: '邮箱', value: profile.email, href: `mailto:${profile.email}` },
    { icon: WeChatIcon, label: '微信', value: profile.wechat, href: null },
    { icon: GitHubIcon, label: 'GitHub', value: `@${profile.github}`, href: profile.githubUrl },
    { icon: PinIcon, label: '所在地', value: profile.location, href: null },
  ];
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
              <div className="portrait-media" ref={mediaRef}>
                <div className="portrait-space" aria-hidden="true">
                  <span className="space-back" />
                  <span className="space-glow" />
                  <span className="space-wall space-wall-ceiling" />
                  <span className="space-wall space-wall-floor">
                    <span className="space-floor-shadow" />
                  </span>
                  <span className="space-wall space-wall-left" />
                  <span className="space-wall space-wall-right" />
                </div>
                <Suspense fallback={null}>
                  <Portrait3D />
                </Suspense>
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
                <span className="meta-value">{profile.certificate}</span>
              </div>
            </div>

            <ul className="contact-list">
              {contacts.map((c) => (
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
