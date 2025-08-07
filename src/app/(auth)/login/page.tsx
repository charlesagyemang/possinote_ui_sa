'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { AuthService } from '@/lib/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Shield } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await AuthService.login(data.email, data.password);
      login(response.token, response.user);
      window.location.href = '/dashboard';
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              PossiNotify
            </h1>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-gray-400 mt-2">Sign in to your account to continue</p>
          </div>
        </div>
        
        {/* Login Form */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
            <CardTitle className="text-white text-2xl flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <span>Sign In</span>
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
                <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    {...form.register('email')}
                    type="email"
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 pl-10 focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="Enter your email"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    {...form.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 pl-10 pr-10 focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl h-12 text-lg font-medium shadow-lg shadow-blue-500/25 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Don't have an account?{' '}
                <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Create one now
                </Link>
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
            <h3 className="text-white font-medium text-sm">Fast & Reliable</h3>
            <p className="text-gray-400 text-xs mt-1">Lightning-fast API delivery</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-white/10">
            <div className="p-2 bg-green-500/20 rounded-xl w-fit mx-auto mb-3">
              <Shield className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-white font-medium text-sm">Secure</h3>
            <p className="text-gray-400 text-xs mt-1">Enterprise-grade security</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-white/10">
            <div className="p-2 bg-purple-500/20 rounded-xl w-fit mx-auto mb-3">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-white font-medium text-sm">Scalable</h3>
            <p className="text-gray-400 text-xs mt-1">Grows with your business</p>
          </div>
        </div>
      </div>
    </div>
  );
} 