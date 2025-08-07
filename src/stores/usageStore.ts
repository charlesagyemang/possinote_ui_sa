import { create } from 'zustand';
import { UsageService } from '@/lib/services/usage';
import { UsageData } from '@/types';

interface UsageState {
  currentUsage: UsageData | null;
  usageHistory: any[];
  isLoading: boolean;
  fetchCurrentUsage: () => Promise<void>;
  fetchUsageHistory: (params: any) => Promise<void>;
}

export const useUsageStore = create<UsageState>((set, get) => ({
  currentUsage: null,
  usageHistory: [],
  isLoading: false,
  fetchCurrentUsage: async () => {
    set({ isLoading: true });
    try {
      const response = await UsageService.getCurrentUsage();
      set({ currentUsage: response.data });
    } catch (error: any) {
      console.error('Failed to fetch current usage:', error);
      
      if (error.response?.status === 429) {
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
  fetchUsageHistory: async (params) => {
    set({ isLoading: true });
    try {
      const response = await UsageService.getUsageHistory(params);
      set({ usageHistory: response.data.records || [] });
    } catch (error) {
      console.error('Failed to fetch usage history:', error);
    } finally {
      set({ isLoading: false });
    }
  },
})); 