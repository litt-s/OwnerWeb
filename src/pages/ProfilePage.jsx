import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/PageShell';
import { api } from '../api';

export default function ProfilePage() {
  const { user, token, refresh } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [pw, setPw] = useState({ old: '', n1: '', n2: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (!user) {
    return (
      <PageShell title="个人主页">
        <div className="container" style={{ padding: '40px 0 60px' }}>
          <p className="form-err">请先登录后再访问个人主页。</p>
        </div>
      </PageShell>
    );
  }

  const save = async () => {
    setMsg(''); setErr('');
    try {
      await api('/api/profile', { method: 'PUT', body: { nickname, bio }, token });
      await refresh();
      setMsg('已保存');
    } catch (e) { setErr(e.message); }
  };

  const upload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('avatar', f);
    setMsg(''); setErr('');
    try {
      await api('/api/profile/avatar', { method: 'POST', form: fd, token });
      await refresh();
      setMsg('头像已更新');
    } catch (e) { setErr(e.message); }
  };

  const changePw = async () => {
    setMsg(''); setErr('');
    if (pw.n1 !== pw.n2) return setErr('两次新密码不一致');
    try {
      await api('/api/profile/password', { method: 'PUT', body: { oldPassword: pw.old, newPassword: pw.n1 }, token });
      setPw({ old: '', n1: '', n2: '' });
      setMsg('密码已修改');
    } catch (e) { setErr(e.message); }
  };

  return (
    <PageShell title="个人主页">
      <div className="profile-grid container">
        <div className="avatar">
          {user.avatar ? <img src={user.avatar} alt="头像" /> : <span className="avatar-ph">未上传头像</span>}
          <label className="avatar-up">
            上传头像
            <input type="file" accept="image/*" onChange={upload} hidden />
          </label>
        </div>

        <div>
          <div className="info-block">
            <h4>基本资料</h4>
            <div className="field"><label>昵称</label><input value={nickname} onChange={(e) => setNickname(e.target.value)} /></div>
            <div className="field"><label>邮箱</label><input value={user.email} disabled /></div>
            <div className="field"><label>个性签名</label><input value={bio} onChange={(e) => setBio(e.target.value)} /></div>
            <button className="submit" onClick={save}>保存资料</button>
          </div>

          <div className="info-block">
            <h4>修改密码</h4>
            <div className="field"><label>原密码</label><input type="password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} /></div>
            <div className="field"><label>新密码</label><input type="password" value={pw.n1} onChange={(e) => setPw({ ...pw, n1: e.target.value })} /></div>
            <div className="field"><label>确认新密码</label><input type="password" value={pw.n2} onChange={(e) => setPw({ ...pw, n2: e.target.value })} /></div>
            <button className="submit" onClick={changePw}>修改密码</button>
          </div>

          {msg && <p className="form-ok">{msg}</p>}
          {err && <p className="form-err">{err}</p>}
        </div>
      </div>
    </PageShell>
  );
}
