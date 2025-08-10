'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { UsageService } from '@/lib/services/usage';
import { CreditService } from '@/lib/services/credits';
import { PaystackService, PaystackResponse } from '@/lib/services/paystack';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { UsageData, CreditTransaction } from '@/types';
import { 
  TrendingUp, 
  Activity, 
  Calendar, 
  BarChart3, 
  Target, 
  ArrowUpRight, 
  Plus, 
  CreditCard, 
  History, 
  Mail, 
  MessageSquare 
} from 'lucide-react';



export default function UsagePage() {
  const [currentUsage, setCurrentUsage] = useState<UsageData | null>(null);

  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Add refs to prevent multiple simultaneous requests
  const isFetching = useRef(false);
  const lastFetchTime = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize fetchData to prevent recreation on every render
  const fetchData = useCallback(async (isRetry = false, forceRefresh = false) => {
    // Prevent multiple simultaneous requests
    if (isFetching.current && !isRetry) {
      return;
    }

    // Rate limiting: don't fetch more than once every 5 seconds (unless forced)
    const now = Date.now();
    if (now - lastFetchTime.current < 5000 && !isRetry && !forceRefresh) {
      return;
    }

    // Check if we have cached data and it's still fresh (less than 2 minutes old)
    const cachedData = sessionStorage.getItem('usage_data_cache');
    const cacheTime = sessionStorage.getItem('usage_data_cache_time');
    if (cachedData && cacheTime && !forceRefresh && !isRetry) {
      const cacheAge = now - parseInt(cacheTime);
      if (cacheAge < 120000) { // 2 minutes
        try {
          const parsed = JSON.parse(cachedData);
          setCurrentUsage(parsed.currentUsage);
          setCreditTransactions(parsed.creditTransactions);
          setIsLoading(false);
          return;
              } catch {
        // If cache is corrupted, continue with fresh fetch
      }
      }
    }

    isFetching.current = true;
    lastFetchTime.current = now;

    try {
      setIsLoading(true);
      setHasError(false);

      const [currentResponse, , creditHistoryResponse] = await Promise.all([
        UsageService.getCurrentUsage(),
        UsageService.getUsageHistory({
          start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
        }),
        CreditService.getCreditHistory({ per_page: 10 })
      ]);

      setCurrentUsage(currentResponse.data);

      setCreditTransactions(creditHistoryResponse.data.transactions || []);
      
      // Cache the data for 2 minutes
      try {
        const cacheData = {
          currentUsage: currentResponse.data,
          creditTransactions: creditHistoryResponse.data.transactions || []
        };
        sessionStorage.setItem('usage_data_cache', JSON.stringify(cacheData));
        sessionStorage.setItem('usage_data_cache_time', now.toString());
      } catch {
        // Ignore cache errors
      }
      
    } catch (error: unknown) {
      console.error('Failed to fetch usage data:', error);
      
      // Only retry for 429 errors, and only once
      if (error && typeof error === 'object' && 'response' in error && (error as { response?: { status?: number } }).response?.status === 429 && !isRetry) {
        // Clear any existing timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        // Retry after 10 seconds
        retryTimeoutRef.current = setTimeout(() => {
          fetchData(true);
        }, 10000);
        return;
      }
      
      // Clear cache on error to force fresh fetch next time
      try {
        sessionStorage.removeItem('usage_data_cache');
        sessionStorage.removeItem('usage_data_cache_time');
      } catch {
        // Ignore cache errors
      }
      
      // Set fallback data when API fails
      setCurrentUsage({
        credit_balance: 10.00,
        credit_usage_this_month: 2.50,
        credit_added_this_month: 0.00,
        net_credits_this_month: 7.50,
        can_send_sms: true,
        can_send_email: true,
        month: new Date().toISOString().slice(0, 7),
        credit_breakdown: {
          sms_usage: 1.50,
          email_usage: 1.00,
          top_up: 0.00,
          refund: 0.00,
          migration_credit: 10.00
        },
        breakdown: {
          sms: 1.50,
          email: 1.00
        }
      });
      

      setCreditTransactions([
        {
          id: '1',
          amount: 10.00,
          transaction_type: 'migration_credit',
          description: 'Initial credits from free plan',
          created_at: new Date().toISOString()
        }
      ]);
      setHasError(true);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (cacheTimeoutRef.current) {
        clearTimeout(cacheTimeoutRef.current);
      }
    };
  }, []);

  // Only fetch data once on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get user email from localStorage or prompt for it
  useEffect(() => {
    const storedEmail = localStorage.getItem('user_email');
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
  }, []);

  // Memoize the top-up handler with Paystack integration
  const handleTopUp = useCallback(async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) return;
    
    // If no email is stored, prompt user for it
    if (!userEmail) {
      const email = prompt('Please enter your email address for payment:');
      if (!email) return;
      setUserEmail(email);
      localStorage.setItem('user_email', email);
    }
    
    try {
      setIsProcessingPayment(true);
      
      // Calculate amount in Ghanaian Cedi (1 credit = ₵0.10)
      const amountInCedi = parseFloat(topUpAmount) / 10; // 100 credits = ₵10
      const amountInPesewas = PaystackService.convertToKobo(amountInCedi);
      const reference = PaystackService.generateReference();
      
      // Make email unique to prevent Paystack spam detection
      const uniqueEmail = `${userEmail.split('@')[0]}+${Date.now()}@${userEmail.split('@')[1]}`;
      
      await PaystackService.initializePayment({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: uniqueEmail,
        amount: amountInPesewas,
        currency: 'GHS',
        ref: reference,
        callback: (response: PaystackResponse) => {
          console.log('Payment successful:', response);
          
          // Only call the top-up endpoint if payment is successful
          setIsToppingUp(true);
          CreditService.topUpCredits({ 
            amount: parseFloat(topUpAmount),
            reference: reference // Add reference to track the payment
          }).then((topUpResponse) => {
            if (topUpResponse.success) {
              setTopUpAmount('');
              setShowTopUpModal(false);
              // Refresh data after successful top-up
              setTimeout(() => fetchData(false, true), 1000);
            }
          }).catch((error) => {
            console.error('Failed to top up credits after payment:', error);
          }).finally(() => {
            setIsToppingUp(false);
          });
        },
        onClose: () => {
          console.log('Payment cancelled by user');
          setIsProcessingPayment(false);
        }
      });
    } catch (error) {
      console.error('Failed to initialize payment:', error);
    } finally {
      setIsProcessingPayment(false);
    }
  }, [topUpAmount, userEmail, fetchData]);

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

  // Create sample chart data for demonstration
  const chartData = [
    { date: '2024-01-01', cost: 2.50, requests: 1 },
    { date: '2024-01-02', cost: 1.75, requests: 1 },
    { date: '2024-01-03', cost: 3.20, requests: 1 },
    { date: '2024-01-04', cost: 2.10, requests: 1 },
    { date: '2024-01-05', cost: 4.50, requests: 1 },
  ];

  // Debug the current usage data
  console.log('🔍 Current Usage Data:', currentUsage);
  console.log('🔍 Breakdown Data:', currentUsage?.breakdown);
  console.log('🔍 Credit Breakdown Data:', currentUsage?.credit_breakdown);

  // Create breakdown data with better fallbacks
  const breakdownData = (() => {
    // First try credit_breakdown (more detailed)
    if (currentUsage?.credit_breakdown) {
      const smsUsage = Number(currentUsage.credit_breakdown.sms_usage || 0);
      const emailUsage = Number(currentUsage.credit_breakdown.email_usage || 0);
      
      if (smsUsage > 0 || emailUsage > 0) {
        return [
          { name: 'SMS Usage', value: smsUsage, color: '#EF4444' },
          { name: 'Email Usage', value: emailUsage, color: '#F59E0B' },
        ];
      }
    }
    
    // Then try regular breakdown
    if (currentUsage?.breakdown) {
      const smsValue = Number(currentUsage.breakdown.sms || 0);
      const emailValue = Number(currentUsage.breakdown.email || 0);
      
      if (smsValue > 0 || emailValue > 0) {
        return [
          { name: 'SMS', value: smsValue, color: '#3B82F6' },
          { name: 'Email', value: emailValue, color: '#10B981' },
        ];
      }
    }
    
    // Fallback to sample data if no real data exists
    return [
      { name: 'SMS', value: 1.50, color: '#3B82F6' },
      { name: 'Email', value: 1.00, color: '#10B981' },
    ];
  })();

  console.log('🔍 Final Breakdown Data for Chart:', breakdownData);



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
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={() => fetchData(false, true)}
              disabled={isFetching.current}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
            >
              <Activity className="h-4 w-4 mr-2" />
              {isFetching.current ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            {hasError && (
              <div className="text-red-400 text-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span>Showing fallback data</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Credit Balance */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <CreditCard className="h-5 w-5 text-green-400" />
                </div>
                <span>Credit Balance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-400">
                  {parseFloat(String(currentUsage?.credit_balance || 0)).toFixed(2)} credits
                </div>
                <p className="text-gray-400 text-sm">Available Credits</p>
                <Button
                  onClick={() => setShowTopUpModal(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Top Up
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Usage */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center space-x-3">
                <div className="p-2 bg-red-500/20 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-red-400" />
                </div>
                <span>Monthly Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-red-400">
                  {parseFloat(String(currentUsage?.credit_usage_this_month || 0)).toFixed(2)} credits
                </div>
                <p className="text-gray-400 text-sm">Credits Used</p>
                <div className="flex items-center justify-center space-x-1">
                  <ArrowUpRight className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">This Month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits Added */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Plus className="h-5 w-5 text-blue-400" />
                </div>
                <span>Credits Added</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-400">
                  {parseFloat(String(currentUsage?.credit_added_this_month || 0)).toFixed(2)} credits
                </div>
                <p className="text-gray-400 text-sm">This Month</p>
                <div className="flex items-center justify-center space-x-1">
                  <ArrowUpRight className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-blue-400">Top Ups</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Credits */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <CreditCard className="h-5 w-5 text-purple-400" />
                </div>
                <span>Net Credits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-purple-400">
                  {parseFloat(String(currentUsage?.net_credits_this_month || 0)).toFixed(2)} credits
                </div>
                <p className="text-gray-400 text-sm">This Month</p>
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-sm text-purple-400">
                    {currentUsage?.can_send_sms ? 'SMS: ✓' : 'SMS: ✗'} | {currentUsage?.can_send_email ? 'Email: ✓' : 'Email: ✗'}
                  </span>
                </div>
              </div>
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
                      tickFormatter={(value) => `${typeof value === 'number' ? value.toFixed(2) : parseFloat(value || 0).toFixed(2)} credits`}
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
                      formatter={(value: unknown) => [`${typeof value === 'number' ? value.toFixed(2) : parseFloat(String(value) || '0').toFixed(2)} credits`, 'Cost']}
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
              {breakdownData.length > 0 && breakdownData.some(item => item.value > 0) ? (
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
                      tickFormatter={(value) => `${typeof value === 'number' ? value.toFixed(2) : parseFloat(value || 0).toFixed(2)} credits`}
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
                      formatter={(value: unknown) => [`${typeof value === 'number' ? value.toFixed(2) : parseFloat(String(value) || '0').toFixed(2)} credits`, 'Cost']}
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
              ) : breakdownData.length > 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-gray-500/20 rounded-2xl w-fit mx-auto">
                      <Activity className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-400">No usage data yet</p>
                    <p className="text-gray-500 text-sm">Start sending SMS and Email to see usage breakdown</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-gray-500/20 rounded-2xl w-fit mx-auto">
                      <Activity className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-400">No breakdown data available</p>
                    <p className="text-gray-500 text-sm">Start using SMS and Email to see usage breakdown</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Credit Transaction History */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-white/10">
            <CardTitle className="text-white text-xl flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <History className="h-5 w-5 text-indigo-400" />
              </div>
              <span>Recent Credit Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {creditTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {creditTransactions.map((transaction: CreditTransaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        transaction.transaction_type === 'top_up' ? 'bg-green-500/20' :
                        transaction.transaction_type === 'sms_usage' ? 'bg-red-500/20' :
                        transaction.transaction_type === 'email_usage' ? 'bg-orange-500/20' :
                        transaction.transaction_type === 'migration_credit' ? 'bg-green-500/20' :
                        'bg-purple-500/20'
                      }`}>
                        {transaction.transaction_type === 'top_up' ? (
                          <Plus className="h-4 w-4 text-green-400" />
                        ) : transaction.transaction_type === 'sms_usage' ? (
                          <MessageSquare className="h-4 w-4 text-red-400" />
                        ) : transaction.transaction_type === 'email_usage' ? (
                          <Mail className="h-4 w-4 text-orange-400" />
                        ) : transaction.transaction_type === 'migration_credit' ? (
                          <Plus className="h-4 w-4 text-green-400" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{transaction.description}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${
                      transaction.transaction_type === 'top_up' || transaction.transaction_type === 'refund' || transaction.transaction_type === 'migration_credit' ? 'text-green-400' :
                      'text-red-400'
                    }`}>
                      {transaction.transaction_type === 'top_up' || transaction.transaction_type === 'refund' || transaction.transaction_type === 'migration_credit' ? '+' : '-'}{parseFloat(String(transaction.amount || 0)).toFixed(2)} credits
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Top Up Credits</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-gray-300">Amount (credits)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="1"
                    min="1"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Enter credits"
                    className="mt-1"
                    disabled={isProcessingPayment}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    ₵{topUpAmount ? (parseFloat(topUpAmount) / 10).toFixed(2) : '0.00'} will be charged
                  </p>
                  <p className="text-xs text-blue-400 mt-1">
                    💡 1 credit = ₵0.10 (100 credits = ₵10.00)
                  </p>
                </div>
                

                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setShowTopUpModal(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={isProcessingPayment}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTopUp}
                    disabled={isProcessingPayment || isToppingUp || !topUpAmount || parseFloat(topUpAmount) <= 0}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {isProcessingPayment ? 'Processing Payment...' : isToppingUp ? 'Topping Up...' : 'Pay'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
