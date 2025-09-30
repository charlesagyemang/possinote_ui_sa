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

export interface SmsMessage {
  message_id: string;
  to: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  created_at: string;
  cost: string;
  message?: string;
}

export interface Pagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

interface SmsResponse {
  success: boolean;
  data?: {
    messages?: SmsMessage[];
    pagination?: Pagination;
  };
  message?: string;
}

export class SmsService {
  static async sendSms(to: string, message: string, senderId?: string) {
    const payload = {
      sms: {
        to,
        message,
        sender_id: senderId
      }
    };

    const response = await api.post('/sms/send', payload);
    return response.data;
  }

  static async sendBulkSms(recipients: string[], message: string, senderId?: string) {
    const payload = {
      sms: {
        recipients,
        message,
        sender_id: senderId
      }
    };

    const response = await api.post('/sms/bulk', payload);
    return response.data;
  }

  static async sendPersonalizedBulkSms(messages: Array<{ to: string; message: string }>, senderId?: string) {
    const payload = {
      bulk_sms: {
        messages,
        sender_id: senderId
      }
    };

    const response = await api.post('/sms/bulk', payload);
    return response.data;
  }

  static async getSmsHistory(params?: SmsHistoryParams): Promise<SmsResponse> {
    try {
      const response = await api.get('/sms', { params });
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }
}