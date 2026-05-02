import { mockApiData, mockUsers } from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
// Use mock data only if explicitly requested via env var
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  setTokens(access: string, refresh?: string) {
    this.token = access;
    localStorage.setItem('access_token', access);
    if (refresh) {
      this.refreshToken = refresh;
      localStorage.setItem('refresh_token', refresh);
    }
  }

  getToken() {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
    return this.token;
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Attempt refresh or redirect
      this.clearTokens();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      let errorMessage = 'API request failed';
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || JSON.stringify(error);
      } catch (e) {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockUser = mockUsers.find(u => u.email === email);
      if (!mockUser) throw new Error('Invalid email or password');
      
      const token = 'mock_token_' + Date.now();
      this.setTokens(token, 'mock_refresh');
      
      // Store user for mock getUserProfile
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
      }
      
      return { tokens: { access: token, refresh: 'mock_refresh' }, user: mockUser };
    }
    
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }