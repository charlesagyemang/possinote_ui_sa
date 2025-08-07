import { create } from 'zustand';
import { UsageService } from '@/lib/services/usage';

interface UsageHistoryParams {
  start_date: string;
  end_date: string;
  page?: number;
  per_page?: number;
}

interface UsageData {
  current_usage?: unknown;
  usage_history?: unknown[];
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
      
      if (error instanceof Error && error.message.includes('429')) {
        // Wait 2 seconds and retry once
        setTimeout(async () => {
          try {
            const retryResponse = await UsageService.getCurrentUsage();
            set({ currentUsage: retryResponse.data });
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }, 2000);
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
    } finally {
      set({ isLoading: false });
    }
  },
})); 