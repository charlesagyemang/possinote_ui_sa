import { api } from '../api';
import { Customer, RegisterData } from '@/types';

export interface SignupResponse {
  success: boolean;
  message: string;
  customer: Customer;
  api_key: string;
}

export interface SignupData extends RegisterData {
  plan_type: 'free' | 'starter' | 'business' | 'enterprise';
  monthly_limit: number;
}

export class AuthService {
  static async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  }

  static async register(userData: SignupData): Promise<SignupResponse> {
    const response = await api.post('/signup', {
      customer: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        company_name: userData.company_name,
        plan_type: userData.plan_type,
        monthly_limit: userData.monthly_limit
      }
    });
    
    // Store the API key in both locations for compatibility
    if (response.data.api_key) {
      localStorage.setItem('api_key', response.data.api_key);
      localStorage.setItem('api_token', response.data.api_key);
    }
    
    return response.data;
  }
} 