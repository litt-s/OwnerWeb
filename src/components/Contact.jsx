import Reveal from './Reveal';
import ThinkingDots from './ThinkingDots';
import ScrambleText from './ScrambleText';
import { ArrowUpRight } from './icons';
import { useContent } from '../context/ContentContext';

export default function Contact() {
  const { siteContent } = useContent();
  const { profile } = siteContent;
  const channels = [
    { label: '邮箱', value: profile.email, href: `mailto:${profile.email}` },
    { label: '电话', value: profile.phone, href: `tel:${profile.phoneRaw}` },
    { label: '微信', value: profile.wechat, href: null },
    { label: 'GitHub', value: `@${profile.github}`, href: profile.githubUrl },
  ];
  return (
    <section id="contact" className="contact">
      <ThinkingDots />
      <div className="container contact-inner">
        <Reveal>
          <div className="contact-eyebrow">
            <span className="head-index">04</span>
            <span className="head-rule" />
            <span>Contact · 联系我</span>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <h2 className="contact-title">
            <ScrambleText text={'有项目\n想一起落地？'} />
          </h2>
        </Reveal>

        <Reveal delay={180}>
          <a className="contact-mail" href={`mailto:${profile.email}`}>
            {profile.email}
            <ArrowUpRight size={26} />
          </a>
        </Reveal>

        <Reveal delay={260}>
          <div className="contact-channels">
            {channels.map((c) =>
              c.href ? (
                <a key={c.label} href={c.href} className="channel" target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  <span className="channel-label">{c.label}</span>
                  <span className="channel-value">{c.value}</span>
                </a>
              ) : (
                <span key={c.label} className="channel">
                  <span className="channel-label">{c.label}</span>
                  <span className="channel-value">{c.value}</span>
                </span>
              )
            )}
            <span className="channel">
              <span className="channel-label">所在地</span>
              <span className="channel-value">{profile.location}</span>
            </span>
          </div>
        </Reveal>
      </div>

      <footer className="footer">
        <span className="footer-left">
          © 2026 {profile.name} · {profile.role}
        </span>
        <span className="footer-mid">{profile.focus}</span>
        <a href="#top" className="footer-top">
          回到顶部 ↑
        </a>
      </footer>
    </section>
  );
}
