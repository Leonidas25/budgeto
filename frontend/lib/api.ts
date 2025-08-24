import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// API Functions
export const api = {
  // Authentication
  auth: {
    register: (userData: RegisterData) => 
      apiClient.post('/api/auth/register', userData),
    
    login: (credentials: LoginCredentials) => {
      // OAuth2PasswordRequestForm expects form data, not JSON
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);
      
      return apiClient.post('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    },
    
    me: () => 
      apiClient.get('/api/auth/me'),
    
    refresh: () => 
      apiClient.post('/api/auth/refresh'),
    
    updateProfile: (profileData: UserProfileUpdate) => 
      apiClient.put('/api/auth/profile', profileData),
    
    changePassword: (passwordData: PasswordChangeRequest) => 
      apiClient.post('/api/auth/change-password', passwordData),
    
    deleteAccount: () => 
      apiClient.delete('/api/auth/account'),
  },

  // Transactions
  transactions: {
    getAll: (params?: TransactionFilters) => 
      apiClient.get('/api/transactions', { params }),
    
    getPending: () => 
      apiClient.get('/api/transactions/pending'),
    
    create: (data: TransactionCreate) => 
      apiClient.post('/api/transactions', data),
    
    approve: (id: number, data?: TransactionApprove) => 
      apiClient.post(`/api/transactions/${id}/approve`, data),
    
    update: (id: number, data: TransactionUpdate) => 
      apiClient.put(`/api/transactions/${id}`, data),
    
    delete: (id: number) => 
      apiClient.delete(`/api/transactions/${id}`),
    
    getSummary: () => 
      apiClient.get('/api/transactions/stats/summary'),
    
    suggestCategory: (data: CategorySuggestionRequest) => 
      apiClient.post('/api/transactions/suggest-category', data),
    
    getPopularCategories: (limit = 10) => 
      apiClient.get('/api/transactions/categories/popular', { params: { limit } }),
  },

  // Budgets
  budgets: {
    getAll: (activeOnly = true) => 
      apiClient.get('/api/budgets', { params: { active_only: activeOnly } }),
    
    create: (data: BudgetCreate) => 
      apiClient.post('/api/budgets', data),
    
    getProgress: (id: number) => 
      apiClient.get(`/api/budgets/${id}/progress`),
    
    update: (id: number, data: BudgetUpdate) => 
      apiClient.put(`/api/budgets/${id}`, data),
    
    delete: (id: number) => 
      apiClient.delete(`/api/budgets/${id}`),
  },

  // Gamification
  gamification: {
    getMyStats: () => 
      apiClient.get('/api/gamification/me'),
    
    awardXP: (action: string) => 
      apiClient.post(`/api/gamification/award-xp/${action}`),
    
    getInsights: () => 
      apiClient.get('/api/gamification/insights'),
    
    getLeaderboard: () => 
      apiClient.get('/api/gamification/leaderboard'),
  },

  // SMS Processing
  sms: {
    parse: (smsText: string) => 
      apiClient.post('/api/sms/parse', { sms_text: smsText }),
    
    testPatterns: () => 
      apiClient.get('/api/sms/test-patterns'),
  },

  // Telegram Bot
  telegram: {
    getMyStatus: () =>
      apiClient.get('/api/telegram/my-telegram'),
    
    unlink: () =>
      apiClient.post('/api/telegram/unlink'),
    
    getBotInfo: () =>
      apiClient.get('/api/telegram/info'),
    
    sendMessage: (userId: number, message: string) =>
      apiClient.post(`/api/telegram/send-message/${userId}`, { message }),
  },

  // Achievements
  achievements: {
    getAchievements: () =>
      apiClient.get('/api/achievements/achievements'),
    
    checkAchievements: () =>
      apiClient.post('/api/achievements/check-achievements'),
    
    getNotifications: () =>
      apiClient.get('/api/achievements/notifications'),
    
    markNotificationRead: (notificationId: number) =>
      apiClient.post(`/api/achievements/notifications/${notificationId}/read`),
    
    markAllNotificationsRead: () =>
      apiClient.post('/api/achievements/notifications/read-all'),
    
    getAchievementStats: () =>
      apiClient.get('/api/achievements/achievement-stats'),
  },
};

// Type definitions
export interface RegisterData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  archetype: 'Allowance' | 'Jobber' | 'Traveler' | 'Saver';
  telegram_id?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TransactionFilters {
  skip?: number;
  limit?: number;
  state?: 'Pending' | 'Approved';
  type?: 'income' | 'expense';
}

export interface TransactionCreate {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  source?: 'SMS' | 'Manual' | 'Telegram';
}

export interface TransactionApprove {
  category?: string;
  description?: string;
}

export interface TransactionUpdate {
  amount?: number;
  category?: string;
  description?: string;
  state?: 'Pending' | 'Approved';
}

export interface BudgetCreate {
  type: 'Monthly' | 'Goal';
  name: string;
  target_amount: number;
  deadline?: string;
}

export interface BudgetUpdate {
  name?: string;
  target_amount?: number;
  deadline?: string;
  is_active?: boolean;
}

// New categorization interfaces
export interface CategorySuggestionRequest {
  description: string;
  amount: number;
  transaction_type?: 'income' | 'expense';
  timestamp?: string;
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
  confidence_level: string;
  reasons: string[];
  explanation: string;
}

// New profile management interfaces
export interface UserProfileUpdate {
  full_name?: string;
  email?: string;
  telegram_id?: string;
  archetype?: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export default apiClient;