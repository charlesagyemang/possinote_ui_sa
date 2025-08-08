import { create } from 'zustand';
import { UsageService } from '@/lib/services/usage';

interface UsageHistoryParams {
  start_date: string;
  end_date: string;
  page?: number;
  per_page?: number;
}



export const useUsageStore = create<{
  currentUsage: unknown | null;
  usageHistory: unknown[];
  isLoading: boolean;
  fetchCurrentUsage: () => Promise<void>;
  fetchUsageHistory: (params: UsageHistoryParams) => Promise<void>;
}>((set) => ({
  currentUsage: null,
  usageHistory: [],
  isLoading: false,
  fetchCurrentUsage: async () => {
    set({ isLoading: true });
    try {
      const response = await UsageService.getCurrentUsage();
      set({ currentUsage: response.data });
    } catch (error: unknown) {
      console.error('Failed to fetch current usage:', error);
      
      // Check if it's a 429 error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 429) {
          // The API interceptor will handle the rate limit modal
          // We don't need to retry here as the user will see the modal
          console.log('Rate limit hit for usage fetch - modal will be shown');
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },
  fetchUsageHistory: async (params: UsageHistoryParams) => {
    set({ isLoading: true });
    try {
      const response = await UsageService.getUsageHistory(params);
      set({ usageHistory: response.data.records || [] });
    } catch (error: unknown) {
      console.error('Failed to fetch usage history:', error);
      
      // Check if it's a 429 error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 429) {
          // The API interceptor will handle the rate limit modal
          console.log('Rate limit hit for usage history fetch - modal will be shown');
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },
})); 