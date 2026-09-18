import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Search from './Search';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from './icons';

export default function Nav() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" state={{ scrollTo: '#top' }} className="nav-brand">
          <span className="nav-mark"><BrandMark /></span>
          <span className="nav-brand-text">Li的个人博客</span>
        </Link>

        <nav className="nav-links">
          {user?.role === 'admin' && <Link to="/admin" className="nav-link">后台</Link>}
        </nav>

        <Search />

        <div className="nav-actions">
          {!loading && !user && <Link to="/auth" className="nav-cta ghost">登录 / 注册</Link>}
          {!loading && user && (
            <>
              <Link to="/settings" className="nav-cta ghost">{user.nickname || '账号设置'}</Link>
              <button className="nav-cta ghost" onClick={onLogout} type="button">退出</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
