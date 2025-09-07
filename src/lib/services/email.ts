import { api } from '../api';



interface EmailResponse {
  success: boolean;
  message?: string;
  recipient?: string;
  message_id?: string;
  submitted_at?: string;
  error?: string;
}

interface BulkEmailResponse {
  success: boolean;
  message?: string;
  queued_count?: number;
  total_count?: number;
  batch_id?: string;
  sent_count?: number;
  failed_count?: number;
  job_id?: string;
  emails?: Array<{
    message_id: string;
    recipient: string;
    subject: string;
    status: string;
  }>;
  results?: Array<{
    email: string;
    success: boolean;
    message_id?: string;
    submitted_at?: string;
    error?: string;
  }>;
  error?: string;
}

interface EmailValidationResponse {
  valid_emails: string[];
  invalid_emails: string[];
  total_count: number;
  valid_count: number;
  invalid_count: number;
}

interface EmailHistoryParams {
  page?: number;
  per_page?: number;
  status?: string;
  email?: string;
  sender_name?: string;
  date_filter?: string;
  start_date?: string;
  end_date?: string;
  min_cost?: number;
  max_cost?: number;
}

export interface EmailHistoryRecord {
  message_id: string;
  recipient: string;
  subject: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  created_at: string;
  cost: string;
  api_key_name?: string;
  sender_name?: string;
}

interface EmailHistoryResponse {
  success: boolean;
  emails?: EmailHistoryRecord[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
  error?: string;
}

export class EmailService {
  static async sendEmail(recipient: string, subject: string, content: string, sender_name?: string): Promise<EmailResponse> {
    const payload = {
      recipient,
      subject,
      content,
      ...(sender_name && { sender_name })
    };

    // Log the full request details
    console.log('📧 EMAIL SEND REQUEST:');
    console.log('🔗 URL:', `${api.defaults.baseURL}/emails/send`);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('🔑 Auth Token:', localStorage.getItem('api_token') || localStorage.getItem('api_key') || 'No token found');
    console.log('📋 Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('api_token') || localStorage.getItem('api_key') || 'No token'}`
    });
    console.log('⏰ Timestamp:', new Date().toISOString());

    try {
      const response = await api.post('/emails/send', payload);
      console.log('✅ EMAIL SEND RESPONSE:');
      console.log('📊 Status:', response.status);
      console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('❌ EMAIL SEND ERROR:');
      console.error('Error object:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown; headers?: unknown } };
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
        console.error('Response headers:', axiosError.response?.headers);
      }
      throw error;
    }
  }

  static async sendBulkEmail(recipients: string[], subject: string, content: string, sender_name?: string): Promise<BulkEmailResponse> {
    const payload = {
      recipients,
      subject,
      content,
      ...(sender_name && { sender_name })
    };

    // Log the full request details
    console.log('📧 BULK EMAIL SEND REQUEST:');
    console.log('🔗 URL:', `${api.defaults.baseURL}/emails/bulk`);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('🔑 Auth Token:', localStorage.getItem('api_token') || localStorage.getItem('api_key') || 'No token found');
    console.log('📋 Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('api_token') || localStorage.getItem('api_key') || 'No token'}`
    });
    console.log('⏰ Timestamp:', new Date().toISOString());

    try {
      const response = await api.post('/emails/bulk', payload);
      console.log('✅ BULK EMAIL SEND RESPONSE:');
      console.log('📊 Status:', response.status);
      console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('❌ BULK EMAIL SEND ERROR:');
      console.error('Error object:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown; headers?: unknown } };
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
        console.error('Response headers:', axiosError.response?.headers);
      }
      throw error;
    }
  }

  static async sendBulkIndividualEmails(emails: Array<{ to: string; subject: string; html: string; sender_name?: string }>): Promise<BulkEmailResponse> {
    const payload = {
      emails: emails.map(email => ({
        recipient: email.to,
        subject: email.subject,
        content: email.html,
        ...(email.sender_name && { sender_name: email.sender_name })
      }))
    };

    // Log the full request details
    console.log('📧 BULK INDIVIDUAL EMAILS SEND REQUEST:');
    console.log('🔗 URL:', `${api.defaults.baseURL}/emails/send-bulk-individual`);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('🔑 Auth Token:', localStorage.getItem('api_token') || localStorage.getItem('api_key') || 'No token found');
    console.log('📋 Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('api_token') || localStorage.getItem('api_key') || 'No token'}`
    });
    console.log('⏰ Timestamp:', new Date().toISOString());

    try {
      const response = await api.post('/emails/send-bulk-individual', payload);
      console.log('✅ BULK INDIVIDUAL EMAILS SEND RESPONSE:');
      console.log('📊 Status:', response.status);
      console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('❌ BULK INDIVIDUAL EMAILS SEND ERROR:');
      console.error('Error object:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown; headers?: unknown } };
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
        console.error('Response headers:', axiosError.response?.headers);
      }
      throw error;
    }
  }

  static async sendBulkEmails(emails: Array<{ to: string; subject: string; html: string; sender_name?: string }>): Promise<BulkEmailResponse> {
    // Use the new bulk individual emails endpoint for better performance
    return this.sendBulkIndividualEmails(emails);
  }

  static async validateEmails(emails: string[]): Promise<EmailValidationResponse> {
    const payload = {
      emails
    };

    // Log the full request details
    console.log('📧 EMAIL VALIDATION REQUEST:');
    console.log('🔗 URL:', `${api.defaults.baseURL}/emails/validate`);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('🔑 Auth Token:', localStorage.getItem('api_token') || localStorage.getItem('api_key') || 'No token found');
    console.log('📋 Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('api_token') || localStorage.getItem('api_key') || 'No token'}`
    });
    console.log('⏰ Timestamp:', new Date().toISOString());

    try {
      const response = await api.post('/emails/validate', payload);
      console.log('✅ EMAIL VALIDATION RESPONSE:');
      console.log('📊 Status:', response.status);
      console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('❌ EMAIL VALIDATION ERROR:');
      console.error('Error object:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown; headers?: unknown } };
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
        console.error('Response headers:', axiosError.response?.headers);
      }
      throw error;
    }
  }

  static async getEmailHistory(params?: EmailHistoryParams): Promise<EmailHistoryResponse> {
    console.log('📧 EmailService.getEmailHistory called with params:', params);
    console.log('🔗 API base URL:', api.defaults.baseURL);
    console.log('🔗 Full URL will be:', `${api.defaults.baseURL}/emails`);
    console.log('🔗 Query parameters:', params);
    
    // Log the actual request being made
    const requestConfig = { params };
    console.log('🔗 Request config:', JSON.stringify(requestConfig, null, 2));
    
    try {
      const response = await api.get('/emails', { params });
      console.log('📧 EmailService response status:', response.status);
      console.log('📧 EmailService response data:', response.data);
      
      // Check if the response contains the expected data structure
      if (response.data && response.data.emails) {
        console.log('📧 Emails found:', response.data.emails.length);
        console.log('📧 First email status:', response.data.emails[0]?.status);
      } else {
        console.warn('📧 Unexpected response structure:', response.data);
      }
      
      return response.data;
    } catch (error: unknown) {
      console.error('📧 EmailService error:', error);
      if (error instanceof Error) {
        console.error('📧 Error message:', error.message);
      }
      throw error;
    }
  }
}
