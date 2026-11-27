import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fitcoach_token');
    if (token) {
      api.getMe()
        .then(data => { setUser(data.user); })
        .catch(() => { localStorage.removeItem('fitcoach_token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('fitcoach_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, full_name) => {
    const data = await api.register({ email, password, full_name });
    localStorage.setItem('fitcoach_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('fitcoach_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await api.getMe();
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
