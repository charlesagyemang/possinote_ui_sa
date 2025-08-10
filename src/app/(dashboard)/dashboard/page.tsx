'use client';

import { useEffect } from 'react';
import { useUsageStore } from '@/stores/usageStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, DollarSign, TrendingUp, AlertTriangle, Users, MessageSquare, Key, BarChart3, ArrowRight, Zap, Target } from 'lucide-react';

interface UsageData {
  // Credit-based fields (new)
  credit_balance?: string | number;
  credit_usage_this_month?: string | number;
  credit_added_this_month?: string | number;
  net_credits_this_month?: string | number;
  can_send_sms?: boolean;
  can_send_email?: boolean;
  
  // Legacy fields (for backward compatibility)
  current_month_usage?: string | number;
  monthly_limit?: string | number;
  usage_percentage?: string | number;
  remaining_quota?: string | number;
  can_send_notifications?: boolean;
  month?: string;
  breakdown?: {
    sms?: string | number;
    email?: string | number;
  };
  credit_breakdown?: {
    sms_usage?: string | number;
    email_usage?: string | number;
    top_up?: string | number;
    refund?: string | number;
    migration_credit?: string | number;
  };
}

export default function DashboardPage() {
  const { currentUsage, fetchCurrentUsage, isLoading } = useUsageStore();

  useEffect(() => {
    // Add a small delay to prevent rapid API calls
    const timer = setTimeout(() => {
      fetchCurrentUsage();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [fetchCurrentUsage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const usage = currentUsage as UsageData | null;
  const usageData = usage as UsageData | null;

  // Debug logging for account status
  console.log('🔍 Dashboard Usage Data:', usage);
  console.log('🔍 Usage Data:', usageData);
  console.log('🔍 can_send_sms:', usageData?.can_send_sms, 'type:', typeof usageData?.can_send_sms);
  console.log('🔍 can_send_email:', usageData?.can_send_email, 'type:', typeof usageData?.can_send_email);
  console.log('🔍 can_send_notifications:', usageData?.can_send_notifications, 'type:', typeof usageData?.can_send_notifications);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Monitor your usage and account status</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Credit Balance */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center justify-between">
                <span>Credit Balance</span>
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-400 mb-3">
                {parseFloat(String(usageData?.credit_balance || '0')).toLocaleString()}
              </div>
              <p className="text-sm text-gray-400">
                Available credits
              </p>
            </CardContent>
          </Card>

          {/* Monthly Usage */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center justify-between">
                <span>Monthly Usage</span>
                <div className="p-2 bg-red-500/20 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-red-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-red-400 mb-3">
                {parseFloat(String(usageData?.credit_usage_this_month || '0')).toLocaleString()}
              </div>
              <p className="text-sm text-gray-400">
                Credits used this month
              </p>
            </CardContent>
          </Card>

          {/* Credits Added */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center justify-between">
                <span>Credits Added</span>
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Activity className="h-5 w-5 text-blue-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-400 mb-3">
                {parseFloat(String(usageData?.credit_added_this_month || '0')).toLocaleString()}
              </div>
              <p className="text-sm text-gray-400">
                Top-ups this month
              </p>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center justify-between">
                <span>Account Status</span>
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Badge 
                  variant={Boolean(usageData?.can_send_sms) || Boolean(usageData?.can_send_notifications) ? "default" : "destructive"}
                  className={`text-sm px-3 py-1 rounded-xl ${
                    Boolean(usageData?.can_send_sms) || Boolean(usageData?.can_send_notifications)
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                      : 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                  }`}
                >
                  {Boolean(usageData?.can_send_sms) || Boolean(usageData?.can_send_notifications) ? 'Active' : 'Limited'}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">
                SMS: {Boolean(usageData?.can_send_sms) ? '✓' : '✗'} | Email: {Boolean(usageData?.can_send_email) ? '✓' : '✗'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-white/10">
              <CardTitle className="text-white text-xl flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
                <span>SMS Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-3">
                {parseFloat(String(usageData?.credit_breakdown?.sms_usage || usageData?.breakdown?.sms || '0')).toFixed(2)} credits
              </div>
              <p className="text-sm text-gray-400">
                SMS credits used this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
              <CardTitle className="text-white text-xl flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <span>Email Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-3">
                {parseFloat(String(usageData?.credit_breakdown?.email_usage || usageData?.breakdown?.email || '0')).toFixed(2)} credits
              </div>
              <p className="text-sm text-gray-400">
                Email credits used this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/10">
            <CardTitle className="text-white text-2xl flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a 
                href="/sms" 
                className="group p-6 border border-white/10 rounded-2xl hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 hover:border-blue-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-blue-400" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="text-white font-medium text-lg mb-2">Send SMS</div>
                <div className="text-sm text-gray-400">Test your SMS integration</div>
              </a>
              
              <a 
                href="/api-keys" 
                className="group p-6 border border-white/10 rounded-2xl hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 transition-all duration-300 hover:border-green-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl">
                    <Key className="h-6 w-6 text-green-400" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-400 transition-colors" />
                </div>
                <div className="text-white font-medium text-lg mb-2">Manage API Keys</div>
                <div className="text-sm text-gray-400">View and manage your keys</div>
              </a>
              
              <a 
                href="/usage" 
                className="group p-6 border border-white/10 rounded-2xl hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 transition-all duration-300 hover:border-purple-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                </div>
                <div className="text-white font-medium text-lg mb-2">View Analytics</div>
                <div className="text-sm text-gray-400">Detailed usage reports</div>
              </a>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
} 