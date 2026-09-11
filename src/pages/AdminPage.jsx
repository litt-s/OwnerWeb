import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/PageShell';
import { api } from '../api';
import AdminProjects from '../components/admin/AdminProjects';
import AdminStrengths from '../components/admin/AdminStrengths';
import AdminSiteContent from '../components/admin/AdminSiteContent';

export default function AdminPage() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState('comments');
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectsActive, setProjectsActive] = useState(false);
  const [strengthsActive, setStrengthsActive] = useState(false);
  const [contentActive, setContentActive] = useState(false);
  const [err, setErr] = useState('');

  const loadComments = () => api('/api/admin/comments', { token }).then((d) => setComments(d.comments)).catch((e) => setErr(e.message));
  const loadUsers = () => api('/api/admin/users', { token }).then((d) => setUsers(d.users)).catch((e) => setErr(e.message));

  useEffect(() => {
    setErr('');
    if (tab === 'comments') loadComments();
    else if (tab === 'users') loadUsers();
    else if (tab === 'projects') setProjectsActive(true);
    else if (tab === 'strengths') setStrengthsActive(true);
    else if (tab === 'content') setContentActive(true);
  }, [tab]);

  const delComment = async (comment) => {
    const endpoint = comment.scope === 'project'
      ? `/api/admin/project-comments/${comment.id}`
      : `/api/admin/guestbook-comments/${comment.id}`;
    try {
      await api(endpoint, { method: 'DELETE', token });
      loadComments();
    } catch (e) { setErr(e.message); }
  };
  const setUser = async (id, body) => { try { await api(`/api/admin/users/${id}`, { method: 'PATCH', body, token }); loadUsers(); } catch (e) { setErr(e.message); } };
  const delUser = async (id) => { try { await api(`/api/admin/users/${id}`, { method: 'DELETE', token }); loadUsers(); } catch (e) { setErr(e.message); } };

  if (!user || user.role !== 'admin') {
    return (
      <PageShell title="管理后台">
        <div className="container" style={{ padding: '40px 0 60px' }}>
          <p className="form-err">仅管理员可访问后台。</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="管理后台">
      <div className="container">
        <div className="tabs" style={{ maxWidth: 1080 }}>
          <button type="button" className={tab === 'content' ? 'on' : ''} onClick={() => setTab('content')}>内容管理</button>
          <button type="button" className={tab === 'comments' ? 'on' : ''} onClick={() => setTab('comments')}>评论管理</button>
          <button type="button" className={tab === 'projects' ? 'on' : ''} onClick={() => setTab('projects')}>项目管理</button>
          <button type="button" className={tab === 'strengths' ? 'on' : ''} onClick={() => setTab('strengths')}>优势管理</button>
          <button type="button" className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}>用户管理</button>
        </div>
        {err && <p className="form-err">{err}</p>}

        {tab === 'comments' && (
          <div className="admin-table">
            <div className="row head"><span>位置</span><span>昵称</span><span>时间</span><span>内容</span><span>操作</span></div>
            {comments.length === 0 && <div className="row"><span colSpan={5}>暂无评论</span></div>}
            {comments.map((c) => (
              <div className="row" key={`${c.scope}-${c.id}`}>
                <span>{c.location}</span>
                <span>{c.nickname}</span>
                <span>{c.created_at}</span>
                <span>{c.content}</span>
                <button className="del" onClick={() => delComment(c)}>删除</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="admin-table users">
            <div className="row head"><span>用户</span><span>昵称</span><span>注册时间</span><span>角色</span><span>操作</span></div>
            {users.map((u) => (
              <div className="row" key={u.id}>
                <span>{u.email}</span>
                <span>{u.nickname}</span>
                <span>{u.created_at}</span>
                <span>{u.banned ? '已封禁' : u.role === 'admin' ? '管理员' : '普通用户'}</span>
                <span className="acts">
                  {u.role !== 'admin' && <button className="act" onClick={() => setUser(u.id, { role: 'admin' })}>设为管理员</button>}
                  {u.role === 'admin' && <button className="act" onClick={() => setUser(u.id, { role: 'user' })}>设为普通</button>}
                  <button className="act" onClick={() => setUser(u.id, { banned: !u.banned })}>{u.banned ? '解封' : '封禁'}</button>
                  <button className="act del2" onClick={() => delUser(u.id)}>删除</button>
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'projects' && projectsActive && <AdminProjects token={token} />}
        {tab === 'strengths' && strengthsActive && <AdminStrengths token={token} />}
        {tab === 'content' && contentActive && <AdminSiteContent token={token} />}
      </div>
    </PageShell>
  );
}
