import { api } from '../api';

export interface ScheduledEmail {
  id: string;
  recipient: string;
  subject: string;
  content: string;
  sender_name?: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  cost: number;
  batch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledEmailFilters {
  page?: number;
  per_page?: number;
  status?: string;
  recipient?: string;
  subject?: string;
  sender_name?: string;
  batch_id?: string;
  start_date?: string;
  end_date?: string;
  date_filter?: string;
}

export interface ScheduledEmailResponse {
  success: boolean;
  data: {
    scheduled_emails: ScheduledEmail[];
    pagination: {
      current_page: number;
      per_page: number;
      total_count: number;
      total_pages: number;
    };
    filters?: Record<string, unknown>;
    available_filters?: {
      status: string[];
      date_filters: string[];
    };
  };
  error?: string;
}

export interface SingleScheduledEmailResponse {
  success: boolean;
  data: ScheduledEmail;
  error?: string;
}

export interface ScheduleEmailRequest {
  scheduled_email: {
    recipient: string;
    subject: string;
    content: string;
    sender_name?: string;
    scheduled_at: string;
  };
}

export interface ScheduleBulkEmailRequest {
  bulk_scheduled_email: {
    subject: string;
    content: string;
    sender_name?: string;
    scheduled_at: string;
    recipients: string[];
  };
}

export interface ScheduleMultipleEmailsRequest {
  emails: Array<{
    recipient: string;
    subject: string;
    content: string;
    sender_name?: string;
    scheduled_at: string;
  }>;
}

export interface ScheduleBulkEmailResponse {
  success: boolean;
  data: {
    batch_id: string;
    total_scheduled: number;
    total_cost: number;
    scheduled_emails: Array<{
      id: string;
      recipient: string;
      status: string;
    }>;
  };
  error?: string;
}

export interface ScheduleMultipleEmailsResponse {
  success: boolean;
  data: {
    batch_id: string;
    total_scheduled: number;
    total_cost: number;
    scheduled_emails: Array<{
      id: string;
      recipient: string;
      subject: string;
      scheduled_at: string;
      status: string;
    }>;
  };
  error?: string;
}

export interface CancelEmailResponse {
  success: boolean;
  data: {
    message: string;
    refunded_credits: number;
  };
  error?: string;
}

// SMS Scheduling Interfaces
export interface ScheduledSMS {
  id: string;
  recipient: string;
  message: string;
  sender_id: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  cost: number;
  batch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledSMSFilters {
  page?: number;
  per_page?: number;
  status?: string;
  recipient?: string;
  sender_id?: string;
  batch_id?: string;
  start_date?: string;
  end_date?: string;
  date_filter?: string;
}

export interface ScheduledSMSResponse {
  success: boolean;
  data: {
    scheduled_messages: ScheduledSMS[];
    pagination: {
      current_page: number;
      per_page: number;
      total_count: number;
      total_pages: number;
    };
    filters?: Record<string, unknown>;
    available_filters?: {
      status: string[];
      date_filters: string[];
    };
  };
  error?: string;
}

export interface SingleScheduledSMSResponse {
  success: boolean;
  data: ScheduledSMS;
  error?: string;
}

export interface ScheduleSMSRequest {
  scheduled_sms: {
    recipient: string;
    message: string;
    sender_id: string;
    scheduled_at: string;
  };
}

export interface BulkScheduledSMS {
  sender_id: string;
  scheduled_at: string;
  messages: Array<{
    recipient: string;
    message: string;
  }>;
}

export interface ScheduleBulkSMSRequest {
  bulk_scheduled_sms: {
    sender_id: string;
    scheduled_at: string;
    messages: Array<{
      recipient: string;
      message: string;
    }>;
  };
}

export interface ScheduleBulkSMSResponse {
  success: boolean;
  data: {
    batch_id: string;
    total_scheduled: number;
    total_cost: number;
    scheduled_messages: Array<{
      id: string;
      recipient: string;
      status: string;
    }>;
  };
  error?: string;
}

export interface CancelSMSResponse {
  success: boolean;
  data: {
    message: string;
    refunded_credits: number;
  };
  error?: string;
}

export class SchedulingService {
  /**
   * Get all scheduled emails with optional filters
   */
  static async getScheduledEmails(filters?: ScheduledEmailFilters): Promise<ScheduledEmailResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }

