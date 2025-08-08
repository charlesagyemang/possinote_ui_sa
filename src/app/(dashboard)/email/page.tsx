'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Send, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle,
  Upload,
  Download,
  Trash2
} from 'lucide-react';
import { EmailService } from '@/lib/services/email';
import { usePaymentRequired } from '@/components/PaymentRequiredProvider';

interface EmailResult {
  email: string;
  success: boolean;
  message_id?: string;
  submitted_at?: string;
  error?: string;
}

export default function EmailPage() {
  const { showPaymentRequired } = usePaymentRequired();
  const [activeTab, setActiveTab] = useState('single');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Single email states
  const [singleEmail, setSingleEmail] = useState({
    recipient: '',
    subject: '',
    content: ''
  });

  // Bulk email states
  const [bulkEmails, setBulkEmails] = useState({
    recipients: '',
    subject: '',
    content: ''
  });
  const [bulkResults, setBulkResults] = useState<EmailResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    valid_emails: string[];
    invalid_emails: string[];
    total_count: number;
    valid_count: number;
    invalid_count: number;
  } | null>(null);

  const validateEmails = async () => {
    if (!bulkEmails.recipients.trim()) {
      setError('Please enter email addresses');
      return;
    }

    try {
      setIsValidating(true);
      setError(null);
      
      const emails = bulkEmails.recipients
        .split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const results = await EmailService.validateEmails(emails);
      setValidationResults(results);
      setSuccess(`Validation complete: ${results.valid_count} valid, ${results.invalid_count} invalid`);
    } catch (error: unknown) {
      console.error('Email validation failed:', error);
      setError('Failed to validate emails. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const sendSingleEmail = async () => {
    if (!singleEmail.recipient || !singleEmail.subject || !singleEmail.content) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await EmailService.sendEmail(
        singleEmail.recipient,
        singleEmail.subject,
        singleEmail.content
      );

      if (response.success) {
        const successMessage = response.message_id 
          ? `Email queued successfully! Message ID: ${response.message_id}`
          : response.message || 'Email sent successfully!';
        
        setSuccess(successMessage);
        setSingleEmail({ recipient: '', subject: '', content: '' });
      } else {
        setError(response.error || 'Failed to send email');
      }
    } catch (error: unknown) {
      console.error('Email send failed:', error);
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to send email. Please reload your account.',
            '/billing'
          );
          return;
        }
      }
      
      setError('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendBulkEmail = async () => {
    if (!bulkEmails.recipients || !bulkEmails.subject || !bulkEmails.content) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const recipients = bulkEmails.recipients
        .split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      console.log('📧 Bulk email recipients:', recipients);
      console.log('📧 Recipients count:', recipients.length);
      console.log('📧 Sample recipient:', recipients[0]);

      const response = await EmailService.sendBulkEmail(
        recipients,
        bulkEmails.subject,
        bulkEmails.content
      );

      if (response.success) {
        console.log('✅ BULK EMAIL SUCCESS RESPONSE:');
        console.log('📊 Full Response:', JSON.stringify(response, null, 2));
        console.log('📧 Queued Count:', response.queued_count);
        console.log('📋 Total Count:', response.total_count);
        console.log('🆔 Batch ID:', response.batch_id);
        console.log('📄 Message:', response.message);
        
        const successMessage = response.batch_id 
          ? `Bulk email queued successfully! Batch ID: ${response.batch_id}, Queued: ${response.queued_count}/${response.total_count}`
          : `Bulk email sent! ${response.queued_count || response.sent_count || 0} queued`;
        
        setSuccess(successMessage);
        setBulkResults(response.results || []);
        setBulkEmails({ recipients: '', subject: '', content: '' });
      } else {
        console.log('❌ BULK EMAIL ERROR RESPONSE:');
        console.log('📊 Full Response:', JSON.stringify(response, null, 2));
        console.log('🚨 Error Message:', response.error);
        
        setError(response.error || 'Failed to send bulk email');
      }
    } catch (error: unknown) {
      console.error('❌ BULK EMAIL NETWORK ERROR:');
      console.error('🚨 Error object:', error);
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to send bulk email. Please reload your account.',
            '/billing'
          );
          return;
        }
      }
      
      if (error instanceof Error) {
        console.error('📝 Error message:', error.message);
        console.error('📚 Error stack:', error.stack);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown; headers?: unknown } };
        console.error('🌐 Response status:', axiosError.response?.status);
        console.error('📄 Response data:', axiosError.response?.data);
        console.error('📋 Response headers:', axiosError.response?.headers);
      }
      setError('Failed to send bulk email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      console.log('📁 File content:', content);
      
      // Handle both comma-separated and newline-separated emails
      const emails: string[] = [];
      
      // First, split by newlines
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        // For each line, check if it contains commas
        if (line.includes(',')) {
          // Split by comma and add each email
          const lineEmails = line.split(',').map(email => email.trim()).filter(email => email.length > 0);
          emails.push(...lineEmails);
        } else {
          // Single email per line
          emails.push(line.trim());
        }
      }
      
      // Remove duplicates and filter out empty emails
      const uniqueEmails = [...new Set(emails)].filter(email => email.length > 0);
      
      console.log('📧 Processed emails:', uniqueEmails);
      
      // Join back with newlines for the textarea
      const emailText = uniqueEmails.join('\n');
      
      setBulkEmails(prev => ({ ...prev, recipients: emailText }));
    };
    reader.readAsText(file);
  };

  const exportResults = () => {
    if (bulkResults.length === 0) return;

    const csvContent = [
      'Email,Status,Message ID,Submitted At,Error',
      ...bulkResults.map(result => [
        result.email,
        result.success ? 'Success' : 'Failed',
        result.message_id || '',
        result.submitted_at || '',
        result.error || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'email_results.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearResults = () => {
    setBulkResults([]);
    setValidationResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Email Management</h1>
            <p className="text-gray-400">Send single emails or bulk emails to your recipients</p>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-300">{success}</span>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
            <TabsTrigger value="single" className="data-[state=active]:bg-purple-600">
              <Mail className="h-4 w-4 mr-2" />
              Single Email
            </TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-purple-600">
              <Users className="h-4 w-4 mr-2" />
              Bulk Email
            </TabsTrigger>
          </TabsList>

          {/* Single Email Tab */}
          <TabsContent value="single" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Send className="h-5 w-5 text-purple-400" />
                  <span>Send Single Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient" className="text-gray-300">Recipient Email</Label>
                    <Input
                      id="recipient"
                      type="email"
                      placeholder="recipient@example.com"
                      value={singleEmail.recipient}
                      onChange={(e) => setSingleEmail(prev => ({ ...prev, recipient: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-gray-300">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Email subject"
                      value={singleEmail.subject}
                      onChange={(e) => setSingleEmail(prev => ({ ...prev, subject: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-gray-300">Email Content (HTML)</Label>
                  <Textarea
                    id="content"
                    placeholder="<h1>Hello!</h1><p>This is your email content.</p>"
                    value={singleEmail.content}
                    onChange={(e) => setSingleEmail(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="bg-slate-700 border-slate-600 text-white font-mono"
                  />
                  <p className="text-sm text-gray-400">
                    You can use HTML tags for formatting
                  </p>
                </div>

                <Button 
                  onClick={sendSingleEmail} 
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="h-4 w-4" />
                      <span>Send Email</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Email Tab */}
          <TabsContent value="bulk" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  <span>Send Bulk Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-recipients" className="text-gray-300">Recipient Emails</Label>
                  <div className="flex space-x-2">
                    <Textarea
                      id="bulk-recipients"
                      placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
                      value={bulkEmails.recipients}
                      onChange={(e) => setBulkEmails(prev => ({ ...prev, recipients: e.target.value }))}
                      rows={4}
                      className="bg-slate-700 border-slate-600 text-white flex-1"
                    />
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={validateEmails}
                        disabled={isValidating}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        {isValidating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-400">
                    Enter one email per line, or upload a file
                  </p>
                </div>

                {validationResults && (
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                    <h4 className="text-white font-medium">Validation Results</h4>
                    <div className="flex space-x-4 text-sm">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        Valid: {validationResults.valid_count}
                      </Badge>
                      <Badge variant="secondary" className="bg-red-500/20 text-red-300">
                        Invalid: {validationResults.invalid_count}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                        Total: {validationResults.total_count}
                      </Badge>
                    </div>
                    {validationResults.invalid_emails.length > 0 && (
                      <div className="text-sm text-red-300">
                        <strong>Invalid emails:</strong> {validationResults.invalid_emails.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-subject" className="text-gray-300">Subject</Label>
                    <Input
                      id="bulk-subject"
                      placeholder="Bulk email subject"
                      value={bulkEmails.subject}
                      onChange={(e) => setBulkEmails(prev => ({ ...prev, subject: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulk-content" className="text-gray-300">Email Content (HTML)</Label>
                  <Textarea
                    id="bulk-content"
                    placeholder="<h1>Hello!</h1><p>This is your bulk email content.</p>"
                    value={bulkEmails.content}
                    onChange={(e) => setBulkEmails(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="bg-slate-700 border-slate-600 text-white font-mono"
                  />
                  <p className="text-sm text-gray-400">
                    You can use HTML tags for formatting
                  </p>
                </div>

                <Button 
                  onClick={sendBulkEmail} 
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending Bulk Email...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Send Bulk Email</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            {bulkResults.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-purple-400" />
                      <span>Bulk Email Results</span>
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportResults}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearResults}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {bulkResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.success
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white">{result.email}</span>
                          <Badge
                            variant="secondary"
                            className={
                              result.success
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-red-500/20 text-red-300'
                            }
                          >
                            {result.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                        {result.message_id && (
                          <p className="text-sm text-gray-400 mt-1">
                            ID: {result.message_id}
                          </p>
                        )}
                        {result.error && (
                          <p className="text-sm text-red-400 mt-1">
                            Error: {result.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
