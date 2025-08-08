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
    
    // Handle payment required (402)
    if (error.response?.status === 402) {
      console.warn('Payment required. Insufficient credits.');
      // Store the 402 error state
      localStorage.setItem('payment_required', 'true');
      localStorage.setItem('payment_required_timestamp', Date.now().toString());
      
      // Show payment required modal/notification
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('payment-required', {
          detail: {
            message: error.response?.data?.message || 'Insufficient credits. Please reload your account.',
            redirectUrl: error.response?.data?.redirect_url || '/billing'
          }
        }));
      }
    }
    
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please wait before making more requests.');
      
      // Store rate limit info
      const retryAfter = error.response.headers['retry-after'] || 60;
      const rateLimitInfo = {
        retryAfter: parseInt(retryAfter.toString()),
        timestamp: Date.now(),
        message: error.response?.data?.message || 'Too many requests. Please wait before trying again.'
      };
      
      localStorage.setItem('rate_limit_info', JSON.stringify(rateLimitInfo));
      
      // Dispatch rate limit event for global handling
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rate-limit-exceeded', {
          detail: rateLimitInfo
        }));
      }
    }
    
    return Promise.reject(error);
  }
); 