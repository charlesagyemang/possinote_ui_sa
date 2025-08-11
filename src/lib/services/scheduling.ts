import { api } from '@/lib/api';

export interface ScheduledSMS {
  id?: string;
  recipient: string;
  message: string;
  sender_id: string;
  scheduled_at: string;
  status?: 'pending' | 'sent' | 'failed' | 'cancelled';
  cost?: number;
  batch_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BulkScheduledSMS {
  sender_id: string;
  scheduled_at: string;
  messages: Array<{
    recipient: string;
    message: string;
  }>;
}

export interface ScheduledEmail {
  id?: string;
  recipient: string;
  subject: string;
  content: string;
  sender_name: string;
  scheduled_at: string;
  status?: 'pending' | 'sent' | 'failed' | 'cancelled';
  cost?: number;
  batch_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BulkScheduledEmail {
  subject: string;
  content: string;
  sender_name: string;
  scheduled_at: string;
  recipients: string[];
}

export interface SchedulingFilters {
  page?: number;
  per_page?: number;
  status?: 'pending' | 'sent' | 'failed' | 'cancelled';
  recipient?: string;
  sender_id?: string;
  sender_name?: string;
  subject?: string;
  batch_id?: string;
  start_date?: string;
  end_date?: string;
  date_filter?: 'today' | 'yesterday' | 'this_week' | 'this_month';
}

export interface SchedulingResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ScheduledMessagesResponse {
  scheduled_messages: ScheduledSMS[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
  filters: Partial<SchedulingFilters>;
  available_filters: {
    status: string[];
    date_filters: string[];
  };
}

export interface ScheduledEmailsResponse {
  scheduled_emails: ScheduledEmail[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
  filters: Partial<SchedulingFilters>;
  available_filters: {
    status: string[];
    date_filters: string[];
  };
}

export class SchedulingService {
  // SMS Scheduling
  static async scheduleSMS(scheduledSMS: ScheduledSMS): Promise<SchedulingResponse<ScheduledSMS>> {
    try {
      const response = await api.post('/sms/schedule', {
        scheduled_sms: scheduledSMS
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to schedule SMS');
    }
  }

  static async scheduleBulkSMS(bulkSMS: BulkScheduledSMS): Promise<SchedulingResponse<{ batch_id: string; scheduled_count: number; total_cost: number; scheduled_at: string; messages: Array<{ id: string; recipient: string; status: string }> }>> {
    try {
      const response = await api.post('/sms/schedule-bulk', {
        bulk_scheduled_sms: bulkSMS
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to schedule bulk SMS');
    }
  }

  static async getScheduledSMS(filters?: SchedulingFilters): Promise<SchedulingResponse<ScheduledMessagesResponse>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/schedules/sms?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to fetch scheduled SMS');
    }
  }

  static async getScheduledSMSById(id: string): Promise<SchedulingResponse<ScheduledSMS>> {
    try {
      const response = await api.get(`/schedules/sms/${id}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to fetch scheduled SMS');
    }
  }

  static async cancelScheduledSMS(id: string): Promise<SchedulingResponse<{ id: string; status: string; refunded_amount: number }>> {
    try {
      const response = await api.delete(`/schedules/sms/${id}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to cancel scheduled SMS');
    }
  }

  // Email Scheduling
  static async scheduleEmail(scheduledEmail: ScheduledEmail): Promise<SchedulingResponse<ScheduledEmail>> {
    try {
      const response = await api.post('/emails/schedule', {
        scheduled_email: scheduledEmail
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to schedule email');
    }
  }

  static async scheduleBulkEmail(bulkEmail: BulkScheduledEmail): Promise<SchedulingResponse<{ batch_id: string; scheduled_count: number; total_count: number; total_cost: number; scheduled_at: string; emails: Array<{ id: string; recipient: string; status: string }> }>> {
    try {
      const response = await api.post('/emails/schedule-bulk', {
        bulk_scheduled_email: bulkEmail
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to schedule bulk email');
    }
  }

  static async getScheduledEmails(filters?: SchedulingFilters): Promise<SchedulingResponse<ScheduledEmailsResponse>> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/schedules/emails?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to fetch scheduled emails');
    }
  }

  static async getScheduledEmailById(id: string): Promise<SchedulingResponse<ScheduledEmail>> {
    try {
      const response = await api.get(`/schedules/emails/${id}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to fetch scheduled email');
    }
  }

  static async cancelScheduledEmail(id: string): Promise<SchedulingResponse<{ id: string; status: string; refunded_amount: number }>> {
    try {
      const response = await api.delete(`/schedules/emails/${id}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to cancel scheduled email');
    }
  }
}
