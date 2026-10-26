import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, login as apiLogin, logout as apiLogout } from '../api/admin.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ admin: null, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    fetchMe(controller.signal)
      .then((res) => setState({ admin: res.admin, loading: false }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ admin: null, loading: false });
      });

    const onExpired = () => setState({ admin: null, loading: false });
    window.addEventListener('auth:unauthorized', onExpired);

    return () => {
      controller.abort();
      window.removeEventListener('auth:unauthorized', onExpired);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiLogin(email, password);
    setState({ admin: res.admin, loading: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setState({ admin: null, loading: false });
    }
  }, []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
