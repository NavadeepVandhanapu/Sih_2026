import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';

export interface SignupData {
  name: string;
  email: string;
  password?: string;
  role?: Role;
  phone?: string;
  companyName?: string;
}

interface AuthContextType {
  user: User | null;
  demoUsers: User[];
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  switchUser: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FALLBACK_DEMO_USERS: User[] = [
  {
    id: 'usr-consumer',
    email: 'consumer@demo.com',
    name: 'Aarav Sharma (Consumer)',
    role: 'CONSUMER',
    phone: '+91 98765 43210',
    designation: 'Citizen Consumer',
  },
  {
    id: 'usr-company',
    email: 'company@demo.com',
    name: 'Rajesh Verma (Quality Head)',
    role: 'COMPANY',
    companyId: 'comp-apex',
    phone: '+91 98112 23344',
    designation: 'VP Regulatory Compliance',
  },
  {
    id: 'usr-officer',
    email: 'officer@demo.com',
    name: 'Sunita Meena, IO-LM',
    role: 'GOVERNMENT_OFFICER',
    phone: '+91 94140 11223',
    designation: 'Legal Metrology Inspector',
    department: 'Department of Consumer Affairs (DoCA)',
  },
  {
    id: 'usr-admin',
    email: 'admin@demo.com',
    name: 'Dr. K. R. Nambiar',
    role: 'ADMIN',
    phone: '+91 98200 55443',
    designation: 'Joint Secretary & Legal Metrology Director',
    department: 'DoCA Central Directorate',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>(FALLBACK_DEMO_USERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch seeded demo users, fall back gracefully if running standalone / on Vercel
    fetch('/api/auth/users')
      .then((res) => {
        if (!res.ok) throw new Error('API unavailable');
        return res.json();
      })
      .then((usersList: User[]) => {
        if (usersList && usersList.length > 0) {
          setDemoUsers(usersList);
          const savedUserId = localStorage.getItem('demo_user_id');
          const initial = usersList.find((u) => u.id === savedUserId);
          if (initial) setUser(initial);
        } else {
          throw new Error('Empty user list');
        }
      })
      .catch(() => {
        // Gracefully use built-in demo users for standalone/Vercel previews
        setDemoUsers(FALLBACK_DEMO_USERS);
        const savedUserId = localStorage.getItem('demo_user_id');
        const initial = FALLBACK_DEMO_USERS.find((u) => u.id === savedUserId);
        if (initial) setUser(initial);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const switchUser = (selectedUser: User) => {
    setUser(selectedUser);
    localStorage.setItem('demo_user_id', selectedUser.id);
  };

  const login = async (email: string, password: string = 'demo123'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('demo_user_id', data.user.id);
        return { success: true };
      }
      const errData = await res.json().catch(() => ({ error: 'Invalid credentials' }));
      if (res.status === 401 || res.status === 400) {
        // Check offline fallback before reporting error
        const fallbackUser = demoUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (fallbackUser && (password === 'demo123' || !password)) {
          setUser(fallbackUser);
          localStorage.setItem('demo_user_id', fallbackUser.id);
          return { success: true };
        }
        return { success: false, error: errData.error || 'Invalid email or password' };
      }
      throw new Error(errData.error || 'Login failed');
    } catch {
      // Offline fallback login for demo users
      const fallbackUser = demoUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (fallbackUser) {
        setUser(fallbackUser);
        localStorage.setItem('demo_user_id', fallbackUser.id);
        return { success: true };
      }
      return { success: false, error: 'User not found. Try one of the quick demo accounts or create a new account!' };
    }
  };

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const resData = await res.json();
        setUser(resData.user);
        localStorage.setItem('demo_user_id', resData.user.id);
        setDemoUsers((prev) => [...prev, resData.user]);
        return { success: true };
      }
      const errData = await res.json().catch(() => ({ error: 'Registration failed' }));
      return { success: false, error: errData.error || 'Failed to create account' };
    } catch {
      // Offline / standalone fallback signup (e.g. on static Vercel preview)
      const existing = demoUsers.find((u) => u.email.toLowerCase() === data.email.trim().toLowerCase());
      if (existing) {
        return { success: false, error: 'An account with this email already exists' };
      }
      const newUser: User = {
        id: `usr-${Date.now()}`,
        email: data.email.trim(),
        name: data.name.trim(),
        role: data.role || 'CONSUMER',
        phone: data.phone || '+91 98000 00000',
        designation:
          data.role === 'COMPANY'
            ? 'Regulatory Compliance Lead'
            : data.role === 'GOVERNMENT_OFFICER'
            ? 'Legal Metrology Inspector'
            : 'Citizen Consumer',
      };
      setUser(newUser);
      localStorage.setItem('demo_user_id', newUser.id);
      setDemoUsers((prev) => [...prev, newUser]);
      return { success: true };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('demo_user_id');
  };

  return (
    <AuthContext.Provider value={{ user, demoUsers, login, signup, switchUser, logout, isLoading }}>
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
