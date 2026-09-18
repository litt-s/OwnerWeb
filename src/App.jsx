import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Strengths from './components/Strengths';
import PageShell from './components/PageShell';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import CommentsPage from './pages/CommentsPage';
import AdminPage from './pages/AdminPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import BlogPage from './pages/BlogPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import Footer from './components/Footer';
import ThinkingDots from './components/ThinkingDots';

function SiteAtmosphere() {
  const { pathname } = useLocation();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return null;
  return <ThinkingDots className="thinking-dots-global" />;
}

function Home() {
  const location = useLocation();
  useEffect(() => {
    if (location.state?.scrollTo) {
      requestAnimationFrame(() => {
        const target = document.querySelector(location.state.scrollTo);
        if (!target) return;

        const heading = target.querySelector('.section-head, .contact-title') || target;
        const nav = document.querySelector('.nav');
        const navBottom = nav?.getBoundingClientRect().bottom ?? 0;
        const gap = 16;
        const top = heading.getBoundingClientRect().top + window.scrollY - navBottom - gap;

        window.scrollTo({
          top: Math.max(0, top),
          behavior: 'smooth',
        });
      });
    }
  }, [location.state]);

  return (
    <>
      <Hero />
      <Experience />
      <Projects />
      <Strengths />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <div className="app-shell">
          <SiteAtmosphere />
          <div className="app-content">
            <Nav />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/experience" element={<PageShell title="个人经历"><Experience /></PageShell>} />
              <Route path="/projects" element={<PageShell title="精选项目"><Projects /></PageShell>} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:id" element={<ArticleDetailPage />} />
              <Route path="/strengths" element={<PageShell title="个人优势"><Strengths /></PageShell>} />
              <Route path="/comments" element={<CommentsPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/settings" element={<ProfilePage />} />
              <Route path="/profile" element={<Navigate to="/settings" replace />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </div>
        </div>
      </ContentProvider>
    </AuthProvider>
  );
}
