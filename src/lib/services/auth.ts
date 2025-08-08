import { api } from '../api';

interface LoginResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message: string;
}

interface TestConnectionResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface RegisterData {
  customer: {
    name: string;
    email: string;
    phone: string;
    company_name: string;
    plan_type: 'free' | 'starter' | 'business' | 'enterprise';
    monthly_limit: number;
  };
}

interface RegisterResponse {
  success: boolean;
  api_key?: string;
  customer?: unknown;
  initial_credits?: number;
  message?: string;
}

export class AuthService {
  static async loginWithApiKey(apiKey: string): Promise<LoginResponse> {
    // Store the API key
    localStorage.setItem('api_key', apiKey);
    localStorage.setItem('api_token', apiKey);
    
    // Test the connection
    try {
      const response = await api.get('/health');
      return {
        success: true,
        data: response.data,
        message: 'Login successful'
      };
    } catch (error: unknown) {
      // Remove invalid API key
      localStorage.removeItem('api_key');
      localStorage.removeItem('api_token');
      
      const errorMessage = error instanceof Error ? error.message : 'Invalid API key';
      return {
        success: false,
        error: errorMessage,
        message: 'Login failed'
      };
    }
  }

  static async testConnection(): Promise<TestConnectionResponse> {
    try {
      const response = await api.get('/health');
      return {
        success: true,
        data: response.data
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  static async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      const response = await api.post('/signup', data);
      return {
        success: true,
        api_key: response.data.api_key,
        customer: response.data.customer,
        initial_credits: response.data.initial_credits,
        message: 'Registration successful'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  static logout() {
    localStorage.removeItem('api_key');
    localStorage.removeItem('api_token');
    window.location.href = '/login';
  }

  static isAuthenticated(): boolean {
    const apiKey = localStorage.getItem('api_key') || localStorage.getItem('api_token');
    return !!apiKey;
  }
} 