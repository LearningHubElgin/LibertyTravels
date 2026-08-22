import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('liberty_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('liberty_token'));
  // If cached credentials exist, allow instant UI rendering without blocking on cold start
  const [loading, setLoading] = useState(() => {
    const savedUser = localStorage.getItem('liberty_user');
    const savedToken = localStorage.getItem('liberty_token');
    return !!savedToken && !savedUser;
  });

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('liberty_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.error('Session validation error:', error);
          setUser(null);
          setToken(null);
          localStorage.removeItem('liberty_user');
          localStorage.removeItem('liberty_token');
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: userData, accessToken } = res.data;
      setUser(userData);
      setToken(accessToken);
      localStorage.setItem('liberty_user', JSON.stringify(userData));
      localStorage.setItem('liberty_token', accessToken);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('liberty_user');
      localStorage.removeItem('liberty_token');
    }
  };

  const updateUserProfile = (updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('liberty_user', JSON.stringify(merged));
      return merged;
    });
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUserProfile,
        isAuthenticated: !!token && !!user,
        isSuperAdmin,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
