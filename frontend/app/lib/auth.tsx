'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';
import { mockUsers } from './mockData';
import { User, UserRole } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
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