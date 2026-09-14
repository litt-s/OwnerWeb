import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

function CommentAvatar({ comment }) {
  const [broken, setBroken] = useState(false);
  const fallback = (comment.nickname || '访')[0];

  if (!comment.avatar || broken) {
    return <div className="c-avatar">{fallback}</div>;
  }

  return (
    <div className="c-avatar">
      <img src={comment.avatar} alt="" onError={() => setBroken(true)} />
    </div>
  );
}

function CommentItem({
  comment,
  isReply,
  parentNickname,
  user,
  replyingTo,
  replyText,
  onReply,
  onReplyTextChange,
  onSubmitReply,
  busy,
}) {
  return (
    <div className="comment-item">
      <article className={isReply ? 'comment reply' : 'comment'}>
        <CommentAvatar comment={comment} />
        <div className="c-body">
          <div className="c-head">
            <b>{comment.nickname}</b>
            {isReply && parentNickname && (
              <span className="reply-to">
                回复 <em>@{parentNickname}</em>
              </span>
            )}
            <time dateTime={comment.created_at}>{comment.created_at}</time>
          </div>
          <p>{comment.content}</p>
          {user && (
            <button type="button" className="reply-btn" onClick={() => onReply(comment.id)}>
              回复
            </button>
          )}
        </div>
      </article>

      {replyingTo === comment.id && (
        <div className="reply-form">
          <textarea
            rows={2}
            required
            placeholder="回复内容…"
            value={replyText}
            onChange={(event) => onReplyTextChange(event.target.value)}
          />
          <div className="reply-actions">
            <button type="button" className="submit" onClick={() => onSubmitReply(comment.id)} disabled={busy}>
              {busy ? '发布中…' : '发布回复'}
            </button>
            <button type="button" className="cancel-btn" onClick={() => onReply(null)}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommentThread({
  endpoint,
  emptyText = '还没有留言，来抢沙发～',
  submitLabel = '提交留言',
}) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api(endpoint)
      .then((data) => setComments(data.comments))
      .catch((error) => setErr(error.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    setErr('');
    setLoading(true);
    load();
  }, [endpoint]);

  const byId = new Map(comments.map((c) => [c.id, c]));
  const topLevel = comments.filter((c) => !c.parent_id);
  // 某条顶层评论下的全部回复（任意层级），扁平化到同一缩进层级
  const repliesOf = (rootId) => comments.filter((c) => c.parent_id && c.root_id === rootId);

  const submit = async (event) => {
    event.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api(endpoint, { method: 'POST', token, body: { content } });
      setContent('');
      load();
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReply = async (parentId) => {
    if (!replyText.trim()) {
      setErr('回复内容必填');
      return;
    }
    setErr('');
    setBusy(true);
    try {
      await api(endpoint, { method: 'POST', token, body: { content: replyText, parent_id: parentId } });
      setReplyText('');
      setReplyingTo(null);
      load();
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReply = (commentId) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyText('');
    setErr('');
  };

  const shared = {
    user,
    replyingTo,
    replyText,
    onReply: handleReply,
    onReplyTextChange: setReplyText,
    onSubmitReply: submitReply,
    busy,
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
            onChange={(event) => setContent(event.target.value)}
          />
          {err && <p className="form-err">{err}</p>}
          <button className="submit" type="submit" disabled={busy}>{busy ? '提交中…' : submitLabel}</button>
        </form>
      ) : (
        <div className="comment-form">
          <p className="form-err" style={{ opacity: 0.7 }}>登录后参与留言</p>
          <Link className="submit" to="/auth">去登录</Link>
        </div>
      )}

      <div className="comment-list">
        {loading && <p className="form-err" style={{ opacity: 0.7 }}>正在加载留言…</p>}
        {!loading && topLevel.length === 0 && (
          <p className="form-err" style={{ opacity: 0.7 }}>{emptyText}</p>
        )}
        {!loading && topLevel.map((root) => (
          <div className="comment-thread" key={root.id}>
            <CommentItem comment={root} isReply={false} parentNickname={null} {...shared} />
            {repliesOf(root.id).map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isReply
                parentNickname={byId.get(reply.parent_id)?.nickname}
                {...shared}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
