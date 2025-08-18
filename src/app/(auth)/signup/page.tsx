'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Customer } from '@/types';
import { AuthService } from '@/lib/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UserPlus, Key, Copy, Check, ArrowLeft, Zap, Mail, Phone, Building, User, Sparkles, Shield, CheckCircle, CreditCard } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PaystackService, PaystackResponse } from '@/lib/services/paystack';
import { useToast } from '@/components/ui/toast';
import { NotificationService } from '@/lib/services/notifications';

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

const plans = {
  free: { name: 'Free', initial_credits: 10, price: '₵0', description: '5 emails, 5 SMS - Perfect for testing' },
  starter: { name: 'Starter', initial_credits: 2000, price: '₵99', description: '1,000 emails, 1,000 SMS - Great for growing businesses' },
  business: { name: 'Business', initial_credits: 10000, price: '₵399', description: '5,000 emails, 5,000 SMS - For established businesses' },
  enterprise: { name: 'Enterprise', initial_credits: 20000, price: '₵799', description: '10,000 emails, 10,000 SMS - For large-scale operations' }
};

export default function SignupPage() {
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'starter';
  const { showToast } = useToast();
  
  // No mapping needed since we're using plan IDs directly
  const planType = selectedPlan as 'free' | 'starter' | 'business' | 'enterprise';
  
  // Get the actual initial credits for each plan type (what the API gives)
  const getPlanInitialCredits = (planType: string): number => {
    switch (planType) {
      case 'free':
        return 10;
      case 'starter':
        return 2000;
      case 'business':
        return 10000;
      case 'enterprise':
        return 20000;
      default:
        return 2000;
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [initialCredits, setInitialCredits] = useState(0);
  
  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company_name: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);
    
    // For free plan, proceed directly with registration
    if (planType === 'free') {
      try {
        const response = await AuthService.register({
          customer: {
            ...data,
            plan_type: planType,
            monthly_limit: getPlanInitialCredits(planType)
          }
        });
          
          console.log('🔍 AuthService response:', response);
          
          if (response.success) {
            setSuccess(true);
            setApiKey(response.api_key || '');
            setInitialCredits(response.initial_credits || 0);
            
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
            NotificationService.sendSignupNotification({
              customerName: data.name,
              customerEmail: data.email,
              customerPhone: data.phone,
              companyName: data.company_name,
              planType: planType,
              initialCredits: response.initial_credits || 0
            }).then((signupResult) => {
              console.log('✅ Signup notification result:', signupResult);
            }).catch((error) => {
              console.error('❌ Failed to send signup notification:', error);
            });

            // Send welcome notification to new customer
            NotificationService.sendWelcomeNotification({
              customerName: data.name,
              customerEmail: data.email,
              customerPhone: data.phone,
              companyName: data.company_name,
              planType: planType,
              initialCredits: response.initial_credits || 0,
              apiKey: response.api_key || ''
            }).then((welcomeResult) => {
              console.log('✅ Welcome notification result:', welcomeResult);
            }).catch((error) => {
              console.error('❌ Failed to send welcome notification:', error);
            });
            
            // Redirect to dashboard after 5 seconds
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 5000);
          } else {
            // Handle unsuccessful response from AuthService
            console.log('🔍 Registration failed:', response.message);
            setError(response.message || 'Registration failed. Please try again.');
            
            // Show toast notification
            showToast('error', 'Registration Failed', response.message || 'Registration failed. Please try again.');
            
            // If it's an email conflict, clear the email field for easy retry
            if (response.message && response.message.includes('Email has already been taken')) {
              form.setValue('email', '');
            }
          }
        } catch (error: unknown) {
          console.log('🔍 Free plan signup error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';
          console.log('🔍 Setting error message:', errorMessage);
          setError(errorMessage);
          
          // Show toast notification
          showToast('error', 'Registration Failed', errorMessage);
          
          // If it's an email conflict, clear the email field for easy retry
          if (errorMessage.includes('Email has already been taken')) {
            form.setValue('email', '');
          }
        } finally {
          setIsLoading(false);
        }
      return;
    }
    
    // For paid plans, process payment first
    try {
      setIsProcessingPayment(true);
      
      const selectedPlan = plans[planType];
      const amountInCedi = parseFloat(selectedPlan.price.replace('₵', ''));
      const amountInPesewas = PaystackService.convertToKobo(amountInCedi);
      const reference = PaystackService.generateReference();
      
      // Make email unique to prevent Paystack spam detection
      const uniqueEmail = `${data.email.split('@')[0]}+${Date.now()}@${data.email.split('@')[1]}`;
      
      await PaystackService.initializePayment({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: uniqueEmail,
        amount: amountInPesewas,
        currency: 'GHS',
        ref: reference,
        callback: (response: PaystackResponse) => {
          console.log('Payment successful:', response);
          
          // Only proceed with registration if payment is successful
          AuthService.register({
            customer: {
              ...data,
              plan_type: planType,
              monthly_limit: getPlanInitialCredits(planType)
            }
          }).then((regResponse) => {
            console.log('🔍 Paid plan AuthService response:', regResponse);
            
            if (regResponse.success) {
              setSuccess(true);
              setApiKey(regResponse.api_key || '');
              setInitialCredits(regResponse.initial_credits || 0);
              
              // Store the API key in localStorage
              localStorage.setItem('api_token', regResponse.api_key || '');
              
              // Update auth store
              const login = useAuthStore.getState().login;
              if (regResponse.customer && regResponse.api_key) {
                login(regResponse.api_key, regResponse.customer as Customer);
              }
              
              // Send signup notification to sales team
              NotificationService.sendSignupNotification({
                customerName: data.name,
                customerEmail: data.email,
                customerPhone: data.phone,
                companyName: data.company_name,
                planType: planType,
                initialCredits: regResponse.initial_credits || 0
              }).then(() => {
                console.log('✅ Signup notification sent successfully');
              }).catch((error) => {
                console.error('❌ Failed to send signup notification:', error);
              });

              // Send welcome notification to new customer
              NotificationService.sendWelcomeNotification({
                customerName: data.name,
                customerEmail: data.email,
                customerPhone: data.phone,
                companyName: data.company_name,
                planType: planType,
                initialCredits: regResponse.initial_credits || 0,
                apiKey: regResponse.api_key || ''
              }).then(() => {
                console.log('✅ Welcome notification sent successfully');
              }).catch((error) => {
                console.error('❌ Failed to send welcome notification:', error);
              });
              
              // Redirect to dashboard after 5 seconds
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 5000);
            } else {
              // Handle unsuccessful response from AuthService
              console.log('🔍 Paid plan registration failed:', regResponse.message);
              setError(regResponse.message || 'Registration failed after payment. Please contact support.');
              
                          // Show toast notification
            showToast('error', 'Registration Failed', regResponse.message || 'Registration failed after payment. Please contact support.');
              
              // If it's an email conflict, clear the email field for easy retry
              if (regResponse.message && regResponse.message.includes('Email has already been taken')) {
                form.setValue('email', '');
              }
            }
          }).catch((error) => {
            console.log('🔍 Paid plan registration error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Registration failed after payment. Please contact support.';
            console.log('🔍 Setting error message:', errorMessage);
            setError(errorMessage);
            
            // Show toast notification
            showToast('error', 'Registration Failed', errorMessage);
            
            // If it's an email conflict, clear the email field for easy retry
            if (errorMessage.includes('Email has already been taken')) {
              form.setValue('email', '');
            }
          }).finally(() => {
            setIsLoading(false);
          });
        },
        onClose: () => {
          console.log('Payment cancelled by user');
          setIsProcessingPayment(false);
          setIsLoading(false);
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed. Please try again.';
      setError(errorMessage);
      
      // Show toast notification
      showToast('error', 'Payment Failed', errorMessage);
      
      setIsProcessingPayment(false);
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
              <h2 className="text-2xl font-bold text-white">Account Created!</h2>
              <p className="text-green-400 mt-2">Your PossiNote account has been created successfully.</p>
            </div>
          </div>
          
          {/* Initial Credits Card */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-white/10">
              <CardTitle className="text-white text-xl flex items-center space-x-3">
                <div className="p-2 bg-teal-500/20 rounded-xl">
                  <CreditCard className="h-5 w-5 text-teal-400" />
                </div>
                <span>Welcome Bonus</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-teal-400">
                  {initialCredits.toLocaleString()} Credits
                </div>
                <p className="text-gray-400 text-sm">
                  Your account comes with {initialCredits.toLocaleString()} initial credits to get you started!
                </p>
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-3">
                  <p className="text-green-300 text-sm font-medium">
                    🎉 You can start sending SMS and Email notifications immediately!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
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
                      <Shield className="h-4 w-4 text-amber-400" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/pricing" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing
          </Link>
          
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              PossiNote
            </h1>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="text-gray-400 mt-2">Join PossiNote and start sending notifications</p>
          </div>
          
          {/* Selected Plan Display */}
          <div className="p-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{plans[selectedPlan as keyof typeof plans].name}</h3>
                <p className="text-sm text-gray-400">
                  {plans[selectedPlan as keyof typeof plans].initial_credits.toLocaleString()} initial credits
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {plans[selectedPlan as keyof typeof plans].description}
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-0">
                {plans[selectedPlan as keyof typeof plans].price}
              </Badge>
            </div>
          </div>
        </div>
        
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
                      <Shield className="h-4 w-4 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-red-300 font-medium">Registration Failed</span>
                      <p className="text-red-200 text-sm mt-1">{error}</p>
                      {error.includes('Email has already been taken') && (
                        <p className="text-yellow-200 text-sm mt-2">
                          💡 Try using a different email address or <a href="/login" className="underline">sign in</a> if you already have an account.
                        </p>
                      )}
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
                <p className="text-xs text-gray-500">2-100 characters</p>
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
                <p className="text-xs text-gray-500">Enter phone number in international format (e.g., +233244123456)</p>
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
                <p className="text-xs text-gray-500">2-100 characters</p>
                {form.formState.errors.company_name && (
                  <p className="text-red-400 text-sm">{form.formState.errors.company_name.message}</p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={isLoading || isProcessingPayment}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-12 text-lg font-medium shadow-lg shadow-green-500/25 transition-all duration-300"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing Payment...</span>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {planType === 'free' ? (
                      <>
                        <UserPlus className="h-5 w-5" />
                        <span>Create Account</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        <span>Pay & Create Account</span>
                      </>
                    )}
                  </div>
                )}
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-center">
                Already have an account? <a href="/login" className="text-purple-400 hover:text-purple-300">Sign in</a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="text-center p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10">
            <div className="p-2 bg-blue-500/20 rounded-xl w-fit mx-auto mb-3">
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-white font-medium text-sm">Instant Setup</h3>
            <p className="text-gray-400 text-xs mt-1">Get started in minutes</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-white/10">
            <div className="p-2 bg-green-500/20 rounded-xl w-fit mx-auto mb-3">
              <Shield className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-white font-medium text-sm">Secure & Reliable</h3>
            <p className="text-gray-400 text-xs mt-1">Enterprise-grade infrastructure</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-white/10">
            <div className="p-2 bg-purple-500/20 rounded-xl w-fit mx-auto mb-3">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-white font-medium text-sm">24/7 Support</h3>
            <p className="text-gray-400 text-xs mt-1">Always here to help</p>
          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      
    </div>
  );
} 