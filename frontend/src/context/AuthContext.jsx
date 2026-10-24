import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'chatUser';

const readStoredUser = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const normalizeUser = (payload) => payload?.user ?? payload ?? null;

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(readStoredUser);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  /* Verify the cookie session once on load instead of trusting localStorage. */
  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        if (!cancelled) setInitializing(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');

        if (!cancelled) {
          const user = normalizeUser(data);
          setAuthUser(user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        }
      } catch {
        if (!cancelled) {
          setAuthUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistUser = (payload) => {
    const user = normalizeUser(payload);
    setAuthUser(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  };

  const login = async (email, password) => {
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      return persistUser(data);
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', formData);
      return persistUser(data);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (recoveryData) => {
    setLoading(true);

    try {
      const { data } = await api.post('/auth/recovery/reset', recoveryData);
      return persistUser(data);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileAvatar = async (emoji) => {
    const { data } = await api.put('/auth/avatar', { avatar: emoji });
    if (data?.user) {
      persistUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAuthUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        setAuthUser,
        initializing,
        loading,
        login,
        register,
        resetPassword,
        updateProfileAvatar,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
