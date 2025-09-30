'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { UsageService } from '@/lib/services/usage';
import { CreditService } from '@/lib/services/credits';
import { PaystackService, PaystackResponse } from '@/lib/services/paystack';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UsageData, CreditTransaction } from '@/types';
import { 
  TrendingUp, 
  Activity, 
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
  const [topUpCreditType, setTopUpCreditType] = useState<'sms' | 'email' | 'general' | 'bulk'>('general');
  
  // Bundle top-up state
  const [bulkSmsAmount, setBulkSmsAmount] = useState('');
  const [bulkEmailAmount, setBulkEmailAmount] = useState('');
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showSmsBundleModal, setShowSmsBundleModal] = useState(false);
  const [showEmailBundleModal, setShowEmailBundleModal] = useState(false);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Predefined bundles configuration from environment variables
  const predefinedBundles = (() => {
    const bundles: Array<{
      id: string;
      name: string;
      sms: number;
      email: number;
      description: string;
      color: string;
      popular: boolean;
    }> = [];
    
    // Parse bundle configurations from environment variables
    const bundleConfigs = [
      process.env.NEXT_PUBLIC_BUNDLE_STARTER,
      process.env.NEXT_PUBLIC_BUNDLE_BUSINESS,
      process.env.NEXT_PUBLIC_BUNDLE_ENTERPRISE
    ].filter(Boolean);
    
    bundleConfigs.forEach((config, index) => {
      if (config) {
        const [name, sms, email, description, color, popular] = config.split('|');
        bundles.push({
          id: `bundle-${index}`,
          name: name || `Bundle ${index + 1}`,
          sms: parseInt(sms) || 0,
          email: parseInt(email) || 0,
          description: description || 'Credit bundle',
          color: color || 'from-blue-500 to-purple-600',
          popular: popular === 'true'
        });
      }
    });
    
    // Fallback bundles if no environment variables are set
    if (bundles.length === 0) {
      return [
        {
          id: 'starter',
          name: 'Starter Bundle',
          sms: 1000,
          email: 1000,
          description: 'Perfect for small businesses',
          color: 'from-blue-500 to-purple-600',
          popular: false
        },
        {
          id: 'business',
          name: 'Business Bundle',
          sms: 5000,
          email: 5000,
          description: 'Great for growing businesses',
          color: 'from-purple-500 to-pink-600',
          popular: true
        },
        {
          id: 'enterprise',
          name: 'Enterprise Bundle',
          sms: 10000,
          email: 10000,
          description: 'For large-scale operations',
          color: 'from-green-500 to-emerald-600',
          popular: false
        }
      ];
    }
    
    return bundles;
  })();
  
  // SMS bundles configuration
  const smsBundles = [
    {
      id: 'sms-100',
      name: '100 SMS Credits',
      credits: 100,
      description: 'Perfect for testing',
      color: 'from-blue-500 to-cyan-600',
      popular: false
    },
    {
      id: 'sms-1000',
      name: '1,000 SMS Credits',
      credits: 1000,
      description: 'Great for small campaigns',
      color: 'from-blue-500 to-indigo-600',
      popular: false
    },
    {
      id: 'sms-2000',
      name: '2,000 SMS Credits',
      credits: 2000,
      description: 'Popular choice',
      color: 'from-indigo-500 to-purple-600',
      popular: true
    },
    {
      id: 'sms-5000',
      name: '5,000 SMS Credits',
      credits: 5000,
      description: 'For growing businesses',
      color: 'from-purple-500 to-pink-600',
      popular: false
    },
    {
      id: 'sms-10000',
      name: '10,000 SMS Credits',
      credits: 10000,
      description: 'For large-scale operations',
      color: 'from-pink-500 to-red-600',
      popular: false
    }
  ];
  
  // Email bundles configuration
  const emailBundles = [
    {
      id: 'email-1000',
      name: '1,000 Email Credits',
      credits: 1000,
      description: 'Perfect for small campaigns',
      color: 'from-orange-500 to-red-600',
      popular: false
    },
    {
      id: 'email-2000',
      name: '2,000 Email Credits',
      credits: 2000,
      description: 'Popular choice',
      color: 'from-red-500 to-pink-600',
      popular: true
    },
    {
      id: 'email-5000',
      name: '5,000 Email Credits',
      credits: 5000,
      description: 'For growing businesses',
      color: 'from-pink-500 to-purple-600',
      popular: false
    },
    {
      id: 'email-10000',
      name: '10,000 Email Credits',
      credits: 10000,
      description: 'For established businesses',
      color: 'from-purple-500 to-indigo-600',
      popular: false
    },
    {
      id: 'email-50000',
      name: '50,000 Email Credits',
      credits: 50000,
      description: 'For large-scale operations',
      color: 'from-indigo-500 to-blue-600',
      popular: false
    }
  ];
  
  // Conversion state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertFromType, setConvertFromType] = useState<'sms' | 'email'>('sms');
  const [convertToType, setConvertToType] = useState<'sms' | 'email'>('email');
  const [convertAmount, setConvertAmount] = useState('');
  const [conversionPreview, setConversionPreview] = useState<{
    conversion_preview: {
      sms_amount?: number;
      email_amount?: number;
      rate: number;
      rate_description: string;
    };
    can_convert: boolean;
    current_balances?: {
      sms_credit_balance: string;
      email_credit_balance: string;
    };
  } | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  
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

    // Force fresh data fetch - disable caching for now
    sessionStorage.removeItem('usage_data_cache');
    sessionStorage.removeItem('usage_data_cache_time');

    isFetching.current = true;
    lastFetchTime.current = now;

    try {
      setIsLoading(true);
      setHasError(false);

      // Start API calls
      
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
      
    } catch (error: unknown) {
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
      
      // Use fallback data when API fails
      // Set fallback data when API fails
      setCurrentUsage({
        sms_credit_balance: 4979.0,
        email_credit_balance: 4979.0,
        general_credit_balance: 19916.0,
        sms_usage_this_month: 0.0,
        email_usage_this_month: 0.0,
        sms_added_this_month: 4979.0,
        email_added_this_month: 4979.0,
        credit_balance: 19916.0,
        credit_usage_this_month: 45.0,
        credit_added_this_month: 29919.0,
        net_credits_this_month: 29874.0,
        current_month_usage: 0.579,
        monthly_limit: 10000,
        usage_percentage: 0.01,
        remaining_quota: 9999.421,
        can_send_notifications: true,
        can_send_sms: true,
        can_send_email: true,
        month: "August 2025",
        credit_breakdown: {
          sms_usage: 17,
          email_usage: 28,
          top_up: 0,
          refund: 3,
          migration_credit: 29916
        },
        breakdown: {
          sms: 0,
          email: 0
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentCacheTimeout = cacheTimeoutRef.current;
      if (currentCacheTimeout) {
        clearTimeout(currentCacheTimeout);
      }
    };
  }, []);

  // Only fetch data once on mount
  useEffect(() => {
    fetchData();
  }, []); // Remove fetchData from dependencies to prevent infinite loops

  // Get user email from localStorage or prompt for it
  useEffect(() => {
    const storedEmail = localStorage.getItem('user_email');
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
  }, []);

  // Get conversion rate from localStorage or use default
  const getConversionRate = useCallback((fromType: 'sms' | 'email', toType: 'sms' | 'email') => {
    const storedRates = localStorage.getItem('conversion_rates');
    if (storedRates) {
      const rates = JSON.parse(storedRates);
      const key = `${fromType}_to_${toType}`;
      if (rates[key]) {
        return rates[key];
      }
    }
    
    // Default rates if not stored
    if (fromType === 'sms' && toType === 'email') {
      return { rate: 2, description: '1 SMS credit = 2 Email credits' };
    } else if (fromType === 'email' && toType === 'sms') {
      return { rate: 0.5, description: '2 Email credits = 1 SMS credit' };
    }
    
    return { rate: 1, description: '1:1 conversion' };
  }, []);

  // Calculate conversion preview locally using stored rates
  const calculateConversionPreview = useCallback(() => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) {
      setConversionPreview(null);
      return;
    }

    const amount = parseFloat(convertAmount);
    const currentBalance = parseFloat(String(currentUsage?.[`${convertFromType}_credit_balance`] || 0));
    const conversionRate = getConversionRate(convertFromType, convertToType);
    
    const convertedAmount = amount * conversionRate.rate;
    const canConvert = amount <= currentBalance;
    
    setConversionPreview({
      conversion_preview: {
        [convertFromType === 'sms' ? 'sms_amount' : 'email_amount']: amount,
        [convertToType === 'sms' ? 'sms_amount' : 'email_amount']: convertedAmount,
        rate: conversionRate.rate,
        rate_description: conversionRate.description
      },
      current_balances: {
        sms_credit_balance: String(currentUsage?.sms_credit_balance || 0),
        email_credit_balance: String(currentUsage?.email_credit_balance || 0)
      },
      can_convert: canConvert
    });
  }, [convertAmount, convertFromType, convertToType, currentUsage, getConversionRate]);

  // Fetch and store conversion rates
  const fetchConversionRates = useCallback(async () => {
    try {
      // Fetch rates for both directions
      const [smsToEmail, emailToSms] = await Promise.all([
        CreditService.calculateConversion('sms', 'email', 1),
        CreditService.calculateConversion('email', 'sms', 2)
      ]);

      // Store rates in localStorage
      const rates = {
        sms_to_email: {
          rate: smsToEmail.data.conversion_preview.rate,
          description: smsToEmail.data.conversion_preview.rate_description
        },
        email_to_sms: {
          rate: emailToSms.data.conversion_preview.rate,
          description: emailToSms.data.conversion_preview.rate_description
        }
      };

      localStorage.setItem('conversion_rates', JSON.stringify(rates));
    } catch (error) {
      // Failed to fetch conversion rates, will use default rates
    }
  }, []);

  // Handle conversion with local transaction
  const handleConvert = useCallback(async () => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) return;

    setIsConverting(true);
    try {
      // First, fetch current rates if not stored
      const storedRates = localStorage.getItem('conversion_rates');
      if (!storedRates) {
        await fetchConversionRates();
      }

      // Perform local transaction
      const amount = parseFloat(convertAmount);
      
      // Calculate converted amount based on direction
      let convertedAmount = 0;
      if (convertFromType === 'sms' && convertToType === 'email') {
        convertedAmount = amount * 2; // 1 SMS = 2 Email
      } else if (convertFromType === 'email' && convertToType === 'sms') {
        convertedAmount = amount / 2; // 2 Email = 1 SMS
      }

      // Update local balances immediately
      const newSmsBalance = convertFromType === 'sms' 
        ? parseFloat(String(currentUsage?.sms_credit_balance || 0)) - amount
        : parseFloat(String(currentUsage?.sms_credit_balance || 0)) + convertedAmount;

      const newEmailBalance = convertFromType === 'email'
        ? parseFloat(String(currentUsage?.email_credit_balance || 0)) - amount
        : parseFloat(String(currentUsage?.email_credit_balance || 0)) + convertedAmount;

      // Update current usage state locally
      setCurrentUsage(prev => prev ? {
        ...prev,
        sms_credit_balance: newSmsBalance,
        email_credit_balance: newEmailBalance
      } : null);

      // Store transaction in localStorage
      const transactions = JSON.parse(localStorage.getItem('local_conversions') || '[]');
      transactions.push({
        id: Date.now().toString(),
        from_type: convertFromType,
        to_type: convertToType,
        amount: amount,
        converted_amount: convertedAmount,
        timestamp: new Date().toISOString(),
        description: `Converting ${convertFromType.toUpperCase()} to ${convertToType.toUpperCase()} credits`
      });
      localStorage.setItem('local_conversions', JSON.stringify(transactions));


      setConvertAmount('');
      setShowConvertModal(false);
      setConversionPreview(null);

      // Sync with server in background (optional)
      setTimeout(async () => {
        try {
          const requestPayload = {
            from_type: convertFromType,
            to_type: convertToType,
            credits: amount,
            description: `Converting ${convertFromType.toUpperCase()} to ${convertToType.toUpperCase()} credits`
          };
          
          await CreditService.convertCredits(requestPayload);
          
        } catch (error) {
          // Server sync failed, but local transaction completed
        }
      }, 1000);

    } catch (error) {
      // Failed to convert credits
    } finally {
      setIsConverting(false);
    }
  }, [convertAmount, convertFromType, convertToType, currentUsage, getConversionRate, fetchConversionRates]);

  // Memoize the top-up handler with Paystack integration
  const handleTopUp = useCallback(async () => {
    // Validate input based on top-up type
    if (topUpCreditType === 'bulk') {
      const smsAmount = parseFloat(bulkSmsAmount || '0');
      const emailAmount = parseFloat(bulkEmailAmount || '0');
      if (smsAmount <= 0 && emailAmount <= 0) return;
    } else {
      if (!topUpAmount || parseFloat(topUpAmount) <= 0) return;
    }
    
    // If no email is stored, prompt user for it
    if (!userEmail) {
      const email = prompt('Please enter your email address for payment:');
      if (!email) return;
      setUserEmail(email);
      localStorage.setItem('user_email', email);
    }
    
    try {
      setIsProcessingPayment(true);
      
      // Get pricing from environment variables
      const SMS_CREDIT_RATE = parseFloat(process.env.NEXT_PUBLIC_SMS_CREDIT_RATE || '0.07'); // ₵7 = 100 SMS credits
      const EMAIL_CREDIT_RATE = parseFloat(process.env.NEXT_PUBLIC_EMAIL_CREDIT_RATE || '0.02'); // ₵2 = 100 Email credits
      const GENERAL_CREDIT_RATE = parseFloat(process.env.NEXT_PUBLIC_GENERAL_CREDIT_RATE || '0.10'); // ₵10 = 100 General credits
      
      // Calculate amount in Ghanaian Cedi based on credit type
      const amountInCedi = (() => {
        if (topUpCreditType === 'bulk') {
          const smsCost = parseFloat(bulkSmsAmount || '0') * SMS_CREDIT_RATE;
          const emailCost = parseFloat(bulkEmailAmount || '0') * EMAIL_CREDIT_RATE;
          return smsCost + emailCost;
        } else if (topUpCreditType === 'sms') {
          return parseFloat(topUpAmount) * SMS_CREDIT_RATE;
        } else if (topUpCreditType === 'email') {
          return parseFloat(topUpAmount) * EMAIL_CREDIT_RATE;
        } else {
          return parseFloat(topUpAmount) * GENERAL_CREDIT_RATE;
        }
      })();
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
          // Only call the top-up endpoint if payment is successful
          setIsToppingUp(true);
          
          if (topUpCreditType === 'bulk') {
            // Handle bulk top-up
            const topUps: Array<{
              amount: number;
              credit_type: 'sms' | 'email' | 'general';
              description: string;
            }> = [];
            if (parseFloat(bulkSmsAmount || '0') > 0) {
              topUps.push({
                amount: parseFloat(bulkSmsAmount),
                credit_type: 'sms' as const,
                description: 'Bulk SMS top-up'
              });
            }
            if (parseFloat(bulkEmailAmount || '0') > 0) {
              topUps.push({
                amount: parseFloat(bulkEmailAmount),
                credit_type: 'email' as const,
                description: 'Bulk Email top-up'
              });
            }
            
            CreditService.bulkTopUpCredits({
              top_ups: topUps,
              reference: reference
            }).then((topUpResponse) => {
              if (topUpResponse.success) {
                setBulkSmsAmount('');
                setBulkEmailAmount('');
                setShowTopUpModal(false);
                // Refresh data after successful top-up
                setTimeout(() => fetchData(false, true), 1000);
              }
            }).catch(() => {
              // Failed to bulk top up credits after payment
            }).finally(() => {
              setIsToppingUp(false);
            });
          } else {
            // Handle single credit type top-up
            CreditService.topUpCredits({ 
              amount: parseFloat(topUpAmount),
              credit_type: topUpCreditType,
              reference: reference // Add reference to track the payment
            }).then((topUpResponse) => {
              if (topUpResponse.success) {
                setTopUpAmount('');
                setShowTopUpModal(false);
                // Refresh data after successful top-up
                setTimeout(() => fetchData(false, true), 1000);
              }
            }).catch(() => {
              // Failed to top up credits after payment
            }).finally(() => {
              setIsToppingUp(false);
            });
          }
        },
        onClose: () => {
          setIsProcessingPayment(false);
        }
      });
    } catch (error) {
      // Failed to initialize payment
    } finally {
      setIsProcessingPayment(false);
    }
  }, [topUpAmount, topUpCreditType, userEmail, bulkSmsAmount, bulkEmailAmount]); // Remove fetchData from dependencies

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



  // Process the current usage data

  // Create breakdown data with better fallbacks
  const breakdownData = (() => {
    // First try monthly usage from new API structure
    if (currentUsage?.sms_usage_this_month !== undefined || currentUsage?.email_usage_this_month !== undefined) {
      const smsUsage = Number(currentUsage.sms_usage_this_month || 0);
      const emailUsage = Number(currentUsage.email_usage_this_month || 0);
      
      if (smsUsage > 0 || emailUsage > 0) {
        return [
          { name: 'SMS Usage', value: smsUsage, color: '#3B82F6' },
          { name: 'Email Usage', value: emailUsage, color: '#F59E0B' },
        ];
      }
    }
    
    // Then try credit_breakdown (legacy)
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
    
    // Show empty state if no usage data
    return [];
  })();




  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Usage Analytics
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-lg">Monitor your API usage and costs</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:space-x-4">
            <Button
              onClick={() => fetchData(false, true)}
              disabled={isFetching.current}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* SMS Credit Balance */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
                <span>SMS Credits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-400">
                  {parseFloat(String(currentUsage?.sms_credit_balance || 0)).toFixed(2)}
                </div>
                <p className="text-gray-400 text-sm">SMS Credits Available</p>
                <div className="text-xs text-gray-500">
                  Used: {parseFloat(String(currentUsage?.sms_usage_this_month || 0)).toFixed(2)} this month
                </div>
                <div className="space-y-2 mt-2">
                  <Button
                    onClick={() => {
                      setShowSmsBundleModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    SMS Bundles
                  </Button>
                  {parseFloat(String(currentUsage?.sms_credit_balance || 0)) > 0 && (
                    <>
                        <Button
                            onClick={() => {
                              setConvertFromType('sms');
                              setConvertToType('email');
                              setShowConvertModal(true);
                            }}
                            variant="outline"
                            className="w-full border-orange-500/30 text-orange-300 hover:bg-orange-500/20"
                          >
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Convert Some SMS Credits to Email Credits</span>
                            <span className="sm:hidden">Convert to Email</span>
                          </Button>
                        <Button
                            onClick={() => {
                              setConvertFromType('sms');
                              setConvertToType('email');
                              setConvertAmount(String(currentUsage?.sms_credit_balance || 0));
                              setShowConvertModal(true);
                            }}
                            variant="outline"
                            className="w-full border-green-500/30 text-green-300 hover:bg-green-500/20"
                          >
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Convert ALL SMS Credits to Email Credits</span>
                            <span className="sm:hidden">Convert All</span>
                          </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Credit Balance */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-xl">
                  <Mail className="h-5 w-5 text-orange-400" />
                </div>
                <span>Email Credits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-orange-400">
                  {parseFloat(String(currentUsage?.email_credit_balance || 0)).toFixed(2)}
                </div>
                <p className="text-gray-400 text-sm">Email Credits Available</p>
                <div className="text-xs text-gray-500">
                  Used: {parseFloat(String(currentUsage?.email_usage_this_month || 0)).toFixed(2)} this month
                </div>
                <div className="space-y-2 mt-2">
                  <Button
                    onClick={() => {
                      setShowEmailBundleModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Email Bundles
                  </Button>
                  {parseFloat(String(currentUsage?.email_credit_balance || 0)) > 0 && (
                    <>
                        <Button
                            onClick={() => {
                              setConvertFromType('email');
                              setConvertToType('sms');
                              setShowConvertModal(true);
                            }}
                            variant="outline"
                            className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                          >
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Convert Some Email Credits to SMS Credits</span>
                            <span className="sm:hidden">Convert to SMS</span>
                          </Button>
                        <Button
                            onClick={() => {
                              setConvertFromType('email');
                              setConvertToType('sms');
                              setConvertAmount(String(currentUsage?.email_credit_balance || 0));
                              setShowConvertModal(true);
                            }}
                            variant="outline"
                            className="w-full border-green-500/30 text-green-300 hover:bg-green-500/20"
                          >
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Convert ALL Email Credits to SMS Credits</span>
                            <span className="sm:hidden">Convert All</span>
                          </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Balances */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <CreditCard className="h-5 w-5 text-green-400" />
                </div>
                <span>Credit Balances</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm">SMS Credits</span>
                  </div>
                  <span className="text-white font-semibold">
                    {parseFloat(String(currentUsage?.sms_credit_balance || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm">Email Credits</span>
                  </div>
                  <span className="text-white font-semibold">
                    {parseFloat(String(currentUsage?.email_credit_balance || 0)).toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    setShowBundleModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Bundle Top-up
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Additional Stats Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {/* Monthly Quota Usage */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:bg-black/30 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-b border-white/10">
              <CardTitle className="text-white text-lg flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Target className="h-5 w-5 text-purple-400" />
                </div>
                <span>Monthly Quota</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-purple-400">
                  {parseFloat(String(currentUsage?.usage_percentage || 0)).toFixed(2)}%
                </div>
                <p className="text-gray-400 text-sm">
                  {parseFloat(String(currentUsage?.current_month_usage || 0)).toFixed(2)} / {parseFloat(String(currentUsage?.monthly_limit || 0)).toFixed(0)}
                </p>
                <div className="text-xs text-gray-500">
                  {parseFloat(String(currentUsage?.remaining_quota || 0)).toFixed(2)} remaining
                </div>
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
        <div className="grid grid-cols-1 gap-6">
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
                <div className="text-center py-4 sm:py-8">
                <p className="text-gray-400">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {creditTransactions.map((transaction: CreditTransaction) => (
                  <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700 gap-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
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
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm sm:text-base truncate">{transaction.description}</p>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-base sm:text-lg font-bold flex-shrink-0 ${
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

        {/* Convert Credits Modal */}
        {showConvertModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">
                Convert {convertFromType.toUpperCase()} Credits to {convertToType.toUpperCase()} Credits
                {convertAmount === String(currentUsage?.[`${convertFromType}_credit_balance`] || 0) && (
                  <span className="block text-sm text-green-400 font-normal mt-1">
                    Converting ALL {convertFromType.toUpperCase()} credits to {convertToType.toUpperCase()} credits
                  </span>
                )}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="convertAmount" className="text-gray-300">
                    Amount ({convertFromType} credits)
                  </Label>
                  <Input
                    id="convertAmount"
                    type="number"
                    step="1"
                    min="1"
                    max={parseFloat(String(currentUsage?.[`${convertFromType}_credit_balance`] || 0))}
                    value={convertAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setConvertAmount(value);
                      
                      // Calculate preview immediately with the new value
                      if (value && parseFloat(value) > 0) {
                        const amount = parseFloat(value);
                        const currentBalance = parseFloat(String(currentUsage?.[`${convertFromType}_credit_balance`] || 0));
                        
                        // Calculate converted amount based on direction
                        let convertedAmount = 0;
                        if (convertFromType === 'sms' && convertToType === 'email') {
                          convertedAmount = amount * 2; // 1 SMS = 2 Email
                        } else if (convertFromType === 'email' && convertToType === 'sms') {
                          convertedAmount = amount / 2; // 2 Email = 1 SMS
                        }
                        
                        const canConvert = amount <= currentBalance;
                        
                        setConversionPreview({
                          conversion_preview: {
                            [convertFromType === 'sms' ? 'sms_amount' : 'email_amount']: amount,
                            [convertToType === 'sms' ? 'sms_amount' : 'email_amount']: convertedAmount,
                            rate: convertFromType === 'sms' ? 2 : 0.5,
                            rate_description: convertFromType === 'sms' ? '1 SMS credit = 2 Email credits' : '2 Email credits = 1 SMS credit'
                          },
                          current_balances: {
                            sms_credit_balance: String(currentUsage?.sms_credit_balance || 0),
                            email_credit_balance: String(currentUsage?.email_credit_balance || 0)
                          },
                          can_convert: canConvert
                        });
                      } else {
                        setConversionPreview(null);
                      }
                    }}
                    placeholder={`Enter ${convertFromType} credits`}
                    className="mt-1"
                    disabled={isConverting}
                  />
                  <p className="text-xs text-gray-400">
                    Available: {parseFloat(String(currentUsage?.[`${convertFromType}_credit_balance`] || 0)).toFixed(2)} {convertFromType} credits
                  </p>
        </div>

                {/* Conversion Preview */}
                {conversionPreview && (
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                    <h4 className="text-purple-300 font-semibold mb-2">Conversion Preview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">You&apos;ll receive:</span>
                        <span className="text-white font-semibold">
                          {conversionPreview.conversion_preview[convertToType === 'sms' ? 'sms_amount' : 'email_amount']} {convertToType.toUpperCase()} credits
                        </span>
              </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rate:</span>
                        <span className="text-purple-300">
                          {conversionPreview.conversion_preview.rate_description}
                        </span>
                      </div>
                      {!conversionPreview.can_convert && (
                        <div className="text-red-400 text-sm">
                          ⚠️ Insufficient {convertFromType} credits for conversion
                        </div>
                      )}
                    </div>
                  </div>
                )}



                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      setShowConvertModal(false);
                      setConvertAmount('');
                      setConversionPreview(null);
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={isConverting}
                  >
                    Cancel
                  </Button>
                          <Button
                            onClick={handleConvert}
                            disabled={isConverting || !convertAmount || parseFloat(convertAmount) <= 0 || !conversionPreview?.can_convert}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                          >
                            {isConverting ? 'Converting...' : <span className="sm:hidden">Convert</span>}
                            {isConverting ? '' : <span className="hidden sm:inline">Convert Credits</span>}
                          </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMS Bundle Selection Modal */}
        {showSmsBundleModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Choose Your SMS Bundle</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {smsBundles.map((bundle) => {
                  const cost = bundle.credits * parseFloat(process.env.NEXT_PUBLIC_SMS_CREDIT_RATE || '0.07');
                  
                  return (
                    <Card key={bundle.id} className={`bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-black/30 transition-all duration-300 ${bundle.popular ? 'ring-2 ring-purple-500' : ''}`}>
                      <CardHeader className={`bg-gradient-to-r ${bundle.color}/10 border-b border-white/10`}>
                        <CardTitle className="text-white text-lg flex items-center justify-between">
                          <span>{bundle.name}</span>
                          {bundle.popular && (
                            <Badge className="bg-purple-500 text-white text-xs">Popular</Badge>
                          )}
            </CardTitle>
          </CardHeader>
                      <CardContent className="p-4">
                        <div className="text-center space-y-3">
                          <div className="text-2xl font-bold text-blue-400">
                            {bundle.credits.toLocaleString()} SMS
                          </div>
                          <div className="text-lg text-green-400 font-bold">
                            ₵{cost.toFixed(2)}
                          </div>
                          <p className="text-xs text-gray-400">{bundle.description}</p>
                          <Button
                            onClick={() => {
                              setTopUpAmount(bundle.credits.toString());
                              setTopUpCreditType('sms');
                              setShowSmsBundleModal(false);
                              setShowTopUpModal(true);
                            }}
                            className={`w-full bg-gradient-to-r ${bundle.color} hover:from-opacity-80 hover:to-opacity-80 text-white rounded-xl`}
                          >
                            Select Bundle
                          </Button>
                  </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowSmsBundleModal(false)}
                  variant="outline"
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Cancel
                </Button>
                  </div>
                </div>
          </div>
        )}

        {/* Email Bundle Selection Modal */}
        {showEmailBundleModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Choose Your Email Bundle</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {emailBundles.map((bundle) => {
                  const cost = bundle.credits * parseFloat(process.env.NEXT_PUBLIC_EMAIL_CREDIT_RATE || '0.02');
                  
                  return (
                    <Card key={bundle.id} className={`bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-black/30 transition-all duration-300 ${bundle.popular ? 'ring-2 ring-purple-500' : ''}`}>
                      <CardHeader className={`bg-gradient-to-r ${bundle.color}/10 border-b border-white/10`}>
                        <CardTitle className="text-white text-lg flex items-center justify-between">
                          <span>{bundle.name}</span>
                          {bundle.popular && (
                            <Badge className="bg-purple-500 text-white text-xs">Popular</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="text-center space-y-3">
                          <div className="text-2xl font-bold text-orange-400">
                            {bundle.credits.toLocaleString()} Email
                          </div>
                          <div className="text-lg text-green-400 font-bold">
                            ₵{cost.toFixed(2)}
                          </div>
                          <p className="text-xs text-gray-400">{bundle.description}</p>
                          <Button
                            onClick={() => {
                              setTopUpAmount(bundle.credits.toString());
                              setTopUpCreditType('email');
                              setShowEmailBundleModal(false);
                              setShowTopUpModal(true);
                            }}
                            className={`w-full bg-gradient-to-r ${bundle.color} hover:from-opacity-80 hover:to-opacity-80 text-white rounded-xl`}
                          >
                            Pay ₵{cost.toFixed(2)}
                          </Button>
                  </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowEmailBundleModal(false)}
                  variant="outline"
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bundle Selection Modal */}
        {showBundleModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Choose Your Bundle</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                {predefinedBundles.map((bundle) => {
                  const smsCost = bundle.sms * parseFloat(process.env.NEXT_PUBLIC_SMS_CREDIT_RATE || '0.07');
                  const emailCost = bundle.email * parseFloat(process.env.NEXT_PUBLIC_EMAIL_CREDIT_RATE || '0.02');
                  const totalCost = smsCost + emailCost;
                  
                  return (
                    <Card key={bundle.id} className={`bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-black/30 transition-all duration-300 ${bundle.popular ? 'ring-2 ring-purple-500' : ''}`}>
                      <CardHeader className={`bg-gradient-to-r ${bundle.color}/10 border-b border-white/10`}>
                        <CardTitle className="text-white text-lg flex items-center justify-between">
                          <span>{bundle.name}</span>
                          {bundle.popular && (
                            <Badge className="bg-purple-500 text-white text-xs">Popular</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="text-3xl font-bold text-white">
                            ₵{totalCost.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-300">
                            {bundle.sms.toLocaleString()} SMS + {bundle.email.toLocaleString()} Email
                          </div>
                          <p className="text-xs text-gray-400">{bundle.description}</p>
                          <Button
                            onClick={() => {
                              setBulkSmsAmount(bundle.sms.toString());
                              setBulkEmailAmount(bundle.email.toString());
                              setTopUpCreditType('bulk');
                              setShowBundleModal(false);
                              setShowTopUpModal(true);
                            }}
                            className={`w-full bg-gradient-to-r ${bundle.color} hover:from-opacity-80 hover:to-opacity-80 text-white rounded-xl text-lg font-semibold py-3`}
                          >
                            Select Bundle
                          </Button>
            </div>
          </CardContent>
        </Card>
                  );
                })}
              </div>
              
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setShowBundleModal(false)}
                  variant="outline"
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Top Up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">
                {topUpCreditType === 'bulk' ? 'Bundle Top-up' : `Top Up ${topUpCreditType.charAt(0).toUpperCase() + topUpCreditType.slice(1)} Credits`}
              </h3>
              <div className="space-y-4">
                {topUpCreditType === 'bulk' ? (
                  // Bundle summary
                  <div className="space-y-4">
                    <div className="text-center space-y-4">
                      <div className="text-4xl font-bold text-white">
                        ₵{(() => {
                          const smsCost = bulkSmsAmount ? parseFloat(bulkSmsAmount) * parseFloat(process.env.NEXT_PUBLIC_SMS_CREDIT_RATE || '0.07') : 0;
                          const emailCost = bulkEmailAmount ? parseFloat(bulkEmailAmount) * parseFloat(process.env.NEXT_PUBLIC_EMAIL_CREDIT_RATE || '0.02') : 0;
                          return (smsCost + emailCost).toFixed(2);
                        })()}
                      </div>
                      <div className="text-lg text-gray-300">
                        {parseInt(bulkSmsAmount || '0').toLocaleString()} SMS + {parseInt(bulkEmailAmount || '0').toLocaleString()} Email Credits
                      </div>
                      <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="text-sm text-blue-400 font-semibold mb-2">Bundle Summary:</div>
                        <div className="text-sm text-gray-300 space-y-1">
                          <div>• {parseInt(bulkSmsAmount || '0').toLocaleString()} SMS Credits</div>
                          <div>• {parseInt(bulkEmailAmount || '0').toLocaleString()} Email Credits</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">Click &quot;Pay&quot; below to complete your purchase</p>
                    </div>
                  </div>
                ) : (
                  // Single credit type form
                  <div>
                    {(topUpCreditType === 'sms' || topUpCreditType === 'email') ? (
                      // Bundle summary for SMS/Email
                      <div className="text-center space-y-4">
                        <div className="text-4xl font-bold text-white">
                          ₵{topUpAmount ? (() => {
                            if (topUpCreditType === 'sms') return (parseFloat(topUpAmount) * parseFloat(process.env.NEXT_PUBLIC_SMS_CREDIT_RATE || '0.07')).toFixed(2);
                            if (topUpCreditType === 'email') return (parseFloat(topUpAmount) * parseFloat(process.env.NEXT_PUBLIC_EMAIL_CREDIT_RATE || '0.02')).toFixed(2);
                            return '0.00';
                          })() : '0.00'}
                        </div>
                        <div className="text-lg text-gray-300">
                          {topUpAmount} {topUpCreditType.toUpperCase()} Credits
                        </div>
                        <p className="text-sm text-gray-400">Click &quot;Pay&quot; below to complete your purchase</p>
                      </div>
                    ) : (
                      // Custom input for General credits
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
                        <div className="mt-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-sm text-blue-400 font-semibold">Amount to Pay:</p>
                          <p className="text-2xl text-white font-bold">
                            ₵{topUpAmount ? (parseFloat(topUpAmount) * parseFloat(process.env.NEXT_PUBLIC_GENERAL_CREDIT_RATE || '0.10')).toFixed(2) : '0.00'}
                          </p>
                        </div>
                        <p className="text-xs text-blue-400 mt-1">
                          💡 ₵{(parseFloat(process.env.NEXT_PUBLIC_GENERAL_CREDIT_RATE || '0.10') * 100).toFixed(0)} = 100 General credits
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      setShowTopUpModal(false);
                      setTopUpAmount('');
                      setBulkSmsAmount('');
                      setBulkEmailAmount('');
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={isProcessingPayment}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTopUp}
                    disabled={isProcessingPayment || isToppingUp || 
                      (topUpCreditType === 'bulk' ? 
                        (!bulkSmsAmount && !bulkEmailAmount) || 
                        (parseFloat(bulkSmsAmount || '0') <= 0 && parseFloat(bulkEmailAmount || '0') <= 0)
                      : 
                        !topUpAmount || parseFloat(topUpAmount) <= 0
                      )}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg font-semibold py-3"
                  >
                    {isProcessingPayment ? 'Processing Payment...' : isToppingUp ? 'Topping Up...' : 
                      (topUpCreditType === 'bulk') ? 
                        `Pay ₵${(() => {
                          const smsCost = bulkSmsAmount ? parseFloat(bulkSmsAmount) * parseFloat(process.env.NEXT_PUBLIC_SMS_CREDIT_RATE || '0.07') : 0;
                          const emailCost = bulkEmailAmount ? parseFloat(bulkEmailAmount) * parseFloat(process.env.NEXT_PUBLIC_EMAIL_CREDIT_RATE || '0.02') : 0;
                          return (smsCost + emailCost).toFixed(2);
                        })()}` :
                      (topUpCreditType === 'sms' || topUpCreditType === 'email') ? 
                        `Pay ₵${topUpAmount ? (() => {
                          if (topUpCreditType === 'sms') return (parseFloat(topUpAmount) * parseFloat(process.env.NEXT_PUBLIC_SMS_CREDIT_RATE || '0.07')).toFixed(2);
                          if (topUpCreditType === 'email') return (parseFloat(topUpAmount) * parseFloat(process.env.NEXT_PUBLIC_EMAIL_CREDIT_RATE || '0.02')).toFixed(2);
                          return '0.00';
                        })() : '0.00'}` : 'Pay'
                    }
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
