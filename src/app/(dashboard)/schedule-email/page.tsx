'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Clock, 
  Send, 
  Upload, 
  FileText, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  AtSign
} from 'lucide-react';
import { SchedulingService, ScheduledEmail, BulkScheduledEmail } from '@/lib/services/scheduling';
import { usePaymentRequired } from '@/components/PaymentRequiredProvider';
import { useToast } from '@/components/ui/toast';

export default function ScheduleEmailPage() {
  const { showPaymentRequired } = usePaymentRequired();
  const { showToast } = useToast();
  
  // Single Email state
  const [singleEmail, setSingleEmail] = useState<Partial<ScheduledEmail>>({
    recipient: '',
    subject: '',
    content: '',
    sender_name: '',
    scheduled_at: ''
  });

  // Bulk Email state
  const [bulkEmail, setBulkEmail] = useState<Partial<BulkScheduledEmail>>({
    subject: '',
    content: '',
    sender_name: '',
    scheduled_at: '',
    recipients: []
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string>('');
  const [csvSuccess, setCsvSuccess] = useState<string>('');

  const handleSingleEmailSchedule = async () => {
    if (!singleEmail.recipient || !singleEmail.subject || !singleEmail.content || !singleEmail.sender_name || !singleEmail.scheduled_at) {
      showToast('error', 'Validation Error', 'Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(singleEmail.recipient)) {
      showToast('error', 'Validation Error', 'Please enter a valid email address');
      return;
    }

    // Validate scheduled time is in the future
    const scheduledTime = new Date(singleEmail.scheduled_at);
    if (scheduledTime <= new Date()) {
      showToast('error', 'Validation Error', 'Scheduled time must be in the future');
      return;
    }

    try {
      setIsLoading(true);
      const response = await SchedulingService.scheduleEmail(singleEmail as ScheduledEmail);
      
      if (response.success) {
        showToast('success', 'Email Scheduled', `Email scheduled successfully for ${new Date(singleEmail.scheduled_at!).toLocaleString()}`);
        // Reset form
        setSingleEmail({
          recipient: '',
          subject: '',
          content: '',
          sender_name: '',
          scheduled_at: ''
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule email';
      console.error('Failed to schedule email:', error);
      
      // Handle 402 Payment Required error
      if (errorMessage.includes('Insufficient credits')) {
        showPaymentRequired(
          errorMessage || 'Insufficient credits to schedule email. Please reload your account.',
          '/usage'
        );
        return;
      }
      
      showToast('error', 'Scheduling Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkEmailSchedule = async () => {
    if (!bulkEmail.subject || !bulkEmail.content || !bulkEmail.sender_name || !bulkEmail.scheduled_at || !bulkEmail.recipients || bulkEmail.recipients.length === 0) {
      showToast('error', 'Validation Error', 'Please fill in all required fields and upload CSV data');
      return;
    }

    // Validate scheduled time is in the future
    const scheduledTime = new Date(bulkEmail.scheduled_at);
    if (scheduledTime <= new Date()) {
      showToast('error', 'Validation Error', 'Scheduled time must be in the future');
      return;
    }

    try {
      setIsLoading(true);
      const response = await SchedulingService.scheduleBulkEmail(bulkEmail as BulkScheduledEmail);
      
      if (response.success) {
        showToast('success', 'Bulk Email Scheduled', `${response.data.scheduled_count} email messages scheduled successfully for ${new Date(bulkEmail.scheduled_at!).toLocaleString()}`);
        // Reset form
        setBulkEmail({
          subject: '',
          content: '',
          sender_name: '',
          scheduled_at: '',
          recipients: []
        });
        setCsvData([]);
        setCsvFile(null);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule bulk email';
      console.error('Failed to schedule bulk email:', error);
      
      // Handle 402 Payment Required error
      if (errorMessage.includes('Insufficient credits')) {
        showPaymentRequired(
          errorMessage || 'Insufficient credits to schedule bulk email. Please reload your account.',
          '/usage'
        );
        return;
      }
      
      showToast('error', 'Bulk Scheduling Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setCsvError('Please upload a valid CSV file');
      return;
    }

    setCsvFile(file);
    setCsvError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Validate headers
        const requiredHeaders = ['email'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setCsvError(`Missing required columns: ${missingHeaders.join(', ')}`);
          return;
        }

        const data: string[] = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim());
          if (values.length >= 1) {
            const email = values[headers.indexOf('email')];
            if (emailRegex.test(email)) {
              data.push(email);
            }
          }
        }

        if (data.length === 0) {
          setCsvError('No valid email addresses found in CSV file');
          return;
        }

        setCsvData(data);
        setBulkEmail(prev => ({ ...prev, recipients: data }));
        setCsvSuccess(`Successfully loaded ${data.length} email addresses from CSV`);
        
        setTimeout(() => setCsvSuccess(''), 3000);
             } catch (error: unknown) {
         setCsvError('Failed to parse CSV file');
       }
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const csvContent = 'email\nuser1@example.com\nuser2@example.com\nuser3@example.com';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_email_schedule.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Minimum 1 minute from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Schedule Email
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Schedule email messages for future delivery</p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="single" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
            <TabsTrigger value="single" className="data-[state=active]:bg-gradient-to-r from-teal-600 to-emerald-600">
              <Send className="h-4 w-4 mr-2" />
              Single Email
            </TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-gradient-to-r from-teal-600 to-emerald-600">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Email
            </TabsTrigger>
          </TabsList>

          {/* Single Email Tab */}
          <TabsContent value="single" className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-white/10">
                <CardTitle className="text-white text-xl flex items-center space-x-3">
                  <div className="p-2 bg-teal-500/20 rounded-xl">
                    <Mail className="h-5 w-5 text-teal-400" />
                  </div>
                  <span>Schedule Single Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recipient" className="text-gray-300">Recipient Email</Label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="recipient"
                          type="email"
                          placeholder="user@example.com"
                          value={singleEmail.recipient}
                          onChange={(e) => setSingleEmail(prev => ({ ...prev, recipient: e.target.value }))}
                          className="pl-10 bg-black/30 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="sender_name" className="text-gray-300">Sender Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="sender_name"
                          type="text"
                          placeholder="Your Company"
                          value={singleEmail.sender_name}
                          onChange={(e) => setSingleEmail(prev => ({ ...prev, sender_name: e.target.value }))}
                          className="pl-10 bg-black/30 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="scheduled_at" className="text-gray-300">Schedule Date & Time</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="scheduled_at"
                          type="datetime-local"
                          min={getMinDateTime()}
                          value={singleEmail.scheduled_at}
                          onChange={(e) => setSingleEmail(prev => ({ ...prev, scheduled_at: e.target.value }))}
                          className="pl-10 bg-black/30 border-white/20 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subject" className="text-gray-300">Email Subject</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="Your email subject"
                        value={singleEmail.subject}
                        onChange={(e) => setSingleEmail(prev => ({ ...prev, subject: e.target.value }))}
                        className="bg-black/30 border-white/20 text-white placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <Label htmlFor="content" className="text-gray-300">Email Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Enter your email content..."
                        value={singleEmail.content}
                        onChange={(e) => setSingleEmail(prev => ({ ...prev, content: e.target.value }))}
                        className="bg-black/30 border-white/20 text-white placeholder-gray-400 min-h-[200px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={handleSingleEmailSchedule}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl px-8 py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule Email
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Email Tab */}
          <TabsContent value="bulk" className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-white/10">
                <CardTitle className="text-white text-xl flex items-center space-x-3">
                  <div className="p-2 bg-teal-500/20 rounded-xl">
                    <Upload className="h-5 w-5 text-teal-400" />
                  </div>
                  <span>Schedule Bulk Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulk_sender_name" className="text-gray-300">Sender Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="bulk_sender_name"
                          type="text"
                          placeholder="Your Company"
                          value={bulkEmail.sender_name}
                          onChange={(e) => setBulkEmail(prev => ({ ...prev, sender_name: e.target.value }))}
                          className="pl-10 bg-black/30 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bulk_scheduled_at" className="text-gray-300">Schedule Date & Time</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="bulk_scheduled_at"
                          type="datetime-local"
                          min={getMinDateTime()}
                          value={bulkEmail.scheduled_at}
                          onChange={(e) => setBulkEmail(prev => ({ ...prev, scheduled_at: e.target.value }))}
                          className="pl-10 bg-black/30 border-white/20 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bulk_subject" className="text-gray-300">Email Subject</Label>
                      <Input
                        id="bulk_subject"
                        type="text"
                        placeholder="Your email subject"
                        value={bulkEmail.subject}
                        onChange={(e) => setBulkEmail(prev => ({ ...prev, subject: e.target.value }))}
                        className="bg-black/30 border-white/20 text-white placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bulk_content" className="text-gray-300">Email Content</Label>
                      <Textarea
                        id="bulk_content"
                        placeholder="Enter your email content..."
                        value={bulkEmail.content}
                        onChange={(e) => setBulkEmail(prev => ({ ...prev, content: e.target.value }))}
                        className="bg-black/30 border-white/20 text-white placeholder-gray-400 min-h-[150px]"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Upload CSV File</Label>
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-teal-500/50 transition-colors">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-400">Click to upload CSV file</p>
                          <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                        </label>
                      </div>
                      
                      {csvFile && (
                        <div className="flex items-center space-x-2 mt-2">
                          <FileText className="h-4 w-4 text-teal-400" />
                          <span className="text-sm text-gray-300">{csvFile.name}</span>
                        </div>
                      )}

                      {csvError && (
                        <div className="flex items-center space-x-2 mt-2 text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">{csvError}</span>
                        </div>
                      )}

                      {csvSuccess && (
                        <div className="flex items-center space-x-2 mt-2 text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">{csvSuccess}</span>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        onClick={downloadSampleCSV}
                        className="mt-2 border-white/20 text-white hover:bg-white/10"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Download Sample CSV
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">CSV Preview</Label>
                      <div className="bg-black/30 border border-white/20 rounded-lg p-4 max-h-64 overflow-y-auto">
                        {csvData.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-400 font-medium mb-2">
                              Email Addresses
                            </div>
                            {csvData.slice(0, 10).map((email, index) => (
                              <div key={index} className="text-sm text-gray-300 border-b border-white/10 pb-2">
                                <span className="truncate">{email}</span>
                              </div>
                            ))}
                            {csvData.length > 10 && (
                              <div className="text-xs text-gray-500 text-center pt-2">
                                ... and {csvData.length - 10} more email addresses
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <FileText className="h-8 w-8 mx-auto mb-2" />
                            <p>Upload a CSV file to see preview</p>
                          </div>
                        )}
                      </div>
                      
                      {csvData.length > 0 && (
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-400">
                            {csvData.length} email addresses loaded
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {csvData.length} Emails
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={handleBulkEmailSchedule}
                    disabled={isLoading || csvData.length === 0}
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl px-8 py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule Bulk Email ({csvData.length})
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
