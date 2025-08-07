import { api } from '../api';

interface SmsHistoryParams {
  page?: number;
  per_page?: number;
  status?: string;
  date_filter?: string;
  start_date?: string;
  end_date?: string;
  api_key_id?: string;
  sender_id?: string;
  phone?: string;
  min_cost?: number;
  max_cost?: number;
}

interface SmsResponse {
  success: boolean;
  data?: {
    messages?: unknown[];
    pagination?: unknown;
  };
  message?: string;
}

export class SmsService {
  static async sendSms(to: string, message: string, senderId?: string) {
    const payload = {
      to,
      message,
      sender_id: senderId
    };

    const response = await api.post('/sms/send', payload);
    return response.data;
  }

  static async sendBulkSms(recipients: string[], message: string, senderId?: string) {
    const payload = {
      recipients,
      message,
      sender_id: senderId
    };

    const response = await api.post('/sms/bulk', payload);
    return response.data;
  }

  static async getSmsHistory(params?: SmsHistoryParams): Promise<SmsResponse> {
    console.log('🔍 SmsService.getSmsHistory called with params:', params);
    console.log('🔍 API base URL:', api.defaults.baseURL);
    console.log('🔍 Full URL will be:', `${api.defaults.baseURL}/sms`);
    console.log('🔍 Query parameters:', params);
    
    // Log the actual request being made
    const requestConfig = { params };
    console.log('🔍 Request config:', JSON.stringify(requestConfig, null, 2));
    
    try {
      const response = await api.get('/sms', { params });
      console.log('🔍 SmsService response status:', response.status);
      console.log('🔍 SmsService response data:', response.data);
      
      // Check if the response contains the expected data structure
      if (response.data && response.data.data && response.data.data.messages) {
        console.log('🔍 Messages found:', response.data.data.messages.length);
        console.log('🔍 First message status:', response.data.data.messages[0]?.status);
      } else {
        console.warn('🔍 Unexpected response structure:', response.data);
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('🔍 SmsService error:', error);
      if (error instanceof Error) {
        console.error('🔍 Error message:', error.message);
      }
      throw error;
    }
  }
} 