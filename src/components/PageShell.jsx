import { Link } from 'react-router-dom';

export default function PageShell({ title, children }) {
  return (
    <main className="page">
      <div className="page-head container">
        <Link to="/" className="page-back">
          <svg
            className="page-back-arrow"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 12H4.5" />
            <path d="M11 5.5 4.5 12l6.5 6.5" />
          </svg>
          <span className="page-back-label">返回首页</span>
        </Link>
        <span className="page-title">{title}</span>
      </div>
      {children}
    </main>
  );
}
