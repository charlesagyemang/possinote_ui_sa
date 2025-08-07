'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiKeyService } from '@/lib/services/apiKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Copy, Trash2, Key, Calendar, CheckCircle, XCircle, Shield } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: {
    sms: string[];
    email: string[];
    analytics: string[];
    api_keys: string[];
    senders: string[];
  };
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  permissions: z.object({
    sms: z.array(z.string()),
    email: z.array(z.string()),
    analytics: z.array(z.string()),
    api_keys: z.array(z.string()),
    senders: z.array(z.string()),
  }),
  expires_at: z.string().optional(),
});

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: '',
      permissions: {
        sms: ['read', 'write'],
        email: ['read', 'write'],
        analytics: ['read'],
        api_keys: ['read', 'write'],
        senders: ['read', 'write'],
      },
      expires_at: '',
    },
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      console.log('Making API call to /api_keys');
      const response = await ApiKeyService.getApiKeys();
      console.log('API response for /api_keys:', response);
      setApiKeys(response.data?.api_keys || []);
      console.log('Processed API keys data:', response.data?.api_keys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      setErrorMessage('Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof apiKeySchema>) => {
    try {
      await ApiKeyService.createApiKey(data);
      setSuccessMessage('API key created successfully!');
      setShowCreateForm(false);
      form.reset();
      fetchApiKeys();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create API key';
      setErrorMessage(errorMessage);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      await ApiKeyService.revokeApiKey(id);
      setSuccessMessage('API key deleted successfully!');
      fetchApiKeys();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete API key';
      setErrorMessage(errorMessage);
    }
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400">Loading API keys...</p>
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
              <Key className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              API Keys
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Manage your API keys and permissions</p>
        </div>

        {/* Status Messages */}
        {successMessage && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-xl rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <span className="text-green-300 font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 backdrop-blur-xl rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-xl">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <span className="text-red-300 font-medium">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Create API Key Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl px-8 py-3 text-lg font-medium shadow-lg shadow-blue-500/25 transition-all duration-300"
          >
            <Plus className="h-5 w-5 mr-2" />
            {showCreateForm ? 'Cancel' : 'Create New API Key'}
          </Button>
        </div>

        {/* Create API Key Form */}
        {showCreateForm && (
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
              <CardTitle className="text-white text-2xl flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <Plus className="h-6 w-6 text-green-400" />
                </div>
                <span>Create New API Key</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-gray-300 font-medium">API Key Name</Label>
                  <Input
                    {...form.register('name')}
                    placeholder="My API Key"
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 focus:border-green-500 focus:ring-green-500/20"
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-300 font-medium">Permissions</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-blue-400" />
                        <span className="text-white font-medium">SMS</span>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.watch('permissions.sms').includes('read')}
                            onChange={(e) => {
                              const current = form.getValues('permissions.sms');
                              if (e.target.checked) {
                                form.setValue('permissions.sms', [...current, 'read']);
                              } else {
                                form.setValue('permissions.sms', current.filter(p => p !== 'read'));
                              }
                            }}
                            className="rounded border-white/20 bg-black/30 text-green-500 focus:ring-green-500/20"
                          />
                          <span className="text-gray-300">Read SMS</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.watch('permissions.sms').includes('write')}
                            onChange={(e) => {
                              const current = form.getValues('permissions.sms');
                              if (e.target.checked) {
                                form.setValue('permissions.sms', [...current, 'write']);
                              } else {
                                form.setValue('permissions.sms', current.filter(p => p !== 'write'));
                              }
                            }}
                            className="rounded border-white/20 bg-black/30 text-green-500 focus:ring-green-500/20"
                          />
                          <span className="text-gray-300">Write SMS</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-green-400" />
                        <span className="text-white font-medium">Email</span>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.watch('permissions.email').includes('read')}
                            onChange={(e) => {
                              const current = form.getValues('permissions.email');
                              if (e.target.checked) {
                                form.setValue('permissions.email', [...current, 'read']);
                              } else {
                                form.setValue('permissions.email', current.filter(p => p !== 'read'));
                              }
                            }}
                            className="rounded border-white/20 bg-black/30 text-green-500 focus:ring-green-500/20"
                          />
                          <span className="text-gray-300">Read Email</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.watch('permissions.email').includes('write')}
                            onChange={(e) => {
                              const current = form.getValues('permissions.email');
                              if (e.target.checked) {
                                form.setValue('permissions.email', [...current, 'write']);
                              } else {
                                form.setValue('permissions.email', current.filter(p => p !== 'write'));
                              }
                            }}
                            className="rounded border-white/20 bg-black/30 text-green-500 focus:ring-green-500/20"
                          />
                          <span className="text-gray-300">Write Email</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-purple-400" />
                        <span className="text-white font-medium">Analytics</span>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.watch('permissions.analytics').includes('read')}
                            onChange={(e) => {
                              const current = form.getValues('permissions.analytics');
                              if (e.target.checked) {
                                form.setValue('permissions.analytics', [...current, 'read']);
                              } else {
                                form.setValue('permissions.analytics', current.filter(p => p !== 'read'));
                              }
                            }}
                            className="rounded border-white/20 bg-black/30 text-green-500 focus:ring-green-500/20"
                          />
                          <span className="text-gray-300">Read Analytics</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-amber-400" />
                        <span className="text-white font-medium">API Keys</span>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.watch('permissions.api_keys').includes('read')}
                            onChange={(e) => {
                              const current = form.getValues('permissions.api_keys');
                              if (e.target.checked) {
                                form.setValue('permissions.api_keys', [...current, 'read']);
                              } else {
                                form.setValue('permissions.api_keys', current.filter(p => p !== 'read'));
                              }
                            }}
                            className="rounded border-white/20 bg-black/30 text-green-500 focus:ring-green-500/20"
                          />
                          <span className="text-gray-300">Read API Keys</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.watch('permissions.api_keys').includes('write')}
                            onChange={(e) => {
                              const current = form.getValues('permissions.api_keys');
                              if (e.target.checked) {
                                form.setValue('permissions.api_keys', [...current, 'write']);
                              } else {
                                form.setValue('permissions.api_keys', current.filter(p => p !== 'write'));
                              }
                            }}
                            className="rounded border-white/20 bg-black/30 text-green-500 focus:ring-green-500/20"
                          />
                          <span className="text-gray-300">Write API Keys</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-indigo-400" />
                        <span className="text-white font-medium">Senders</span>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.watch('permissions.senders').includes('read')}
                            onChange={(e) => {
                              const current = form.getValues('permissions.senders');
                              if (e.target.checked) {
                                form.setValue('permissions.senders', [...current, 'read']);
                              } else {
                                form.setValue('permissions.senders', current.filter(p => p !== 'read'));
                              }
                            }}
                            className="rounded border-white/20 bg-black/30 text-green-500 focus:ring-green-500/20"
                          />
                          <span className="text-gray-300">Read Senders</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={form.watch('permissions.senders').includes('write')}
                            onChange={(e) => {
                              const current = form.getValues('permissions.senders');
                              if (e.target.checked) {
                                form.setValue('permissions.senders', [...current, 'write']);
                              } else {
                                form.setValue('permissions.senders', current.filter(p => p !== 'write'));
                              }
                            }}
                            className="rounded border-white/20 bg-black/30 text-green-500 focus:ring-green-500/20"
                          />
                          <span className="text-gray-300">Write Senders</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-12 text-lg font-medium shadow-lg shadow-green-500/25 transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create API Key
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
            <CardTitle className="text-white text-2xl flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Key className="h-6 w-6 text-blue-400" />
              </div>
              <span>Your API Keys</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {apiKeys.length > 0 ? (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="border border-white/10 rounded-2xl p-6 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm hover:from-white/10 hover:to-white/15 transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-white font-medium text-lg">{apiKey.name}</h3>
                          <Badge 
                            variant={apiKey.is_active ? "default" : "destructive"}
                            className={apiKey.is_active ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-red-500/20 border-red-500/30 text-red-300"}
                          >
                            {apiKey.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400 text-sm">Key:</span>
                            <code className="bg-black/30 px-3 py-1 rounded-lg text-sm text-gray-300 font-mono">
                              {apiKey.key}...
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                              className="bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
                            >
                              {copiedKey === apiKey.id ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                            {apiKey.expires_at && (
                              <>
                                <span>•</span>
                                <span>Expires: {new Date(apiKey.expires_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {apiKey.permissions?.sms?.includes('read') && (
                            <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-300">
                              SMS Read
                            </Badge>
                          )}
                          {apiKey.permissions?.sms?.includes('write') && (
                            <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-300">
                              SMS Write
                            </Badge>
                          )}
                          {apiKey.permissions?.email?.includes('read') && (
                            <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300">
                              Email Read
                            </Badge>
                          )}
                          {apiKey.permissions?.email?.includes('write') && (
                            <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300">
                              Email Write
                            </Badge>
                          )}
                          {apiKey.permissions?.analytics?.includes('read') && (
                            <Badge variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                              Analytics Read
                            </Badge>
                          )}
                          {apiKey.permissions?.api_keys?.includes('read') && (
                            <Badge variant="outline" className="bg-amber-500/20 border-amber-500/30 text-amber-300">
                              API Keys Read
                            </Badge>
                          )}
                          {apiKey.permissions?.api_keys?.includes('write') && (
                            <Badge variant="outline" className="bg-amber-500/20 border-amber-500/30 text-amber-300">
                              API Keys Write
                            </Badge>
                          )}
                          {apiKey.permissions?.senders?.includes('read') && (
                            <Badge variant="outline" className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300">
                              Senders Read
                            </Badge>
                          )}
                          {apiKey.permissions?.senders?.includes('write') && (
                            <Badge variant="outline" className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300">
                              Senders Write
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteApiKey(apiKey.id)}
                        className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-gray-500/20 rounded-2xl w-fit mx-auto">
                    <Key className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-400">No API keys found</p>
                  <p className="text-sm text-gray-500">Create your first API key to get started</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10">
            <CardTitle className="text-white text-xl flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <span>Security Best Practices</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Keep your API keys secure and never share them publicly</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Use environment variables to store API keys in your applications</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Regularly rotate your API keys for enhanced security</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Only grant the minimum permissions necessary for each key</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 