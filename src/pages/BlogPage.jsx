import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import { fetchPublicArticles } from '../services/articles';

export default function BlogPage() {
  const [articles, setArticles] = useState([]);
  const [state, setState] = useState({ loading: true, error: '' });

  useEffect(() => {
    let active = true;
    fetchPublicArticles()
      .then((items) => active && setArticles(items))
      .catch((error) => active && setState({ loading: false, error: error.message || '文章加载失败' }))
      .finally(() => active && setState((current) => ({ ...current, loading: false })));
    return () => { active = false; };
  }, []);

  return (
    <PageShell title="博客文章">
      <main className="blog-page">
        <section className="section blog-list">
          <div className="container">
            <SectionHeading index="05" eyebrow="Field Notes · 博客文章" title="记录硬件与系统的真实运行轨迹" sub="从驱动、协议栈到物联网系统，整理每一次调试、设计和落地。" />
            {state.loading && <p className="blog-status">正在加载文章…</p>}
            {state.error && <p className="form-err blog-status">{state.error}</p>}
            {!state.loading && !state.error && articles.length === 0 && <p className="blog-status">暂时还没有已发布的文章。</p>}
            <div className="blog-grid">
              {articles.map((article, index) => (
                <Reveal className="blog-card" key={article.id} delay={(index % 3) * 80}>
                  {article.cover && <img src={article.cover} alt="" className="blog-card-cover" />}
                  <div className="blog-card-body">
                    <span className="blog-card-meta">{article.published_at?.slice(0, 10) || 'DRAFT'}</span>
                    <h2>{article.title}</h2>
                    <p>{article.excerpt || '打开文章，查看完整内容。'}</p>
                    <Link className="blog-card-link" to={`/blog/${article.id}`}>阅读文章 ↗</Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
