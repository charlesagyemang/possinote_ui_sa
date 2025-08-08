import { api } from '../api';
import { UsageHistoryParams } from '@/types';

export class UsageService {
  static async getCurrentUsage() {
    const response = await api.get('/usage/current');
    return response.data;
  }

  static async getUsageHistory(params: UsageHistoryParams) {
    const response = await api.get('/usage/history', { params });
    return response.data;
  }
} 