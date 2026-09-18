import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const ArrowUpRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

const buildIndex = (profile, projects, strengths) => {
  const safeProfile = profile || {};
  const index = [
    { label: safeProfile.name || '', sub: safeProfile.role || '', to: '/experience' },
    { label: safeProfile.role || '', sub: safeProfile.nameEn || '', to: '/experience' },
    { label: '个人经历', sub: 'About', to: '/experience' },
    { label: '精选项目', sub: 'Projects', to: '/projects' },
    { label: '个人优势', sub: 'Capabilities', to: '/strengths' },
    { label: '博客文章', sub: 'Blog', to: '/blog' },
  ];
  projects.forEach((p) => {
    index.push({ label: p.name, sub: p.tagline, to: '/projects' });
    (p.tech || []).forEach((t) => index.push({ label: t, sub: p.name, to: '/projects' }));
  });
  strengths.forEach((s) => {
    const description = s.desc || '';
    index.push({ label: s.title || '', sub: description.slice(0, 42) + '…', to: '/strengths' });
  });
  return index;
};

export default function Search() {
  const navigate = useNavigate();
  const content = useContent() || {};
  const { projects = [], strengths = [] } = content;
  const profile = content.siteContent?.profile || {};
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const index = useMemo(
    () => buildIndex(profile, projects, strengths),
    [profile, projects, strengths]
  );
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index.filter((item) => item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)).slice(0, 7);
  }, [index, query]);

  const select = (item) => {
    if (item.to === '/' && item.anchor) navigate('/', { state: { scrollTo: item.anchor } });
    else navigate(item.to);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="nav-search">
      <span className="search-icon">
        <SearchIcon />
      </span>
      <input
        className="search-input"
        type="text"
        placeholder="搜索姓名、项目、技能…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 140)}
        aria-label="站内搜索"
      />
      {open && results.length > 0 && (
        <div className="search-results">
          {results.map((r, i) => (
            <button
              key={`${r.label}-${i}`}
              className="search-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(r)}
            >
              <span className="search-item-text">
                <span className="search-item-label">{r.label}</span>
                <span className="search-item-sub">{r.sub}</span>
              </span>
              <span className="search-item-go">
                <ArrowUpRight />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
