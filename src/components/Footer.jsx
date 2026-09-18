import { useContent } from '../context/ContentContext';

export default function Footer() {
  const { siteContent } = useContent();
  const { profile } = siteContent;

  return (
    <footer className="footer">
      <span className="footer-left">
        © 2026 {profile.name} · {profile.role}
      </span>
      <span className="footer-mid">{profile.focus}</span>
      <a href="#top" className="footer-top">
        回到顶部 ↑
      </a>
    </footer>
  );
}
