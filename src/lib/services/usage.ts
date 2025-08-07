import { api } from '../api';
import { UsageHistoryParams } from '@/types';

export class UsageService {
  static async getCurrentUsage() {
    console.log('Making API call to /usage/current');
    const response = await api.get('/usage/current');
    console.log('API response for /usage/current:', response);
    return response.data;
  }

  static async getUsageHistory(params: UsageHistoryParams) {
    console.log('Making API call to /usage/history with params:', params);
    const response = await api.get('/usage/history', { params });
    console.log('API response for /usage/history:', response);
    return response.data;
  }
} 