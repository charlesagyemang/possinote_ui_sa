export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  api_key_prefix: string;
  status: 'active' | 'suspended' | 'inactive';
  plan_type: 'free' | 'starter' | 'business' | 'enterprise';
  monthly_limit: number;
  current_month_usage: number;
  usage_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  customer_id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  permissions: {
    sms: string[];
    email: string[];
    analytics: string[];
    api_keys: string[];
    senders: string[];
  };
}

export interface UsageData {
  current_month_usage: number;
  monthly_limit: number;
  usage_percentage: number;
  remaining_quota: number;
  can_send_notifications: boolean;
  month: string;
  breakdown: {
    sms: number;
    email: number;
  };
}

export interface SmsMessage {
  id: string;
  to: string;
  message: string;
  sender_id: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  cost: number;
  created_at: string;
}

export interface SendSmsData {
  to: string;
  message: string;
  sender_id: string;
}

export interface SendBulkSmsData {
  messages: Array<{
    to: string;
    message: string;
  }>;
  sender_id: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  company_name: string;
  password: string;
  password_confirmation: string;
}

export interface CreateApiKeyData {
  name: string;
  permissions?: {
    sms: string[];
    email: string[];
    analytics: string[];
    api_keys: string[];
    senders: string[];
  };
  expires_at?: string;
}

export interface SmsHistoryParams {
  page?: number;
  per_page?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  date_filter?: string;
  api_key_id?: string;
  min_cost?: number;
  max_cost?: number;
  sender_id?: string;
  phone?: string;
}

export interface UsageHistoryParams {
  start_date: string;
  end_date: string;
  page?: number;
  per_page?: number;
} 