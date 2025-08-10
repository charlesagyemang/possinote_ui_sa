'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthService } from '@/lib/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  api_key: z.string().min(1, 'API key is required'),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      api_key: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await AuthService.loginWithApiKey(data.api_key);
      
      if (response.success) {
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
          <p className="text-gray-400">Enter your API key to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="api_key" className="text-white">
                API Key
              </Label>
              <Input
                id="api_key"
                type="text"
                placeholder="Enter your API key"
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                {...form.register('api_key')}
              />
              {form.formState.errors.api_key && (
                <p className="text-red-400 text-sm">{form.formState.errors.api_key.message}</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400 text-center">
              Don&apos;t have an API key? <a href="/pricing" className="text-teal-400 hover:text-teal-300">Sign up</a> to get one.
            </p>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400 text-center">
              Need help? Contact us at <a href="mailto:support@possi.com" className="text-purple-400 hover:text-purple-300">support@possi.com</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 