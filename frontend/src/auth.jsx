import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => setUser(null));
  }, []);

  const authenticate = async (path, body) => setUser((await api.post(path, body)).data.user);
  const value = {
    user,
    login: (body) => authenticate('/auth/login', body),
    register: (body) => authenticate('/auth/register', body),
    logout: async () => { await api.post('/auth/logout'); setUser(null); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
