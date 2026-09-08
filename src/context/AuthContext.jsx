import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api('/api/auth/me', { token })
      .then((d) => setUser(d.user))
      .catch(() => {
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const d = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('token', d.token);
    setToken(d.token);
    setUser(d.user);
    return d.user;
  };

  const register = async (email, password, nickname) => {
    const d = await api('/api/auth/register', { method: 'POST', body: { email, password, nickname } });
    localStorage.setItem('token', d.token);
    setToken(d.token);
    setUser(d.user);
    return d.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const refresh = () =>
    token
      ? api('/api/auth/me', { token }).then((d) => setUser(d.user))
      : Promise.resolve();

  return (
    <Ctx.Provider value={{ user, token, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
