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
import { UserPlus, Key, Copy, Check, ArrowLeft, Zap, Mail, Phone, Building, User, Sparkles, Shield, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  company_name: z.string().min(1, 'Company name is required'),
});

const plans = {
  free: { name: 'Free', monthly_limit: 100, price: '₵0' },
  starter: { name: 'Starter', monthly_limit: 1000, price: '₵29' },
  business: { name: 'Business', monthly_limit: 10000, price: '₵99' },
  enterprise: { name: 'Enterprise', monthly_limit: 1000000, price: 'Custom' }
};

export default function SignupPage() {
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'starter';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  
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
    
    try {
      const response = await AuthService.register({
        ...data,
        plan_type: selectedPlan as 'free' | 'starter' | 'business' | 'enterprise',
        monthly_limit: plans[selectedPlan as keyof typeof plans].monthly_limit
      });
      
      if (response.success) {
        setSuccess(true);
        setApiKey(response.api_key || '');
        
        // Store the API key in localStorage
        localStorage.setItem('api_token', response.api_key || '');
        
        // Update auth store
        const login = useAuthStore.getState().login;
        if (response.customer && response.api_key) {
          login(response.api_key, response.customer as Customer);
        }
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      setError(errorMessage);
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
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
              <p className="text-green-400 mt-2">Your PossiNotify account has been created successfully.</p>
            </div>
          </div>
          
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
                      className="ml-2 flex-shrink-0 bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
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
                    Redirecting to dashboard in 3 seconds...
                  </p>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full animate-pulse"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/pricing" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing
          </Link>
          
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              PossiNotify
            </h1>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="text-gray-400 mt-2">Join PossiNotify and start sending notifications</p>
          </div>
          
          {/* Selected Plan Display */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{plans[selectedPlan as keyof typeof plans].name} Plan</h3>
                <p className="text-sm text-gray-400">
                  {plans[selectedPlan as keyof typeof plans].monthly_limit.toLocaleString()} SMS/Email per month
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
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
                    <span className="text-red-300 font-medium">{error}</span>
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
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>Create Account</span>
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
    </div>
  );
} 