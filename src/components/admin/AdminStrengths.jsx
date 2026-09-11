import { useEffect, useState } from 'react';
import { useContent } from '../../context/ContentContext';
import {
  fetchAdminStrengths,
  createStrength,
  updateStrength,
  deleteStrength,
} from '../../services/strengths';

const emptyDraft = {
  sort_order: 1,
  title: '',
  desc: '',
};

function toDraft(strength) {
  return {
    sort_order: strength.sort_order ?? 1,
    title: strength.title || '',
    desc: strength.desc || '',
  };
}

export default function AdminStrengths({ token }) {
  const { reloadStrengths } = useContent();
  const [strengths, setStrengths] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () =>
    fetchAdminStrengths(token)
      .then(setStrengths)
      .catch((error) => setErr(error.message));

  useEffect(() => {
    setErr('');
    load();
  }, []);

  const openNew = () => {
    const nextOrder = strengths.reduce((max, item) => Math.max(max, item.sort_order || 0), 0) + 1;
    setDraft({ ...emptyDraft, sort_order: nextOrder });
    setEditingId(null);
    setConfirmId(null);
    setErr('');
    setMsg('');
  };

  const openEdit = (strength) => {
    setDraft(toDraft(strength));
    setEditingId(strength.id);
    setConfirmId(null);
    setErr('');
    setMsg('');
  };

  const closeEditor = () => {
    setDraft(null);
    setEditingId(null);
  };

  const save = async () => {
    if (!draft) return;
    setErr('');
    setMsg('');
    const payload = {
      sort_order: Number(draft.sort_order) || 1,
      title: draft.title,
      desc: draft.desc,
    };

    try {
      const strength = editingId
        ? await updateStrength(editingId, payload, token)
        : await createStrength(payload, token);
      await Promise.all([load(), reloadStrengths()]);
      setDraft(toDraft(strength));
      setEditingId(strength.id);
      setMsg('优势已保存');
    } catch (error) {
      setErr(error.message);
    }
  };

  const remove = async (strength) => {
    setErr('');
    setMsg('');
    try {
      await deleteStrength(strength.id, token);
      setConfirmId(null);
      await Promise.all([load(), reloadStrengths()]);
      setMsg('优势已删除');
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <div className="admin-content">
      {!draft ? (
        <>
          <div className="admin-toolbar">
            <h3>优势管理</h3>
            <button type="button" className="submit" onClick={openNew}>新增优势</button>
          </div>
          {err && <p className="form-err">{err}</p>}
          {msg && <p className="form-ok">{msg}</p>}

          <div className="admin-table strength-table">
            <div className="row head">
              <span>优势</span>
              <span>排序</span>
              <span>操作</span>
            </div>
            {strengths.length === 0 && (
              <div className="row"><span colSpan={3}>暂无优势</span></div>
            )}
            {strengths.map((strength) => (
              <div className="row" key={strength.id}>
                <span>
                  <b>{strength.title}</b>
                  <small className="muted">{strength.desc}</small>
                </span>
                <span>{strength.sort_order}</span>
                <span className="acts">
                  <button type="button" className="act" onClick={() => openEdit(strength)}>编辑</button>
                  <button type="button" className="act del2" onClick={() => setConfirmId(strength.id)}>删除</button>
                </span>
                {confirmId === strength.id && (
                  <div className="confirm-bar">
                    <span>确认删除“{strength.title}”吗？</span>
                    <button type="button" className="submit danger" onClick={() => remove(strength)}>确认删除</button>
                    <button type="button" className="cancel-btn" onClick={() => setConfirmId(null)}>取消</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="admin-editor">
          <div className="admin-toolbar">
            <h3>{editingId ? '编辑优势' : '新增优势'}</h3>
            <div className="acts">
              <button type="button" className="cancel-btn" onClick={closeEditor}>返回列表</button>
              <button type="button" className="submit" onClick={save}>保存优势</button>
            </div>
          </div>
          {err && <p className="form-err">{err}</p>}
          {msg && <p className="form-ok">{msg}</p>}

          <div className="editor-grid single-column">
            <div className="editor-block">
              <h4>优势内容</h4>
              <div className="editor-field">
                <label>排序</label>
                <input
                  type="number"
                  min={1}
                  value={draft.sort_order}
                  onChange={(event) => setDraft((prev) => ({ ...prev, sort_order: event.target.value }))}
                />
              </div>
              <div className="editor-field">
                <label>标题</label>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="editor-field">
                <label>描述</label>
                <textarea
                  rows={3}
                  value={draft.desc}
                  onChange={(event) => setDraft((prev) => ({ ...prev, desc: event.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
