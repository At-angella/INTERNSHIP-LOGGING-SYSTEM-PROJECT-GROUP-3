'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';
import { mockUsers } from './mockData';
import { User, UserRole } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.getUserProfile()
        .then(userData => {
          setUser(userData);
          setLoading(false);
        })
        .catch(() => {
          api.clearTokens();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    
    // Handle both real (tokens: {access, refresh}) and mock (access) formats
    const access = response.tokens?.access || response.access;
    const refresh = response.tokens?.refresh || response.refresh;
    
    api.setTokens(access, refresh);
    
    // Fetch the latest profile. Then merge must_change_password from the login
    // response in case /users/me/ doesn't return it (common in many backends).
    const userData = await api.getUserProfile();
    const loginUser = response.user ?? response;
    const merged = {
      ...userData,
      must_change_password:
        userData.must_change_password !== undefined
          ? userData.must_change_password
          : loginUser?.must_change_password ?? false,
    };
    setUser(merged);
    return merged;
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
