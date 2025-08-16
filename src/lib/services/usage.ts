import { api } from '../api';
import { UsageHistoryParams } from '@/types';

export class UsageService {
  static async getCurrentUsage() {
    try {
      console.log('🌐 Fetching usage data from:', `${process.env.NEXT_PUBLIC_API_URL || 'https://notifyapi.possitech.net/api/v1'}/usage/current`);
      const response = await api.get('/usage/current');
      console.log('✅ Usage data fetched successfully');
      console.log('📊 Full /usage/current Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch usage data:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as { code?: string })?.code,
        status: (error as { response?: { status?: number } })?.response?.status,
        statusText: (error as { response?: { statusText?: string } })?.response?.statusText,
        url: (error as { config?: { url?: string } })?.config?.url,
        method: (error as { config?: { method?: string } })?.config?.method
      });
      throw error;
    }
  }

  static async getUsageHistory(params: UsageHistoryParams) {
    try {
      console.log('🌐 Fetching usage history from:', `${process.env.NEXT_PUBLIC_API_URL || 'https://notifyapi.possitech.net/api/v1'}/usage/history`);
      console.log('📤 Usage history params:', JSON.stringify(params, null, 2));
      const response = await api.get('/usage/history', { params });
      console.log('✅ Usage history fetched successfully');
      console.log('📊 Full /usage/history Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch usage history:', error);
      throw error;
    }
  }
} 