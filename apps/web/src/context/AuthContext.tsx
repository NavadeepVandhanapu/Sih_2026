import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  demoUsers: User[];
  token: string | null;
  login: (email: string, password?: string) => Promise<boolean>;
  switchUser: (user: User) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Setup global fetch interceptor to attach JWT token to all /api/ requests
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  const token = localStorage.getItem('auth_token');
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  if (token && urlStr.includes('/api/') && !urlStr.includes('/api/auth/login') && !urlStr.includes('/api/auth/demo-users')) {
    init = init || {};
    const headers = new Headers(init.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    init.headers = headers;
  }

  return originalFetch.call(window, input, init);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loginWithCredentials = async (email: string, password: string = 'demo123'): Promise<boolean> => {
    try {
      const res = await originalFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('demo_user_id', data.user.id);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  };

  useEffect(() => {
    // 1. Fetch non-sensitive demo profiles for navbar role switcher
    fetch('/api/auth/demo-users')
      .then((res) => res.json())
      .then(async (usersList: User[]) => {
        setDemoUsers(usersList);

        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
          // Verify current token
          try {
            const meRes = await originalFetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              setUser(meData);
              setToken(savedToken);
              return;
            }
          } catch (e) {
            console.error('Session restore error:', e);
          }
        }

        // Default login as initial Consumer demo user
        const savedUserId = localStorage.getItem('demo_user_id');
        const initialUser =
          usersList.find((u) => u.id === savedUserId) ||
          usersList.find((u) => u.role === 'CONSUMER') ||
          usersList[0];

        if (initialUser) {
          await loginWithCredentials(initialUser.email, 'demo123');
        }
      })
      .catch((err) => {
        console.error('Failed to load demo users:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const switchUser = async (selectedUser: User): Promise<boolean> => {
    setIsLoading(true);
    const success = await loginWithCredentials(selectedUser.email, 'demo123');
    setIsLoading(false);
    return success;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('demo_user_id');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        demoUsers,
        token,
        login: loginWithCredentials,
        switchUser,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
