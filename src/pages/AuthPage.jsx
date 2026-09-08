import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/PageShell';
import { EyeIcon, EyeOffIcon } from '../components/icons';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nickname, setNickname] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (mode === 'register' && password !== confirm) return setErr('两次密码不一致');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, nickname || email.split('@')[0]);
      navigate('/profile');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title="登录 / 注册">
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="tabs">
            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setErr(''); setShowPassword(false); setShowConfirm(false); }}>
              登录
            </button>
            <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setErr(''); setShowPassword(false); setShowConfirm(false); }}>
              邮箱注册
            </button>
          </div>
          <form onSubmit={submit} className="form">
            {mode === 'register' && (
              <div className="field">
                <label>昵称</label>
                <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="昵称" />
              </div>
            )}
            <div className="field">
              <label>邮箱</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>密码</label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  title={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>
            {mode === 'register' && (
              <div className="field">
                <label>确认密码</label>
                <div className="password-field">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="再次输入"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-pressed={showConfirm}
                    aria-label={showConfirm ? '隐藏确认密码' : '显示确认密码'}
                    title={showConfirm ? '隐藏确认密码' : '显示确认密码'}
                  >
                    {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>
            )}
            {err && <p className="form-err">{err}</p>}
            <button className="submit" disabled={busy}>{busy ? '请稍候…' : mode === 'login' ? '登录' : '注册'}</button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
