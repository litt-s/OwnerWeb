import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const PAGE_SIZE = 10;

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
            <button type="button" className="reply-btn" onClick={() => onReply(comment.id, comment.root_id || comment.id)}>
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
            <button
              type="button"
              className="submit"
              onClick={() => onSubmitReply(comment.id, comment.root_id || comment.id)}
              disabled={busy}
            >
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
  const [replies, setReplies] = useState({});
  const [expanded, setExpanded] = useState(() => new Set());
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [err, setErr] = useState('');

  const loadFirst = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await api(`${endpoint}?limit=${PAGE_SIZE}`);
      setComments(data.comments || []);
      setCursor(data.nextCursor || 0);
      setHasMore(!!data.hasMore);
      setReplies({});
      setExpanded(new Set());
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setErr('');
    try {
      const data = await api(`${endpoint}?limit=${PAGE_SIZE}&cursor=${cursor}`);
      setComments((prev) => [...prev, ...(data.comments || [])]);
      setCursor(data.nextCursor || 0);
      setHasMore(!!data.hasMore);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchReplies = async (rootId) => {
    const data = await api(`${endpoint}/${rootId}/replies`);
    setReplies((prev) => ({ ...prev, [rootId]: data.replies || [] }));
    return data.replies || [];
  };

  const toggleReplies = async (rootId) => {
    setErr('');
    if (expanded.has(rootId)) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(rootId);
        return next;
      });
      return;
    }
    setExpanded((prev) => new Set(prev).add(rootId));
    if (!replies[rootId]) {
      try {
        await fetchReplies(rootId);
      } catch (error) {
        setErr(error.message);
      }
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api(endpoint, { method: 'POST', token, body: { content } });
      setContent('');
      await loadFirst();
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReply = async (parentId, rootId) => {
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
      await fetchReplies(rootId);
      setExpanded((prev) => new Set(prev).add(rootId));
      setComments((prev) => prev.map((c) => (c.id === rootId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c)));
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
          <button className="submit" type="submit" disabled={busy}>{busy ? '提交中…' : submitLabel}</button>
        </form>
      ) : (
        <div className="comment-form">
          <p className="form-err" style={{ opacity: 0.7 }}>登录后参与留言</p>
          <Link className="submit" to="/auth">去登录</Link>
        </div>
      )}

      {err && <p className="form-err">{err}</p>}

      <div className="comment-list">
        {loading && <p className="form-err" style={{ opacity: 0.7 }}>正在加载留言…</p>}
        {!loading && comments.length === 0 && (
          <p className="form-err" style={{ opacity: 0.7 }}>{emptyText}</p>
        )}
        {!loading && comments.map((root) => {
          const threadReplies = replies[root.id] || [];
          const isOpen = expanded.has(root.id);
          return (
            <div className="comment-thread" key={root.id}>
              <CommentItem comment={root} isReply={false} parentNickname={null} {...shared} />
              {isOpen && threadReplies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply
                  parentNickname={threadReplies.find((r) => r.id === reply.parent_id)?.nickname || root.nickname}
                  {...shared}
                />
              ))}
              {root.replyCount > 0 && (
                <button type="button" className="load-replies" onClick={() => toggleReplies(root.id)}>
                  {isOpen ? '收起回复' : `查看 ${root.replyCount} 条回复`}
                </button>
              )}
            </div>
          );
        })}
        {!loading && hasMore && (
          <button type="button" className="load-more" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? '加载中…' : '加载更多评论'}
          </button>
        )}
      </div>
    </div>
  );
}
