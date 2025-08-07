'use client';

import { useEffect } from 'react';
import { useUsageStore } from '@/stores/usageStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, DollarSign, TrendingUp, AlertTriangle, Users, MessageSquare, Key, BarChart3, ArrowRight, Zap, Target, CheckCircle } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
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
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center justify-between">
                <span>Current Usage</span>
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-3">
                ₵{parseFloat(currentUsage?.current_month_usage || 0).toFixed(2)}
              </div>
              <Progress 
                value={currentUsage?.usage_percentage || 0} 
                className="h-2 bg-white/10 mb-3"
              />
              <p className="text-sm text-gray-400">
                {parseFloat(currentUsage?.usage_percentage || 0).toFixed(2)}% of monthly limit
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center justify-between">
                <span>Monthly Limit</span>
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-3">
                ₵{parseFloat(currentUsage?.monthly_limit || 0).toFixed(2)}
              </div>
              <p className="text-sm text-gray-400">
                Your monthly spending limit
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center justify-between">
                <span>Remaining Quota</span>
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Activity className="h-5 w-5 text-purple-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-3">
                ₵{parseFloat(currentUsage?.remaining_quota || 0).toFixed(2)}
              </div>
              <p className="text-sm text-gray-400">
                Available for this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center justify-between">
                <span>Status</span>
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Badge 
                  variant={currentUsage?.can_send_notifications ? "default" : "destructive"}
                  className={`text-sm px-3 py-1 rounded-xl ${
                    currentUsage?.can_send_notifications 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                      : 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                  }`}
                >
                  {currentUsage?.can_send_notifications ? 'Active' : 'Limited'}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">
                {currentUsage?.can_send_notifications ? 'Can send notifications' : 'Usage limit reached'}
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
                ₵{parseFloat(currentUsage?.breakdown?.sms || 0).toFixed(2)}
              </div>
              <p className="text-sm text-gray-400">
                SMS notifications this month
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
                ₵{parseFloat(currentUsage?.breakdown?.email || 0).toFixed(2)}
              </div>
              <p className="text-sm text-gray-400">
                Email notifications this month
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

        {/* Account Status */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10">
            <CardTitle className="text-white text-2xl flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <CheckCircle className="h-6 w-6 text-amber-400" />
              </div>
              <span>Account Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-white font-medium text-lg">Current Month</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Month:</span>
                    <span className="text-white font-medium">{currentUsage?.month || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Usage:</span>
                    <span className="text-white font-medium">₵{parseFloat(currentUsage?.current_month_usage || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Percentage:</span>
                    <span className="text-white font-medium">{parseFloat(currentUsage?.usage_percentage || 0).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-white font-medium text-lg">Limits & Quota</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Monthly Limit:</span>
                    <span className="text-white font-medium">₵{parseFloat(currentUsage?.monthly_limit || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Remaining:</span>
                    <span className="text-white font-medium">₵{parseFloat(currentUsage?.remaining_quota || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <Badge 
                      variant={currentUsage?.can_send_notifications ? "default" : "destructive"}
                      className={currentUsage?.can_send_notifications ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-red-500/20 border-red-500/30 text-red-300"}
                    >
                      {currentUsage?.can_send_notifications ? 'Active' : 'Limited'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 