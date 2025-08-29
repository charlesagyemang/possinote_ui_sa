'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Customer } from '@/types';
import { useSearchParams } from 'next/navigation';
import { AuthService } from '@/lib/services/auth';
import { PromoService, PromoConfig } from '@/lib/services/promo';
import { NotificationService } from '@/lib/services/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { 
  UserPlus, 
  Key, 
  Copy, 
  Check, 
  ArrowLeft, 
  Gift, 
  Mail, 
  Phone, 
  Building, 
  User, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Shield
} from 'lucide-react';
import Link from 'next/link';

const signupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be in international format (e.g., +233244123456)'),
  company_name: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters'),
});

export function PromoSignupForm() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [promoConfig, setPromoConfig] = useState<PromoConfig | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [initialCredits, setInitialCredits] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  
  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company_name: '',
    },
  });

  const calculateTimeLeft = useCallback((validUntil: string) => {
    const now = new Date().getTime();
    const validUntilTime = new Date(validUntil).getTime();
    const difference = validUntilTime - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    }
    return null;
  }, []);

  useEffect(() => {
    // Check token authentication first
    const urlToken = searchParams.get('token');
    const expectedToken = process.env.NEXT_PUBLIC_PROMO_ACCESS_TOKEN;
    
    console.log('🔐 Token check - URL token:', urlToken, 'Expected:', expectedToken);
    
    if (!urlToken || !expectedToken || urlToken !== expectedToken) {
      console.log('❌ Unauthorized access - invalid or missing token');
      setIsAuthorized(false);
      return;
    }
    
    console.log('✅ Token authentication successful');
    setIsAuthorized(true);
    
    const config = PromoService.getActivePromo();
    const valid = PromoService.isPromoValid();
    
    setPromoConfig(config);
    setIsExpired(config ? !valid : false);

    if (config && valid) {
      // Calculate initial time left
      const initialTimeLeft = calculateTimeLeft(config.validUntil);
      setTimeLeft(initialTimeLeft);

      // Set up countdown timer
      const timer = setInterval(() => {
        const timeLeft = calculateTimeLeft(config.validUntil);
        setTimeLeft(timeLeft);
        
        if (!timeLeft) {
          setIsExpired(true);
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [calculateTimeLeft, searchParams]);

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    if (!promoConfig) return;
    
    setIsLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const response = await AuthService.register({
        customer: {
          ...data,
          plan_type: 'promo', // Use 'promo' plan type
          monthly_limit: PromoService.getTotalCredits()
        }
      });
        
      console.log('🔍 Promo AuthService response:', response);
      
      if (response.success) {
        setSuccess(true);
        setApiKey(response.api_key || '');
        const totalCredits = PromoService.getTotalCredits();
        console.log('🎁 Setting initial credits to:', totalCredits);
        setInitialCredits(totalCredits);
        
        // Store the API key in localStorage
        localStorage.setItem('api_token', response.api_key || '');
        
        // Update auth store
        const login = useAuthStore.getState().login;
        if (response.customer && response.api_key) {
          login(response.api_key, response.customer as Customer);
        }
        
        // Debug notification environment
        NotificationService.debugEnvironment();
        
        // Send signup notification to sales team
        console.log('📧 Sending signup notification to sales team...');
        NotificationService.sendSignupNotification({
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: data.phone,
          companyName: data.company_name,
          planType: 'promo',
          initialCredits: PromoService.getTotalCredits()
        }).then((signupResult) => {
          console.log('✅ Promo signup notification result:', signupResult);
        }).catch((error) => {
          console.error('❌ Failed to send promo signup notification:', error);
        });

        // Send welcome notification to new customer
        console.log('📱 Sending welcome notification to customer...');
        NotificationService.sendWelcomeNotification({
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: data.phone,
          companyName: data.company_name,
          planType: 'promo',
          initialCredits: PromoService.getTotalCredits(),
          apiKey: response.api_key || ''
        }).then((welcomeResult) => {
          console.log('✅ Promo welcome notification result:', welcomeResult);
        }).catch((error) => {
          console.error('❌ Failed to send promo welcome notification:', error);
        });
        
        // Redirect to dashboard after 5 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 5000);
      } else {
        console.log('🔍 Promo registration failed:', response.message);
        setError(response.message || 'Registration failed. Please try again.');
        showToast('error', 'Registration Failed', response.message || 'Registration failed. Please try again.');
        
        if (response.message && response.message.includes('Email has already been taken')) {
          form.setValue('email', '');
        }
      }
    } catch (error: unknown) {
      console.log('🔍 Promo signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      console.log('🔍 Setting error message:', errorMessage);
      setError(errorMessage);
      showToast('error', 'Registration Failed', errorMessage);
      
      if (errorMessage.includes('Email has already been taken')) {
        form.setValue('email', '');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy API key:', err);
    }
  };

  // Error states
  if (!promoConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="bg-black/20 backdrop-blur-xl border border-red-500/30 rounded-3xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Active Promo</h2>
            <p className="text-gray-400 mb-6">There is currently no active promotional offer.</p>
            <Button asChild className="w-full">
              <Link href="/signup">Go to Regular Signup</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="bg-black/20 backdrop-blur-xl border border-orange-500/30 rounded-3xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Clock className="h-16 w-16 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Promo Expired</h2>
            <p className="text-gray-400 mb-6">This promo expired on {new Date(promoConfig.validUntil).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}.</p>
            <Button asChild className="w-full">
              <Link href="/signup">Go to Regular Signup</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  // Unauthorized access - invalid or missing token
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="bg-black/20 backdrop-blur-xl border border-red-500/30 rounded-3xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="p-3 bg-red-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">
              This promo page requires a valid access token. Please contact support or use the correct promo link.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/signup">Go to Regular Signup</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/pricing">View Pricing Plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Success!
              </h1>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Promo Account Created!</h2>
              <p className="text-green-400 mt-2">Your PossiNote promo account has been created successfully.</p>
            </div>
          </div>
          
          {/* Promo Credits Card */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-white/10">
              <CardTitle className="text-white text-xl flex items-center space-x-3">
                <div className="p-2 bg-teal-500/20 rounded-xl">
                  <Gift className="h-5 w-5 text-teal-400" />
                </div>
                <span>Promo Credits</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-teal-400">
                  {initialCredits.toLocaleString()} Credits
                </div>
                <p className="text-gray-400 text-sm">
                  Your promo account comes with {initialCredits.toLocaleString()} initial credits!
                </p>
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-3">
                  <p className="text-green-300 text-sm font-medium">
                    🎉 You can start sending SMS and Email notifications immediately!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* API Key Card */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
              <CardTitle className="text-white text-2xl flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <Key className="h-6 w-6 text-green-400" />
                </div>
                <span>Your API Key</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="p-4 bg-black/30 border border-white/10 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <code className="text-sm text-gray-300 break-all font-mono">{apiKey}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyApiKey}
                      className="ml-2 flex-shrink-0 bg-teal-500/20 border-teal-500/30 text-teal-300 hover:bg-teal-500/30"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 backdrop-blur-xl rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    </div>
                    <span className="text-amber-300 font-medium">
                      Copy this API key now! It won&apos;t be shown again.
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    Redirecting to dashboard in 5 seconds...
                  </p>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-600 h-1 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Back Button */}
        <div className="text-center">
          <Link href="/signup" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Regular Signup
          </Link>
        </div>

        {/* Promo Banner */}
        <Card className={`bg-gradient-to-r ${promoConfig.backgroundColor}/20 border border-white/10 rounded-3xl`}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Gift className={`h-8 w-8 text-${promoConfig.iconColor}`} />
              <h1 className="text-2xl font-bold text-white">{promoConfig.name}</h1>
            </div>
            <p className="text-gray-300 mb-4">{promoConfig.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/20 rounded-xl p-3">
                <div className="text-2xl font-bold text-blue-400">{promoConfig.smsCredits.toLocaleString()}</div>
                <div className="text-sm text-gray-300">SMS Credits</div>
              </div>
              <div className="bg-orange-500/20 rounded-xl p-3">
                <div className="text-2xl font-bold text-orange-400">{promoConfig.emailCredits.toLocaleString()}</div>
                <div className="text-sm text-gray-300">Email Credits</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                Valid until {new Date(promoConfig.validUntil).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Badge>
              
              {timeLeft && (
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-3">
                  <div className="text-center">
                    <p className="text-red-300 text-sm font-medium mb-2">⏰ Limited Time Offer</p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-black/30 rounded-lg p-2">
                        <div className="text-lg font-bold text-white">{timeLeft.days}</div>
                        <div className="text-xs text-gray-300">Days</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-2">
                        <div className="text-lg font-bold text-white">{timeLeft.hours}</div>
                        <div className="text-xs text-gray-300">Hours</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-2">
                        <div className="text-lg font-bold text-white">{timeLeft.minutes}</div>
                        <div className="text-xs text-gray-300">Mins</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-2">
                        <div className="text-lg font-bold text-white">{timeLeft.seconds}</div>
                        <div className="text-xs text-gray-300">Secs</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Signup Form */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
            <CardTitle className="text-white text-2xl flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <UserPlus className="h-6 w-6 text-green-400" />
              </div>
              <span>Sign Up</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 backdrop-blur-xl rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-500/20 rounded-xl">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-red-300 font-medium">Registration Failed</span>
                      <p className="text-red-200 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Label htmlFor="name" className="text-gray-300 font-medium">Full Name</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    {...form.register('name')}
                    type="text"
                    maxLength={100}
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 pl-10 focus:border-green-500 focus:ring-green-500/20"
                    placeholder="Enter your full name"
                  />
                </div>
                {form.formState.errors.name && (
                  <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    {...form.register('email')}
                    type="email"
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 pl-10 focus:border-green-500 focus:ring-green-500/20"
                    placeholder="Enter your email"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-gray-300 font-medium">Phone Number</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    {...form.register('phone')}
                    type="tel"
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 pl-10 focus:border-green-500 focus:ring-green-500/20"
                    placeholder="+233244123456"
                  />
                </div>
                {form.formState.errors.phone && (
                  <p className="text-red-400 text-sm">{form.formState.errors.phone.message}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="company_name" className="text-gray-300 font-medium">Company Name</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    {...form.register('company_name')}
                    type="text"
                    maxLength={100}
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 pl-10 focus:border-green-500 focus:ring-green-500/20"
                    placeholder="Enter your company name"
                  />
                </div>
                {form.formState.errors.company_name && (
                  <p className="text-red-400 text-sm">{form.formState.errors.company_name.message}</p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-12 text-lg font-medium shadow-lg shadow-green-500/25 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing up...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>Signup</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
