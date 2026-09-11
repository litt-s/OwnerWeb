import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

function buildChildMap(comments) {
  const childMap = new Map();
  for (const comment of comments) {
    const key = comment.parent_id ?? 0;
    const list = childMap.get(key) || [];
    list.push(comment);
    childMap.set(key, list);
  }
  return childMap;
}

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

function CommentNode({
  comment,
  childMap,
  user,
  replyingTo,
  replyText,
  onReply,
  onReplyTextChange,
  onSubmitReply,
}) {
  const children = childMap.get(comment.id) || [];

  return (
    <div className="comment-thread">
      <article className={comment.parent_id ? 'comment reply' : 'comment'}>
        <CommentAvatar comment={comment} />
        <div className="c-body">
          <div className="c-head">
            <b>{comment.nickname}</b>
            <time dateTime={comment.created_at}>{comment.created_at}</time>
          </div>
          <p>{comment.content}</p>
          {user && (
            <button
              type="button"
              className="reply-btn"
              onClick={() => onReply(comment.id)}
            >
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
            <button type="button" className="submit" onClick={() => onSubmitReply(comment.id)}>
              发布回复
            </button>
            <button type="button" className="cancel-btn" onClick={() => onReply(null)}>
              取消
            </button>
          </div>
        </div>
      )}

      {children.length > 0 && (
        <div className="comment-children">
          {children.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              childMap={childMap}
              user={user}
              replyingTo={replyingTo}
              replyText={replyText}
              onReply={onReply}
              onReplyTextChange={onReplyTextChange}
              onSubmitReply={onSubmitReply}
            />
          ))}
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

  const load = () =>
    api(endpoint)
      .then((data) => setComments(data.comments))
      .catch((error) => setErr(error.message));

  useEffect(() => {
    setErr('');
    load();
  }, [endpoint]);

  const childMap = buildChildMap(comments);
  const topLevel = childMap.get(0) || [];

  const submit = async (event) => {
    event.preventDefault();
    setErr('');
    try {
      await api(endpoint, {
        method: 'POST',
        token,
        body: { content },
      });
      setContent('');
      load();
    } catch (error) {
      setErr(error.message);
    }
  };

  const submitReply = async (parentId) => {
    if (!replyText.trim()) {
      setErr('回复内容必填');
      return;
    }

    setErr('');
    try {
      await api(endpoint, {
        method: 'POST',
        token,
        body: { content: replyText, parent_id: parentId },
      });
      setReplyText('');
      setReplyingTo(null);
      load();
    } catch (error) {
      setErr(error.message);
    }
  };

  const handleReply = (commentId) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyText('');
    setErr('');
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
          <button className="submit" type="submit">{submitLabel}</button>
        </form>
      ) : (
        <div className="comment-form">
          <p className="form-err" style={{ opacity: 0.7 }}>登录后参与留言</p>
          <Link className="submit" to="/auth">去登录</Link>
        </div>
      )}

      <div className="comment-list">
        {topLevel.length === 0 && (
          <p className="form-err" style={{ opacity: 0.7 }}>{emptyText}</p>
        )}
        {topLevel.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            childMap={childMap}
            user={user}
            replyingTo={replyingTo}
            replyText={replyText}
            onReply={handleReply}
            onReplyTextChange={setReplyText}
            onSubmitReply={submitReply}
          />
        ))}
      </div>
    </div>
  );
}
