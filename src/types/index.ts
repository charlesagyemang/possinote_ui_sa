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
  credit_balance: number;
  credit_usage_this_month: number;
  credit_added_this_month: number;
  net_credits_this_month: number;
  can_send_sms: boolean;
  can_send_email: boolean;
  month: string;
  credit_breakdown: {
    sms_usage: number;
    email_usage: number;
    top_up: number;
    refund: number;
    migration_credit: number;
  };
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

export interface CreditBalance {
  credit_balance: number;
  usage_this_month: number;
  added_this_month: number;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: 'sms_usage' | 'email_usage' | 'top_up' | 'refund' | 'migration_credit';
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface TopUpData {
  amount: number;
}

export interface CreditHistoryResponse {
  success: boolean;
  data: {
    transactions: CreditTransaction[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
    };
  };
} 