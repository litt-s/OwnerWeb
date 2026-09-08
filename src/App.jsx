import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Contact from './components/Contact';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Strengths from './components/Strengths';
import PageShell from './components/PageShell';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import CommentsPage from './pages/CommentsPage';
import AdminPage from './pages/AdminPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

function Home() {
  const location = useLocation();
  useEffect(() => {
    if (location.state?.scrollTo) {
      requestAnimationFrame(() =>
        document.querySelector(location.state.scrollTo)?.scrollIntoView({ behavior: 'smooth' })
      );
    }
  }, [location.state]);

  return (
    <>
      <Hero />
      <Experience />
      <Projects />
      <Strengths />
      <Contact />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/experience" element={<PageShell title="个人经历"><Experience /></PageShell>} />
        <Route path="/projects" element={<PageShell title="精选项目"><Projects /></PageShell>} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/strengths" element={<PageShell title="个人优势"><Strengths /></PageShell>} />
        <Route path="/comments" element={<CommentsPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </AuthProvider>
  );
}
