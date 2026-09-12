import { useEffect, useState } from 'react';
import { useContent } from '../../context/ContentContext';
import ProjectVideo from '../ProjectVideo';
import { LockIcon } from '../icons';
import {
  fetchAdminProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectMedia,
  signProjectVideo,
} from '../../services/projects';

function putToCos(url, authorization, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Authorization', authorization);
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`视频上传失败（${xhr.status}）`));
    };
    xhr.onerror = () => reject(new Error('视频上传失败，请检查 COS 的 CORS 配置'));
    xhr.send(file);
  });
}

function splitLines(value) {
  return String(value || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function toDraft(project) {
  return {
    id: project.id || '',
    sort_order: project.sort_order ?? 1,
    name: project.name || '',
    en: project.en || '',
    tagline: project.tagline || '',
    desc: project.desc || '',
    longDesc: project.longDesc || '',
    video: project.video || '',
    cover: project.cover || '',
    link: project.link || '',
    linkLabel: project.linkLabel || '',
    tech: (project.tech || []).join('\n'),
    points: (project.points || []).join('\n'),
    requiresLogin: !!project.requiresLogin,
  };
}

const emptyDraft = {
  id: '',
  sort_order: 1,
  name: '',
  en: '',
  tagline: '',
  desc: '',
  longDesc: '',
  video: '',
  cover: '',
  link: '',
  linkLabel: '',
  tech: '',
  points: '',
  requiresLogin: false,
};

export default function AdminProjects({ token }) {
  const { reloadProjects } = useContent();
  const [projects, setProjects] = useState([]);
  const [draft, setDraft] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoPct, setVideoPct] = useState(0);

  const load = () =>
    fetchAdminProjects(token)
      .then(setProjects)
      .catch((error) => setErr(error.message));

  useEffect(() => {
    setErr('');
    load();
  }, []);

  const openNew = () => {
    const nextOrder = projects.reduce((max, item) => Math.max(max, item.sort_order || 0), 0) + 1;
    setDraft({ ...emptyDraft, sort_order: nextOrder });
    setConfirmId(null);
    setErr('');
    setMsg('');
  };

  const openEdit = (project) => {
    setDraft(toDraft(project));
    setConfirmId(null);
    setErr('');
    setMsg('');
  };

  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!draft) return;
    setErr('');
    setMsg('');
    const payload = {
      id: draft.id,
      sort_order: Number(draft.sort_order) || 1,
      name: draft.name,
      en: draft.en,
      tagline: draft.tagline,
      desc: draft.desc,
      longDesc: draft.longDesc,
      video: draft.video || null,
      cover: draft.cover || null,
      link: draft.link,
      linkLabel: draft.linkLabel,
      tech: splitLines(draft.tech),
      points: splitLines(draft.points),
      requiresLogin: !!draft.requiresLogin,
    };

    try {
      const exists = projects.some((project) => project.id === draft.id);
      const project = exists
        ? await updateProject(draft.id, payload, token)
        : await createProject(payload, token);
      await Promise.all([load(), reloadProjects()]);
      const saved = toDraft(project);
      setDraft(saved);
      setMsg(exists ? '项目已保存' : '项目已创建，可继续上传封面或填写视频链接');
    } catch (error) {
      setErr(error.message);
    }
  };

  const uploadMedia = async (field) => {
    if (!draft?.id) return;
    const input = document.getElementById(`admin-upload-${field}`);
    const file = input?.files?.[0];
    if (!file) {
      setErr('请先选择文件');
      return;
    }

    setErr('');
    setMsg('');
    try {
      const project = await uploadProjectMedia(draft.id, field, file, token);
      await Promise.all([load(), reloadProjects()]);
      setDraft(toDraft(project));
      setMsg(field === 'video' ? '项目视频已更新' : '项目封面已更新');
      if (input) input.value = '';
    } catch (error) {
      setErr(error.message);
    }
  };

  const uploadVideo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !draft?.id) return;
    setErr('');
    setMsg('');
    setVideoBusy(true);
    setVideoPct(0);
    try {
      const { uploadUrl, authorization, publicUrl } = await signProjectVideo(
        draft.id,
        { filename: file.name },
        token
      );
      await putToCos(uploadUrl, authorization, file, setVideoPct);
      set('video', publicUrl);
      setMsg('视频已上传到 COS，请点击「保存项目」写入。');
    } catch (error) {
      setErr(error.message);
    } finally {
      setVideoBusy(false);
    }
  };

  const remove = async (project) => {
    setErr('');
    setMsg('');
    try {
      await deleteProject(project.id, token);
      setConfirmId(null);
      await Promise.all([load(), reloadProjects()]);
      setMsg('项目已删除');
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <div className="admin-content">
      {!draft ? (
        <>
          <div className="admin-toolbar">
            <h3>项目管理</h3>
            <button type="button" className="submit" onClick={openNew}>新增项目</button>
          </div>
          {err && <p className="form-err">{err}</p>}
          {msg && <p className="form-ok">{msg}</p>}

          <div className="admin-table project-table">
            <div className="row head">
              <span>项目</span>
              <span>排序</span>
              <span>封面</span>
              <span>操作</span>
            </div>
            {projects.length === 0 && (
              <div className="row"><span colSpan={4}>暂无项目</span></div>
            )}
            {projects.map((project) => (
              <div className="row" key={project.id}>
                <span>
                  <b>
                    {project.requiresLogin && (
                      <span className="admin-lock" title="仅登录用户可查看">
                        <LockIcon size={13} />
                      </span>
                    )}
                    {project.name}
                  </b>
                  <small className="muted">{project.id}</small>
                </span>
                <span>{project.sort_order}</span>
                <span>{project.cover ? '已上传' : project.id === 'yuhu' || project.id === 'zhiyun' ? 'SVG 封面' : '未上传'}</span>
                <span className="acts">
                  <button type="button" className="act" onClick={() => openEdit(project)}>编辑</button>
                  <button type="button" className="act del2" onClick={() => setConfirmId(project.id)}>删除</button>
                </span>
                {confirmId === project.id && (
                  <div className="confirm-bar" colSpan={4}>
                    <span>删除“{project.name}”会同时删除其全部评论，确认删除吗？</span>
                    <button type="button" className="submit danger" onClick={() => remove(project)}>确认删除</button>
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
            <h3>{projects.some((project) => project.id === draft.id) ? '编辑项目' : '新增项目'}</h3>
            <div className="acts">
              <button type="button" className="cancel-btn" onClick={() => setDraft(null)}>返回列表</button>
              <button type="button" className="submit" onClick={save}>保存项目</button>
            </div>
          </div>
          {err && <p className="form-err">{err}</p>}
          {msg && <p className="form-ok">{msg}</p>}

          <div className="editor-grid">
            <div className="editor-block">
              <h4>基本信息</h4>
              <div className="editor-field">
                <label>项目 ID</label>
                <input
                  value={draft.id}
                  disabled={projects.some((project) => project.id === draft.id)}
                  onChange={(event) => set('id', event.target.value)}
                  placeholder="例如 new-project"
                />
              </div>
              <div className="editor-field">
                <label>项目名称</label>
                <input value={draft.name} onChange={(event) => set('name', event.target.value)} />
              </div>
              <div className="editor-field">
                <label>英文标题</label>
                <input value={draft.en} onChange={(event) => set('en', event.target.value)} />
              </div>
              <div className="editor-field">
                <label>一句话定位</label>
                <input value={draft.tagline} onChange={(event) => set('tagline', event.target.value)} />
              </div>
              <div className="editor-field">
                <label>卡片简介</label>
                <textarea rows={2} value={draft.desc} onChange={(event) => set('desc', event.target.value)} />
              </div>
              <div className="editor-field">
                <label>详细介绍</label>
                <textarea rows={7} value={draft.longDesc} onChange={(event) => set('longDesc', event.target.value)} />
              </div>
            </div>

            <div className="editor-block">
              <h4>展示与链接</h4>
              <div className="editor-field">
                <label>排序</label>
                <input type="number" min={1} value={draft.sort_order} onChange={(event) => set('sort_order', event.target.value)} />
              </div>
              <div className="editor-field">
                <label>技术标签（每行一个）</label>
                <textarea rows={4} value={draft.tech} onChange={(event) => set('tech', event.target.value)} />
              </div>
              <div className="editor-field">
                <label>核心实现（每行一条）</label>
                <textarea rows={7} value={draft.points} onChange={(event) => set('points', event.target.value)} />
              </div>
              <div className="editor-field">
                <label>仓库地址</label>
                <input value={draft.link} onChange={(event) => set('link', event.target.value)} placeholder="github.com/user/repo" />
              </div>
              <div className="editor-field">
                <label>仓库显示文字</label>
                <input value={draft.linkLabel} onChange={(event) => set('linkLabel', event.target.value)} />
              </div>
              <div className="editor-field">
                <label className="repo-check">
                  <input
                    type="checkbox"
                    checked={!!draft.requiresLogin}
                    onChange={(event) => set('requiresLogin', event.target.checked)}
                  />
                  <span>仅登录用户可查看</span>
                </label>
                <span className="editor-note">
                  勾选后，未登录访客在列表里只能看到锁定卡片，项目正文、视频与仓库链接不会返回。
                </span>
              </div>
            </div>

            <div className="editor-block media-block">
              <h4>视频与封面</h4>
              <div className="editor-field">
                <label>演示视频链接</label>
                <input
                  value={draft.video}
                  onChange={(event) => set('video', event.target.value)}
                  placeholder="B站 / YouTube 视频页链接，或 .mp4 直链"
                />
                <label className={`file-btn ${videoBusy ? 'is-busy' : ''}`}>
                  {videoBusy ? `上传中… ${videoPct}%` : '上传视频到 COS'}
                  <input
                    type="file"
                    accept="video/*"
                    hidden
                    disabled={videoBusy || !projects.some((p) => p.id === draft.id)}
                    onChange={uploadVideo}
                  />
                </label>
                <span className="editor-note">
                  上传到腾讯云 COS 会自动填入链接；也可直接粘贴 B站 / YouTube / 直链。新项目请先保存再上传。
                </span>
              </div>
              <div className="editor-field">
                <label>项目封面</label>
                <span className="media-path">{draft.cover || '尚未上传封面'}</span>
                <label className="file-btn">
                  上传 / 替换封面
                  <input id="admin-upload-cover" type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={() => uploadMedia('cover')} />
                </label>
              </div>
              {draft.video && (
                <ProjectVideo src={draft.video} poster={draft.cover} className="editor-video-preview" />
              )}
              {draft.cover && (
                <img className="editor-cover-preview" src={draft.cover} alt="项目封面预览" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
