import { api } from '../api';
import { UsageHistoryParams } from '@/types';

export class UsageService {
  static async getCurrentUsage() {
    try {
      const response = await api.get('/usage/current');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getUsageHistory(params: UsageHistoryParams) {
    try {
      const response = await api.get('/usage/history', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}