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
        localStorage.removeItem('api_token');
        set({ token: null, user: null, isAuthenticated: false });
      },
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
); 