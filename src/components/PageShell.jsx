import { Link } from 'react-router-dom';

export default function PageShell({ title, children }) {
  return (
    <main className="page">
      <div className="page-head container">
        <Link to="/" className="page-back">
          <span className="page-back-arrow">←</span>
          <span className="page-back-label">返回首页</span>
        </Link>
        <span className="page-title">{title}</span>
      </div>
      {children}
    </main>
  );
}
