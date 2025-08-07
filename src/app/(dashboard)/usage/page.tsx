'use client';

import { useEffect, useState } from 'react';
import { UsageService } from '@/lib/services/usage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { UsageData } from '@/types';
import { DollarSign, TrendingUp, Activity, Calendar, BarChart3, Target, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function UsagePage() {
  const [currentUsage, setCurrentUsage] = useState<UsageData | null>(null);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching usage data...');
      
      const [currentResponse, historyResponse] = await Promise.all([
        UsageService.getCurrentUsage(),
        UsageService.getUsageHistory({
          start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
        })
      ]);

      console.log('Current usage response:', currentResponse);
      console.log('Usage history response:', historyResponse);

      setCurrentUsage(currentResponse.data);
      setUsageHistory(historyResponse.data.records || []);
      
      console.log('Processed current usage data:', currentResponse.data);
      console.log('Processed usage history data:', historyResponse.data.records || []);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const chartData = usageHistory.map(record => ({
    date: new Date(record.created_at).toLocaleDateString(),
    cost: parseFloat(record.cost || 0),
    requests: 1,
  }));

  const breakdownData = currentUsage?.breakdown ? [
    { name: 'SMS', value: parseFloat(currentUsage.breakdown.sms || 0), color: '#3B82F6' },
    { name: 'Email', value: parseFloat(currentUsage.breakdown.email || 0), color: '#10B981' },
  ] : [];

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
              Usage Analytics
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Monitor your API usage and costs</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center justify-between">
                <span>Current Month Usage</span>
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white mb-3">
                ₵{parseFloat(currentUsage?.current_month_usage || 0).toFixed(2)}
              </div>
              <div className="flex items-center space-x-2">
                <ArrowUpRight className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-400">
                  {parseFloat(currentUsage?.usage_percentage || 0).toFixed(2)}% of monthly limit
                </span>
              </div>
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
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-white/10">
              <CardTitle className="text-white text-xl flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
                <span>Usage Over Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(value) => `₵${typeof value === 'number' ? value.toFixed(2) : parseFloat(value || 0).toFixed(2)}`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        color: '#F9FAFB',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                      }}
                      formatter={(value: any) => [`₵${typeof value === 'number' ? value.toFixed(2) : parseFloat(value || 0).toFixed(2)}`, 'Cost']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-gray-500/20 rounded-2xl w-fit mx-auto">
                      <Calendar className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-400">No usage data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
              <CardTitle className="text-white text-xl flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <Target className="h-5 w-5 text-green-400" />
                </div>
                <span>Usage Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {breakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={breakdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(value) => `₵${typeof value === 'number' ? value.toFixed(2) : parseFloat(value || 0).toFixed(2)}`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        color: '#F9FAFB',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                      }}
                      formatter={(value: any) => [`₵${typeof value === 'number' ? value.toFixed(2) : parseFloat(value || 0).toFixed(2)}`, 'Cost']}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="url(#colorGradient)" 
                      radius={[8, 8, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#1D4ED8" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-gray-500/20 rounded-2xl w-fit mx-auto">
                      <Activity className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-400">No breakdown data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent API Calls */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10">
            <CardTitle className="text-white text-2xl flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <span>Recent API Calls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {usageHistory.length > 0 ? (
              <div className="space-y-4">
                {usageHistory.slice(0, 10).map((record) => (
                  <div key={record.id} className="border border-white/10 rounded-2xl p-4 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm hover:from-white/10 hover:to-white/15 transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="font-medium text-white">{record.endpoint || 'API Call'}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(record.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-medium text-white">₵{parseFloat(record.cost || 0).toFixed(4)}</p>
                        <div className="flex items-center space-x-2 text-sm">
                          <Badge 
                            variant={record.response_code >= 200 && record.response_code < 300 ? "default" : "destructive"}
                            className={`text-xs px-2 py-1 rounded-lg ${
                              record.response_code >= 200 && record.response_code < 300 
                                ? 'bg-green-500/20 border-green-500/30 text-green-300' 
                                : 'bg-red-500/20 border-red-500/30 text-red-300'
                            }`}
                          >
                            {record.response_code}
                          </Badge>
                          <span className="text-gray-400">{record.response_time}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-gray-500/20 rounded-2xl w-fit mx-auto">
                    <Activity className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400">No recent API calls</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 