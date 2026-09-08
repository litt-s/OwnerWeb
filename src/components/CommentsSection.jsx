import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function CommentsSection({ topic = 'guestbook' }) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [err, setErr] = useState('');

  const load = () =>
    api('/api/comments')
      .then((d) => setComments(d.comments))
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const visible = comments.filter((c) =>
    topic === 'guestbook' ? c.topic == null || c.topic === 'guestbook' : c.topic === topic
  );
  const topLevel = visible.filter((c) => !c.parent_id);
  const repliesOf = (id) => visible.filter((c) => c.parent_id === id);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api('/api/comments', {
        method: 'POST',
        token,
        body: { content, topic },
      });
      setContent('');
      load();
    } catch (e) { setErr(e.message); }
  };

  const submitReply = async (id) => {
    setErr('');
    try {
      await api('/api/comments', {
        method: 'POST',
        token,
        body: { content: replyText, parent_id: id, topic },
      });
      setReplyText('');
      setReplyingTo(null);
      load();
    } catch (e) { setErr(e.message); }
  };

  return (
    <div className="comments">
      {user ? (
        <form className="comment-form" onSubmit={submit}>
          <textarea
            rows={3}
            required
            placeholder="说点什么…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {err && <p className="form-err">{err}</p>}
          <button className="submit">提交留言</button>
        </form>
      ) : (
        <div className="comment-form">
          <p className="form-err" style={{ opacity: 0.7 }}>登录后参与留言</p>
          <Link className="submit" to="/auth">去登录</Link>
        </div>
      )}

      <div className="comment-list">
        {topLevel.length === 0 && <p className="form-err" style={{ opacity: 0.7 }}>还没有留言，来抢沙发～</p>}
        {topLevel.map((c) => (
          <div className="comment-thread" key={c.id}>
            <div className="comment">
              <div className="c-avatar">{(c.nickname || '访')[0]}</div>
              <div className="c-body">
                <div className="c-head"><b>{c.nickname}</b><time>{c.created_at}</time></div>
                <p>{c.content}</p>
                {user && (
                  <button
                    className="reply-btn"
                    onClick={() => {
                      setReplyingTo(replyingTo === c.id ? null : c.id);
                      setErr('');
                    }}
                  >
                    回复
                  </button>
                )}
              </div>
            </div>

            {repliesOf(c.id).map((r) => (
              <div className="comment reply" key={r.id}>
                <div className="c-avatar">{(r.nickname || '访')[0]}</div>
                <div className="c-body">
                  <div className="c-head"><b>{r.nickname}</b><time>{r.created_at}</time></div>
                  <p>{r.content}</p>
                </div>
              </div>
            ))}

            {replyingTo === c.id && (
              <div className="reply-form">
                <textarea
                  rows={2}
                  required
                  placeholder="回复内容…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="reply-actions">
                  <button className="submit" onClick={() => submitReply(c.id)}>发布回复</button>
                  <button className="cancel-btn" onClick={() => setReplyingTo(null)}>取消</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
