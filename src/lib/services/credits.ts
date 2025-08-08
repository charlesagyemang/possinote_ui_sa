import { api } from '../api';
import { CreditBalance, TopUpData, CreditHistoryResponse } from '@/types';

export class CreditService {
  static async getCreditBalance(): Promise<{ success: boolean; data: CreditBalance }> {
    const response = await api.get('/credits/balance');
    return response.data;
  }

  static async topUpCredits(data: TopUpData): Promise<{ success: boolean; data: { message: string; new_balance: number; transaction_id: string } }> {
    const response = await api.post('/credits/top-up', data);
    return response.data;
  }

  static async getCreditHistory(params: { page?: number; per_page?: number } = {}): Promise<CreditHistoryResponse> {
    const response = await api.get('/credits/history', { params });
    return response.data;
  }
}
