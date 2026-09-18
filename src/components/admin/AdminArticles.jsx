import { useEffect, useRef, useState } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import '@wangeditor/editor/dist/css/style.css';
import {
  fetchAdminArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadArticleImage,
} from '../../services/articles';

const emptyDraft = {
  id: '',
  slug: '',
  sort_order: 1,
  title: '',
  excerpt: '',
  cover: '',
  status: 'draft',
  content: '',
};

function toDraft(article) {
  return {
    id: article.id || '',
    slug: article.slug || article.id || '',
    sort_order: article.sort_order ?? 1,
    title: article.title || '',
    excerpt: article.excerpt || '',
    cover: article.cover || '',
    status: article.status || 'draft',
    content: article.content || '',
  };
}

export default function AdminArticles({ token }) {
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [articles, setArticles] = useState([]);
  const [draft, setDraft] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () => fetchAdminArticles(token).then(setArticles).catch((error) => setErr(error.message));

  useEffect(() => { load(); }, []);

  const openNew = () => {
    const nextOrder = articles.reduce((max, item) => Math.max(max, item.sort_order || 0), 0) + 1;
    setDraft({ ...emptyDraft, sort_order: nextOrder });
    setMsg('');
    setErr('');
  };

  const openEdit = (article) => {
    setDraft(toDraft(article));
    setMsg('');
    setErr('');
  };

  const toolbarConfig = {
    toolbarKeys: [
      'headerSelect', 'bold', 'italic', 'through', 'color', 'bgColor',
      'fontSize', 'blockquote', 'bulletedList', 'numberedList',
      'insertLink', 'uploadImage', 'codeBlock', 'divider', 'undo', 'redo',
    ],
  };
  const editorConfig = {
    placeholder: '开始写下你的工程记录…',
    MENU_CONF: {
      uploadImage: {
        customUpload: async (file, insertFn) => {
          if (!draft?.id) throw new Error('请先保存文章，再插入正文图片');
          const url = await uploadArticleImage(draft.id, file, token);
          insertFn(url, file.name, url);
        },
      },
    },
  };

  const save = async () => {
    if (!draft) return;
    setErr('');
    setMsg('');
    const payload = {
      id: draft.id || draft.slug,
      slug: draft.slug || draft.id,
      sort_order: Number(draft.sort_order) || 1,
      title: draft.title,
      excerpt: draft.excerpt,
      cover: draft.cover || null,
      status: draft.status,
      content: draft.content,
    };
    try {
      const exists = articles.some((article) => article.id === draft.id);
      const article = exists
        ? await updateArticle(draft.id, payload, token)
        : await createArticle(payload, token);
      await load();
      setDraft(toDraft(article));
      setMsg(draft.status === 'published' ? '文章已发布' : '草稿已保存');
    } catch (error) {
      setErr(error.message);
    }
  };

  const remove = async (article) => {
    try {
      await deleteArticle(article.id, token);
      setConfirmId(null);
      await load();
      setMsg('文章已删除');
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <div className="admin-content">
      {!draft ? (
        <>
          <div className="admin-toolbar">
            <h3>文章管理</h3>
            <button type="button" className="submit" onClick={openNew}>新增文章</button>
          </div>
          {err && <p className="form-err">{err}</p>}
          {msg && <p className="form-ok">{msg}</p>}
          <div className="admin-table article-table">
            <div className="row head"><span>文章</span><span>状态</span><span>排序</span><span>更新时间</span><span>操作</span></div>
            {articles.length === 0 && <div className="row"><span>暂无文章</span></div>}
            {articles.map((article) => (
              <div className="row" key={article.id}>
                <span><b>{article.title}</b><small className="muted">/{article.slug}</small></span>
                <span>{article.status === 'published' ? '已发布' : '草稿'}</span>
                <span>{article.sort_order}</span>
                <span>{article.updated_at || article.created_at}</span>
                <span className="acts">
                  <button type="button" className="act" onClick={() => openEdit(article)}>编辑</button>
                  <button type="button" className="act del2" onClick={() => setConfirmId(article.id)}>删除</button>
                </span>
                {confirmId === article.id && (
                  <div className="confirm-bar">
                    <span>确认删除“{article.title}”吗？</span>
                    <button type="button" className="submit danger" onClick={() => remove(article)}>确认删除</button>
                    <button type="button" className="cancel-btn" onClick={() => setConfirmId(null)}>取消</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="admin-editor article-editor">
          <div className="admin-toolbar">
            <h3>{draft.id ? '编辑文章' : '新增文章'}</h3>
            <div className="acts">
              <button type="button" className="cancel-btn" onClick={() => setDraft(null)}>返回列表</button>
              <button type="button" className="submit" onClick={save}>保存文章</button>
            </div>
          </div>
          {err && <p className="form-err">{err}</p>}
          {msg && <p className="form-ok">{msg}</p>}
          <div className="article-editor-grid">
            <div className="editor-block article-meta-editor">
              <h4>文章信息</h4>
              <label>标题</label>
              <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="文章标题" />
              <label>URL 标识</label>
              <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="例如 stm32-driver-notes" />
              <label>摘要</label>
              <textarea rows={4} value={draft.excerpt} onChange={(event) => setDraft((current) => ({ ...current, excerpt: event.target.value }))} />
              <div className="article-meta-fields">
                <div><label>排序</label><input type="number" min={1} value={draft.sort_order} onChange={(event) => setDraft((current) => ({ ...current, sort_order: event.target.value }))} /></div>
                <div><label>状态</label><select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}><option value="draft">草稿</option><option value="published">发布</option></select></div>
              </div>
              <label>封面地址</label>
              <input value={draft.cover} onChange={(event) => setDraft((current) => ({ ...current, cover: event.target.value }))} placeholder="可选图片 URL，或上传图片" />
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file || !draft.id) return;
                try {
                  const url = await uploadArticleImage(draft.id, file, token);
                  setDraft((current) => ({ ...current, cover: url }));
                  setMsg('封面已上传，请保存文章');
                } catch (error) { setErr(error.message); }
              }} />
            </div>
            <div className="editor-block article-writing-editor">
              <h4>正文编辑 · wangEditor</h4>
              <div className="article-rich-editor">
                <Toolbar editor={editor} defaultConfig={toolbarConfig} mode="default" />
                <Editor
                  value={draft.content}
                  defaultConfig={editorConfig}
                  onCreated={(instance) => { editorRef.current = instance; setEditor(instance); }}
                  onChange={(editor) => setDraft((current) => ({ ...current, content: editor.getHtml() }))}
                  mode="default"
                />
              </div>
              <p className="editor-note">支持 H1-H5、字号、图片、列表、引用和代码块；正文图片会上传到 Cloudflare KV。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
