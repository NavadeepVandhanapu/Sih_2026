import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  demoUsers: User[];
  login: (email: string) => Promise<boolean>;
  switchUser: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch seeded demo users
    fetch('/api/auth/users')
      .then((res) => res.json())
      .then((usersList: User[]) => {
        setDemoUsers(usersList);
        // Default to Consumer for initial experience
        const savedUserId = localStorage.getItem('demo_user_id');
        const initial = usersList.find((u) => u.id === savedUserId) || usersList.find((u) => u.role === 'CONSUMER') || usersList[0];
        if (initial) {
          setUser(initial);
        }
      })
      .catch((err) => {
        console.error('Failed to load demo users:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const switchUser = (selectedUser: User) => {
    setUser(selectedUser);
    localStorage.setItem('demo_user_id', selectedUser.id);
  };

  const login = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'demo123' }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('demo_user_id', data.user.id);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('demo_user_id');
  };

  return (
    <AuthContext.Provider value={{ user, demoUsers, login, switchUser, logout, isLoading }}>
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
