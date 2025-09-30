import { api } from '../api';
import { 
  CreditBalance, 
  TopUpData, 
  BulkTopUpData, 
  BulkTopUpResponse, 
  ConvertCreditsData,
  ConvertCreditsResponse,
  ConversionPreviewResponse,
  CreditHistoryResponse 
} from '@/types';

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
    try {
      const response = await api.get('/credits/history', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async bulkTopUpCredits(data: BulkTopUpData): Promise<BulkTopUpResponse> {
    const response = await api.post('/credits/bulk-top-up', data);
    return response.data;
  }

  static async calculateConversion(fromType: 'sms' | 'email', toType: 'sms' | 'email', credits: number): Promise<ConversionPreviewResponse> {
    const response = await api.get('/credits/calculate-conversion', {
      params: { from_type: fromType, to_type: toType, credits }
    });
    return response.data;
  }

  static async convertCredits(data: ConvertCreditsData): Promise<ConvertCreditsResponse> {
    const response = await api.post('/credits/convert', data);
    return response.data;
  }
}