      const response = await api.get(`/schedules/emails?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to fetch scheduled emails:', error);
      throw error;
    }
  }

  /**
   * Get a single scheduled email by ID
   */
  static async getScheduledEmail(id: string): Promise<SingleScheduledEmailResponse> {
    try {
      const response = await api.get(`/schedules/emails/${id}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to fetch scheduled email:', error);
      throw error;
    }
  }

  /**
   * Schedule a single email
   */
  static async scheduleEmail(request: ScheduleEmailRequest): Promise<SingleScheduledEmailResponse> {
    try {
      const response = await api.post('/emails/schedule', request);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to schedule email:', error);
      throw error;
    }
  }

  /**
   * Schedule bulk emails
   */
  static async scheduleBulkEmails(request: ScheduleBulkEmailRequest): Promise<ScheduleBulkEmailResponse> {
    try {
      const response = await api.post('/emails/schedule-bulk', request);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to schedule bulk emails:', error);
      throw error;
    }
  }

  /**
   * Schedule multiple individual emails (like bulk email endpoint)
   */
  static async scheduleMultipleEmails(request: ScheduleMultipleEmailsRequest): Promise<ScheduleMultipleEmailsResponse> {
    try {
      const response = await api.post('/emails/schedule-bulk-individual', request);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to schedule multiple emails:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled email
   */
  static async cancelScheduledEmail(id: string): Promise<CancelEmailResponse> {
    try {
      const response = await api.delete(`/schedules/emails/${id}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to cancel scheduled email:', error);
      throw error;
    }
  }

  /**
   * Get available filters for scheduled emails
   */
  static async getAvailableFilters(): Promise<{
    status: string[];
    date_filters: string[];
  }> {
    try {
      const response = await api.get('/schedules/emails?per_page=1');
      return response.data.data.available_filters || {
        status: ['pending', 'sent', 'failed', 'cancelled'],
        date_filters: ['today', 'yesterday', 'this_week', 'this_month']
      };
    } catch (error: unknown) {
      console.error('Failed to fetch available filters:', error);
      // Return default filters if API call fails
      return {
        status: ['pending', 'sent', 'failed', 'cancelled'],
        date_filters: ['today', 'yesterday', 'this_week', 'this_month']
      };
    }
  }

  // SMS Scheduling Methods

  /**
   * Get all scheduled SMS with optional filters
   */
  static async getScheduledSMS(filters?: ScheduledSMSFilters): Promise<ScheduledSMSResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }

      const response = await api.get(`/schedules/sms?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to fetch scheduled SMS:', error);
      throw error;
    }
  }

  /**
   * Get a single scheduled SMS by ID
   */
  static async getScheduledSMSById(id: string): Promise<SingleScheduledSMSResponse> {
    try {
      const response = await api.get(`/schedules/sms/${id}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to fetch scheduled SMS:', error);
      throw error;
    }
  }

  /**
   * Schedule a single SMS
   */
  static async scheduleSMS(request: ScheduleSMSRequest): Promise<SingleScheduledSMSResponse> {
    try {
      const response = await api.post('/sms/schedule', request);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to schedule SMS:', error);
      throw error;
    }
  }

  /**
   * Schedule bulk SMS
   */
  static async scheduleBulkSMS(request: ScheduleBulkSMSRequest): Promise<ScheduleBulkSMSResponse> {
    try {
      const response = await api.post('/sms/schedule-bulk', request);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to schedule bulk SMS:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled SMS
   */
  static async cancelScheduledSMS(id: string): Promise<CancelSMSResponse> {
    try {
      const response = await api.delete(`/schedules/sms/${id}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to cancel scheduled SMS:', error);
      throw error;
    }
  }
}
