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

    try {
      const response = await api.post('/emails/send', payload);
      return response.data;
    } catch (error: unknown) {
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

    try {
      const response = await api.post('/emails/bulk', payload);
      return response.data;
    } catch (error: unknown) {
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

    try {
      const response = await api.post('/emails/send-bulk-individual', payload);
      return response.data;
    } catch (error: unknown) {
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

    try {
      const response = await api.post('/emails/validate', payload);
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }

  static async getEmailHistory(params?: EmailHistoryParams): Promise<EmailHistoryResponse> {
    try {
      const response = await api.get('/emails', { params });
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }
}