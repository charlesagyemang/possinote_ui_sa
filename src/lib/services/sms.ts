import { api } from '../api';
import { SendSmsData, SendBulkSmsData, SmsHistoryParams } from '@/types';

export class SmsService {
  static async sendSms(data: SendSmsData) {
    // Try the format from your original snippet
    const requestData = {
      sms: {
        to: data.to,
        message: data.message,
        sender_id: data.sender_id
      }
    };
    
    console.log('Sending SMS request:', requestData);
    console.log('API base URL:', api.defaults.baseURL);
    console.log('Full URL:', `${api.defaults.baseURL}/sms/send`);
    
    const response = await api.post('/sms/send', requestData);
    return response.data;
  }

  static async sendBulkSms(data: SendBulkSmsData) {
    const requestData = {
      bulk_sms: {
        messages: data.messages,
        sender_id: data.sender_id
      }
    };
    
    console.log('Sending bulk SMS request:', requestData);
    console.log('API base URL:', api.defaults.baseURL);
    console.log('Full URL:', `${api.defaults.baseURL}/sms/bulk`);
    
    const response = await api.post('/sms/bulk', requestData);
    return response.data;
  }

  static async getSmsHistory(params?: SmsHistoryParams) {
    console.log('SmsService.getSmsHistory called with params:', params);
    console.log('Full API URL with params:', `/sms`, params);
    const response = await api.get('/sms', { params });
    console.log('SmsService response:', response);
    return response.data;
  }

  static async getSmsStatus(id: string) {
    const response = await api.get(`/sms/${id}`);
    return response.data;
  }
} 