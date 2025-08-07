import axios from 'axios';

// Use the environment variables directly since they already include the full path
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2025/api/v1';
const ADMIN_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL || 'http://localhost:2025/admin/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const adminApi = axios.create({
  baseURL: ADMIN_BASE_URL,
  timeout: 10000,
});

// Request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('api_token') || localStorage.getItem('api_key');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('api_token');
      localStorage.removeItem('api_key');
      window.location.href = '/login';
    }
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please wait before making more requests.');
      // You could show a toast notification here
    }
    
    return Promise.reject(error);
  }
); 