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

  async getUserProfile() {
    if (USE_MOCK_DATA) {
      const userStr = localStorage.getItem('mockUser');
      if (userStr) return JSON.parse(userStr);
      throw new Error('No user found');
    }
    return this.request('/users/me/');
  }

  registerStudent(data: any) {
    return this.request('/auth/register/student/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  changePassword(oldPassword: string, newPassword: string) {
    return this.request('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: newPassword,
      }),
    });
  }

  // Placements
  async getPlacements(params?: any) {
    if (USE_MOCK_DATA) return mockApiData.getPlacements();
    const query = params ? '?' + new URLSearchParams(params) : '';
    return this.request(`/placements/${query}`);
  }

  async getPlacement(id: number) {
    if (USE_MOCK_DATA) return mockApiData.getPlacement(id);
    return this.request(`/placements/${id}/`);
  }

  async createPlacement(data: any) {
    if (USE_MOCK_DATA) return mockApiData.createPlacement(data);
    return this.request('/placements/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updatePlacementStatus(id: number, status: string) {
    return this.request(`/placements/${id}/update_status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Weekly Logs
  async getWeeklyLogs(params?: any) {
    if (USE_MOCK_DATA) return mockApiData.getWeeklyLogs();
    const query = params ? '?' + new URLSearchParams(params) : '';
    return this.request(`/logs/${query}`);
  }

  async getWeeklyLog(id: number) {
    if (USE_MOCK_DATA) return mockApiData.getWeeklyLog(id);
    return this.request(`/logs/${id}/`);
  }

  async createWeeklyLog(data: any) {
    if (USE_MOCK_DATA) return mockApiData.createWeeklyLog(data);
    return this.request('/logs/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateWeeklyLog(id: number, data: any) {
    return this.request(`/logs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  submitLog(id: number) {
    return this.request(`/logs/${id}/submit/`, { method: 'POST' });
  }

  reviewLog(id: number) {
    return this.request(`/logs/${id}/review/`, { method: 'POST' });
  }

  approveLog(id: number) {
    return this.request(`/logs/${id}/approve/`, { method: 'POST' });
  }

  rejectLog(id: number) {
    return this.request(`/logs/${id}/reject/`, { method: 'POST' });
  }