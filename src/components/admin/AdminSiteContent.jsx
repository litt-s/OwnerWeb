import { useEffect, useState } from 'react';
import { contact as staticContact, repoPlatforms } from '../../data/resume';
import { useContent } from '../../context/ContentContext';
import {
  fetchAdminSiteContent,
  updateSiteContent,
} from '../../services/siteContent';

function toDraft(content) {
  const profile = { ...content.profile };
  if (Array.isArray(profile.repos)) {
    profile.repos = profile.repos.map((item) => ({ ...item }));
  } else if (profile.github || profile.githubUrl) {
    // 兼容旧数据：没有 repos 时用 github / githubUrl 生成 GitHub 项
    profile.repos = [{ key: 'github', username: profile.github || '', url: profile.githubUrl || '' }];
  } else {
    profile.repos = [];
  }
  return {
    profile: {
      ...profile,
      education: { ...content.profile.education },
    },
    hero: { ...content.hero },
    contact: {
      title: content.contact?.title ?? staticContact.title,
      eyebrow: content.contact?.eyebrow ?? staticContact.eyebrow,
    },
    experience: {
      ...content.experience,
      stats: (content.experience.stats || []).map((item) => ({ ...item })),
    },
  };
}

export default function AdminSiteContent({ token }) {
  const { reloadSiteContent } = useContent();
  const [draft, setDraft] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () =>
    fetchAdminSiteContent(token)
      .then((content) => setDraft(toDraft(content)))
      .catch((error) => setErr(error.message));

  useEffect(() => {
    setErr('');
    load();
  }, []);

  const setProfile = (key, value) => {
    setDraft((prev) => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
  };

  const toggleRepo = (key, checked) => {
    setDraft((prev) => {
      const current = prev.profile.repos || [];
      const repos = checked
        ? [...current, { key, username: '', url: '' }]
        : current.filter((item) => item.key !== key);
      return { ...prev, profile: { ...prev.profile, repos } };
    });
  };

  const setRepoField = (key, field, value) => {
    setDraft((prev) => {
      const current = prev.profile.repos || [];
      const repos = current.map((item) => (item.key === key ? { ...item, [field]: value } : item));
      return { ...prev, profile: { ...prev.profile, repos } };
    });
  };

  const setEducation = (key, value) => {
    setDraft((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        education: { ...prev.profile.education, [key]: value },
      },
    }));
  };

  const setHero = (key, value) => {
    setDraft((prev) => ({ ...prev, hero: { ...prev.hero, [key]: value } }));
  };

  const setContact = (key, value) => {
    setDraft((prev) => ({ ...prev, contact: { ...prev.contact, [key]: value } }));
  };

  const setIntro = (value) => {
    setDraft((prev) => ({ ...prev, experience: { ...prev.experience, intro: value } }));
  };

  const setStat = (index, key, value) => {
    setDraft((prev) => {
      const stats = [...prev.experience.stats];
      stats[index] = { ...stats[index], [key]: value };
      return { ...prev, experience: { ...prev.experience, stats } };
    });
  };

  const addStat = () => {
    setDraft((prev) => ({
      ...prev,
      experience: {
        ...prev.experience,
        stats: [...prev.experience.stats, { value: '', label: '', sub: '' }],
      },
    }));
  };

  const removeStat = (index) => {
    setDraft((prev) => ({
      ...prev,
      experience: {
        ...prev.experience,
        stats: prev.experience.stats.filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  };

  const save = async () => {
    setErr('');
    setMsg('');
    try {
      const content = await updateSiteContent(draft, token);
      await Promise.all([load(), reloadSiteContent()]);
      setDraft(toDraft(content));
      setMsg('站点内容已保存');
    } catch (error) {
      setErr(error.message);
    }
  };

  if (!draft) {
    return (
      <div className="admin-content">
        {err ? <p className="form-err">{err}</p> : <p className="form-err">正在加载内容…</p>}
      </div>
    );
  }

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <h3>内容管理</h3>
        <button type="button" className="submit" onClick={save}>保存内容</button>
      </div>
      {err && <p className="form-err">{err}</p>}
      {msg && <p className="form-ok">{msg}</p>}

      <div className="editor-grid">
        <div className="editor-block">
          <h4>Hero 文案</h4>
          <div className="editor-field">
            <label>主标题前段</label>
            <input value={draft.hero.headFirst} onChange={(event) => setHero('headFirst', event.target.value)} />
          </div>
          <div className="editor-field">
            <label>主标题后段</label>
            <input value={draft.hero.headSecond} onChange={(event) => setHero('headSecond', event.target.value)} />
          </div>
          <div className="editor-field">
            <label>副标题</label>
            <textarea rows={3} value={draft.hero.sub} onChange={(event) => setHero('sub', event.target.value)} />
          </div>
          <div className="editor-field">
            <label>宣言</label>
            <input value={draft.hero.statement} onChange={(event) => setHero('statement', event.target.value)} />
          </div>
          <div className="editor-field">
            <label>顶部标签</label>
            <input value={draft.hero.eyebrow} onChange={(event) => setHero('eyebrow', event.target.value)} />
          </div>
        </div>

        <div className="editor-block">
          <h4>身份与联系</h4>
          <div className="editor-grid compact">
            <div className="editor-field">
              <label>姓名</label>
              <input value={draft.profile.name} onChange={(event) => setProfile('name', event.target.value)} />
            </div>
            <div className="editor-field">
              <label>职业定位</label>
              <input value={draft.profile.role} onChange={(event) => setProfile('role', event.target.value)} />
            </div>
            <div className="editor-field">
              <label>联系邮箱</label>
              <input value={draft.profile.email} onChange={(event) => setProfile('email', event.target.value)} />
            </div>
            <div className="editor-field">
              <label>联系电话</label>
              <input value={draft.profile.phone} onChange={(event) => setProfile('phone', event.target.value)} />
            </div>
            <div className="editor-field">
              <label>电话拨号号码</label>
              <input value={draft.profile.phoneRaw} onChange={(event) => setProfile('phoneRaw', event.target.value)} />
            </div>
            <div className="editor-field">
              <label>所在地</label>
              <input value={draft.profile.location} onChange={(event) => setProfile('location', event.target.value)} />
            </div>
            <div className="editor-field">
              <label>微信号</label>
              <input value={draft.profile.wechat} onChange={(event) => setProfile('wechat', event.target.value)} />
            </div>
            <div className="editor-field editor-field-wide">
              <label>仓库托管平台</label>
              <div className="repo-picker">
                {repoPlatforms.map((platform) => {
                  const repo = (draft.profile.repos || []).find((item) => item.key === platform.key);
                  return (
                    <div className="repo-item" key={platform.key}>
                      <label className="repo-check">
                        <input
                          type="checkbox"
                          checked={!!repo}
                          onChange={(event) => toggleRepo(platform.key, event.target.checked)}
                        />
                        <span>{platform.label}</span>
                      </label>
                      {repo && (
                        <div className="repo-inputs">
                          <input
                            value={repo.username}
                            placeholder="用户名"
                            onChange={(event) => setRepoField(platform.key, 'username', event.target.value)}
                          />
                          <input
                            value={repo.url}
                            placeholder="链接，如 https://gitee.com/用户名"
                            onChange={(event) => setRepoField(platform.key, 'url', event.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="editor-field">
              <label>技术方向</label>
              <input value={draft.profile.focus} onChange={(event) => setProfile('focus', event.target.value)} />
            </div>
          </div>
        </div>

        <div className="editor-block">
          <h4>教育与认证</h4>
          <div className="editor-grid compact">
            <div className="editor-field">
              <label>学校</label>
              <input value={draft.profile.education.school} onChange={(event) => setEducation('school', event.target.value)} />
            </div>
            <div className="editor-field">
              <label>专业</label>
              <input value={draft.profile.education.major} onChange={(event) => setEducation('major', event.target.value)} />
            </div>
            <div className="editor-field">
              <label>时间</label>
              <input value={draft.profile.education.period} onChange={(event) => setEducation('period', event.target.value)} />
            </div>
            <div className="editor-field">
              <label>专业认证</label>
              <input value={draft.profile.certificate} onChange={(event) => setProfile('certificate', event.target.value)} />
            </div>
          </div>
        </div>

        <div className="editor-block">
          <h4>个人经历</h4>
          <div className="editor-field">
            <label>经历简介</label>
            <textarea rows={6} value={draft.experience.intro} onChange={(event) => setIntro(event.target.value)} />
          </div>

          <div className="editor-field">
            <label>经历统计</label>
            <div className="stats-editor">
              {draft.experience.stats.map((stat, index) => (
                <div className="stats-row" key={index}>
                  <input
                    value={stat.value}
                    placeholder="数值"
                    onChange={(event) => setStat(index, 'value', event.target.value)}
                  />
                  <input
                    value={stat.label}
                    placeholder="标题"
                    onChange={(event) => setStat(index, 'label', event.target.value)}
                  />
                  <input
                    value={stat.sub}
                    placeholder="说明"
                    onChange={(event) => setStat(index, 'sub', event.target.value)}
                  />
                  <button type="button" className="act del2" onClick={() => removeStat(index)}>删除</button>
                </div>
              ))}
            </div>
            <button type="button" className="act" onClick={addStat}>新增统计</button>
          </div>
        </div>

        <div className="editor-block">
          <h4>联系我</h4>
          <div className="editor-field">
            <label>大标题（可直接回车换行）</label>
            <textarea
              rows={3}
              value={draft.contact.title}
              onChange={(event) => setContact('title', event.target.value)}
            />
          </div>
          <div className="editor-field">
            <label>小标签</label>
            <input
              value={draft.contact.eyebrow}
              onChange={(event) => setContact('eyebrow', event.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
