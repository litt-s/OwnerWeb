import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import ArticleHtml from '../components/ArticleHtml';
import { fetchPublicArticle } from '../services/articles';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [state, setState] = useState({ loading: true, error: '' });

  useEffect(() => {
    let active = true;
    fetchPublicArticle(id)
      .then((item) => active && setArticle(item))
      .catch((error) => active && setState({ loading: false, error: error.message || '文章加载失败' }))
      .finally(() => active && setState((current) => ({ ...current, loading: false })));
    return () => { active = false; };
  }, [id]);

  return (
    <PageShell title={article?.title || '文章详情'}>
      <main className="article-page container">
        {state.loading && <p className="blog-status">正在加载文章…</p>}
        {state.error && <p className="form-err blog-status">{state.error}</p>}
        {!state.loading && !state.error && article && (
          <article className="article-detail">
            <header className="article-header">
              <span className="blog-card-meta">{article.published_at?.slice(0, 10)}</span>
              <h1>{article.title}</h1>
              {article.excerpt && <p>{article.excerpt}</p>}
            </header>
            {article.cover && <img className="article-cover" src={article.cover} alt="" />}
            <ArticleHtml content={article.content} className="article-content" />
            <div className="article-comments-placeholder">文章评论即将开放。</div>
            <Link to="/blog" className="back" style={{ display: 'inline-block' }}>← 返回博客文章</Link>
          </article>
        )}
      </main>
    </PageShell>
  );
}
