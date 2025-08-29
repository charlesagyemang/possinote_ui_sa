import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer } from '@/types';

interface AuthState {
  user: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: Customer) => void;
  logout: () => void;
  updateUser: (user: Customer) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => {
        localStorage.setItem('api_token', token);
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        // Clear all localStorage items
        localStorage.removeItem('api_token');
        localStorage.removeItem('api_key');
        localStorage.removeItem('conversion_rates');
        localStorage.removeItem('local_conversions');
        localStorage.removeItem('user_email');
        localStorage.removeItem('payment_required');
        localStorage.removeItem('payment_required_timestamp');
        localStorage.removeItem('rate_limit_info');
        localStorage.removeItem('auth-storage');
        
        set({ token: null, user: null, isAuthenticated: false });
      },
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
); 