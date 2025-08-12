'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Clock, 
  Send, 
  Upload, 
  FileText, 
  Calendar,
  Phone,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { SchedulingService, ScheduledSMS, BulkScheduledSMS } from '@/lib/services/scheduling';
import { SendersService, Sender } from '@/lib/services/senders';
import { usePaymentRequired } from '@/components/PaymentRequiredProvider';
import { useToast } from '@/components/ui/toast';

export default function ScheduleSMSPage() {
  const { showPaymentRequired } = usePaymentRequired();
  const { showToast } = useToast();
  
  // Single SMS state
  const [singleSMS, setSingleSMS] = useState<Partial<ScheduledSMS>>({
    recipient: '',
    message: '',
    sender_id: '',
    scheduled_at: ''
  });

  // Bulk SMS state
  const [bulkSMS, setBulkSMS] = useState<Partial<BulkScheduledSMS>>({
    sender_id: '',
    scheduled_at: '',
    messages: []
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'scheduled'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Array<{ recipient: string; message: string }>>([]);

  // Scheduled SMS state
  const [scheduledSMS, setScheduledSMS] = useState<ScheduledSMS[]>([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);
  const [scheduledFilters, setScheduledFilters] = useState({
    status: '',
    recipient: '',
    page: 1,
    per_page: 20
  });

  // Senders state
  const [senders, setSenders] = useState<Sender[]>([]);
  const [isLoadingSenders, setIsLoadingSenders] = useState(true);

  useEffect(() => {
    fetchSenders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchScheduledSMS();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledFilters]);



  const fetchSenders = useCallback(async () => {
    try {
      setIsLoadingSenders(true);
      const response = await SendersService.getSenders();
      if (response.success) {
        setSenders(response.data.senders);
      } else {
        showToast('error', 'Failed to Load Senders', 'Unable to load sender IDs. Please try again.');
      }
    } catch (error) {
      console.error('Failed to fetch senders:', error);
      showToast('error', 'Failed to Load Senders', 'Unable to load sender IDs. Please try again.');
    } finally {
      setIsLoadingSenders(false);
    }
  }, [showToast]);

  const fetchScheduledSMS = async () => {
    try {
      setIsLoadingScheduled(true);
      const response = await SchedulingService.getScheduledSMS(scheduledFilters);
      
      if (response.success) {
        setScheduledSMS(response.data.scheduled_messages);
      } else {
        showToast('error', 'Failed to Load Scheduled SMS', 'Unable to load scheduled SMS. Please try again.');
      }
    } catch (error) {
      console.error('Failed to fetch scheduled SMS:', error);
      showToast('error', 'Failed to Load Scheduled SMS', 'Unable to load scheduled SMS. Please try again.');
    } finally {
      setIsLoadingScheduled(false);
    }
  };

  const handleSingleSMSSchedule = async () => {
    if (!singleSMS.recipient || !singleSMS.message || !singleSMS.sender_id || !singleSMS.scheduled_at) {
      showToast('error', 'Validation Error', 'Please fill in all required fields');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(singleSMS.recipient)) {
      showToast('error', 'Invalid Phone Number', 'Please enter a valid phone number in international format (e.g., +233244123456)');
      return;
    }

    // Validate scheduled time is in the future
    const scheduledTime = new Date(singleSMS.scheduled_at);
    if (scheduledTime <= new Date()) {
      showToast('error', 'Validation Error', 'Scheduled time must be in the future');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🚀 Sending single SMS schedule request:', singleSMS);
      const response = await SchedulingService.scheduleSMS({
        scheduled_sms: {
          recipient: singleSMS.recipient,
          message: singleSMS.message,
          sender_id: singleSMS.sender_id,
          scheduled_at: singleSMS.scheduled_at!
        }
      });
      console.log('📡 Single SMS schedule API response:', response);
      
      if (response.success) {
        showToast('success', 'SMS Scheduled', `SMS scheduled successfully for ${new Date(singleSMS.scheduled_at!).toLocaleString()}`);
        // Reset form
        setSingleSMS({
          recipient: '',
          message: '',
          sender_id: '',
          scheduled_at: ''
        });
      } else {
        console.log('❌ Single SMS schedule failed - response not successful:', response);
        showToast('error', 'Scheduling Failed', response.error || 'Failed to schedule SMS');
      }
    } catch (error: unknown) {
      console.log('💥 Single SMS schedule error caught:', error);
      console.log('💥 Error type:', typeof error);
      console.log('💥 Error instanceof Error:', error instanceof Error);
      if (error instanceof Error) {
        console.log('💥 Error message:', error.message);
        console.log('💥 Error stack:', error.stack);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule SMS';
      console.error('Failed to schedule SMS:', error);
      
      // Handle 402 Payment Required error
      if (errorMessage.includes('Insufficient credits')) {
        showPaymentRequired(
          errorMessage || 'Insufficient credits to schedule SMS. Please reload your account.',
          '/usage'
        );
        return;
      }
      
      showToast('error', 'Scheduling Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSMSSchedule = async () => {
    if (!bulkSMS.sender_id || !bulkSMS.scheduled_at || !bulkSMS.messages || bulkSMS.messages.length === 0) {
      showToast('error', 'Validation Error', 'Please fill in all required fields and upload CSV data');
      return;
    }

    // Validate scheduled time is in the future
    const scheduledTime = new Date(bulkSMS.scheduled_at);
    if (scheduledTime <= new Date()) {
      showToast('error', 'Validation Error', 'Scheduled time must be in the future');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🚀 Sending bulk SMS schedule request:', bulkSMS);
      const response = await SchedulingService.scheduleBulkSMS({
        bulk_scheduled_sms: {
          sender_id: bulkSMS.sender_id,
          scheduled_at: bulkSMS.scheduled_at,
          messages: bulkSMS.messages
        }
      });
      console.log('📡 Bulk SMS schedule API response:', response);
      
      if (response.success) {
        showToast('success', 'Bulk SMS Scheduled', `${response.data.total_scheduled} SMS messages scheduled successfully for ${new Date(bulkSMS.scheduled_at!).toLocaleString()}`);
        // Reset form
        setBulkSMS({
          sender_id: '',
          scheduled_at: '',
          messages: []
        });
        setCsvData([]);
        setCsvFile(null);
      } else {
        console.log('❌ Bulk SMS schedule failed - response not successful:', response);
        showToast('error', 'Bulk Scheduling Failed', response.error || 'Failed to schedule bulk SMS');
      }
    } catch (error: unknown) {
      console.log('💥 Bulk SMS schedule error caught:', error);
      console.log('💥 Error type:', typeof error);
      console.log('💥 Error instanceof Error:', error instanceof Error);
      if (error instanceof Error) {
        console.log('💥 Error message:', error.message);
        console.log('💥 Error stack:', error.stack);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule bulk SMS';
      console.error('Failed to schedule bulk SMS:', error);
      
      // Handle 402 Payment Required error
      if (errorMessage.includes('Insufficient credits')) {
        showPaymentRequired(
          errorMessage || 'Insufficient credits to schedule bulk SMS. Please reload your account.',
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
      showToast('error', 'Invalid File', 'Please upload a valid CSV file');
      return;
    }

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Validate headers
        const requiredHeaders = ['recipient', 'message'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          showToast('error', 'Invalid CSV Format', `Missing required columns: ${missingHeaders.join(', ')}`);
          return;
        }

        const data: Array<{ recipient: string; message: string }> = [];
        
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        const invalidPhones: string[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim());
          if (values.length >= 2) {
            const recipient = values[headers.indexOf('recipient')];
            const message = values[headers.indexOf('message')];
            
            if (!phoneRegex.test(recipient)) {
              invalidPhones.push(recipient);
            }
            
            data.push({
              recipient,
              message
            });
          }
        }
        
        if (invalidPhones.length > 0) {
          showToast('error', 'Invalid Phone Numbers', `Found ${invalidPhones.length} invalid phone numbers in CSV. Please check the format.`);
          return;
        }

        if (data.length === 0) {
          showToast('error', 'No Data', 'No valid data found in CSV file');
          return;
        }

        setCsvData(data);
        setBulkSMS(prev => ({ ...prev, messages: data }));
        showToast('success', 'CSV Uploaded', `Successfully loaded ${data.length} recipients from CSV`);
             } catch {
         showToast('error', 'Parse Error', 'Failed to parse CSV file');
       }
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const csvContent = 'recipient,message\n+233244123456,Hello from PossiNote!\n+233244789012,Your scheduled message here';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_sms_schedule.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Minimum 1 minute from now
    return now.toISOString().slice(0, 16);
  };

  const handleCancelScheduledSMS = async (id: string) => {
    try {
      const response = await SchedulingService.cancelScheduledSMS(id);
      
      if (response.success) {
        showToast('success', 'SMS Cancelled', 'Scheduled SMS has been cancelled successfully');
        fetchScheduledSMS(); // Refresh the list
      } else {
        showToast('error', 'Cancellation Failed', response.error || 'Failed to cancel scheduled SMS');
      }
    } catch (error) {
      console.error('Failed to cancel scheduled SMS:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel scheduled SMS';
      showToast('error', 'Cancellation Failed', errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'sent':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
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
              Schedule SMS
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Schedule SMS messages for future delivery</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'single' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('single')}
                className={`rounded-xl px-6 py-3 transition-all duration-300 ${
                  activeTab === 'single'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Send className="h-4 w-4 mr-2" />
                Single SMS
              </Button>
              <Button
                variant={activeTab === 'bulk' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('bulk')}
                className={`rounded-xl px-6 py-3 transition-all duration-300 ${
                  activeTab === 'bulk'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk SMS
              </Button>
              <Button
                variant={activeTab === 'scheduled' ? 'default' : 'ghost'}
                onClick={() => {
                  setActiveTab('scheduled');
                  fetchScheduledSMS();
                }}
                className={`rounded-xl px-6 py-3 transition-all duration-300 ${
                  activeTab === 'scheduled'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Clock className="h-4 w-4 mr-2" />
                Scheduled SMS
              </Button>
            </div>
          </div>
        </div>

        {/* Single SMS Section */}
        {activeTab === 'single' && (
          <div className="space-y-8">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
                <CardTitle className="text-white text-2xl flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-blue-400" />
                  </div>
                  <span>Schedule Single SMS</span>
                </CardTitle>
                <p className="text-gray-400">Schedule a single SMS message for future delivery</p>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="recipient" className="text-gray-300 font-medium">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="recipient"
                          type="tel"
                          placeholder="+233244123456"
                          value={singleSMS.recipient}
                          onChange={(e) => setSingleSMS(prev => ({ ...prev, recipient: e.target.value }))}
                          className="pl-10 bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="sender_id" className="text-gray-300 font-medium">Sender ID</Label>
                      <select
                        id="sender_id"
                        value={singleSMS.sender_id}
                        onChange={(e) => setSingleSMS(prev => ({ ...prev, sender_id: e.target.value }))}
                        className="w-full bg-black/30 border border-white/20 text-white rounded-xl px-4 py-3 h-12 focus:border-blue-500 focus:ring-blue-500/20"
                        disabled={isLoadingSenders}
                      >
                        <option value="">{isLoadingSenders ? 'Loading senders...' : 'Select sender name'}</option>
                        <option value="Possitech">Possitech (Default)</option>
                        {senders
                          .filter(sender => sender.status === 'approved')
                          .map((sender) => (
                            <option key={sender.id} value={sender.name}>
                              {sender.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="scheduled_at" className="text-gray-300 font-medium">Schedule Date & Time</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="scheduled_at"
                          type="datetime-local"
                          min={getMinDateTime()}
                          value={singleSMS.scheduled_at}
                          onChange={(e) => setSingleSMS(prev => ({ ...prev, scheduled_at: e.target.value }))}
                          className="pl-10 bg-black/30 border-white/20 text-white rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="message" className="text-gray-300 font-medium">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Enter your SMS message..."
                        value={singleSMS.message}
                        onChange={(e) => setSingleSMS(prev => ({ ...prev, message: e.target.value }))}
                        className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                        maxLength={160}
                        rows={8}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-400">
                          {singleSMS.message?.length || 0}/160 characters
                        </p>
                        {singleSMS.message && (
                          <Badge variant="outline" className="text-xs bg-blue-500/20 border-blue-500/30 text-blue-300">
                            {Math.ceil((singleSMS.message?.length || 0) / 160)} SMS
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={handleSingleSMSSchedule}
                    disabled={isLoading || !singleSMS.recipient || !singleSMS.message || !singleSMS.scheduled_at}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl h-12 px-8 font-medium shadow-lg shadow-blue-500/25 transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5 mr-2" />
                        Schedule SMS
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk SMS Section */}
        {activeTab === 'bulk' && (
          <div className="space-y-8">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
                <CardTitle className="text-white text-2xl flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <Upload className="h-6 w-6 text-green-400" />
                  </div>
                  <span>Schedule Bulk SMS</span>
                </CardTitle>
                <p className="text-gray-400">Schedule multiple SMS messages for future delivery using CSV upload</p>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="bulk_sender_id" className="text-gray-300 font-medium">Sender ID</Label>
                      <select
                        id="bulk_sender_id"
                        value={bulkSMS.sender_id}
                        onChange={(e) => setBulkSMS(prev => ({ ...prev, sender_id: e.target.value }))}
                        className="w-full bg-black/30 border border-white/20 text-white rounded-xl px-4 py-3 h-12 focus:border-green-500 focus:ring-green-500/20"
                        disabled={isLoadingSenders}
                      >
                        <option value="">{isLoadingSenders ? 'Loading senders...' : 'Select sender name'}</option>
                        <option value="Possitech">Possitech (Default)</option>
                        {senders
                          .filter(sender => sender.status === 'approved')
                          .map((sender) => (
                            <option key={sender.id} value={sender.name}>
                              {sender.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="bulk_scheduled_at" className="text-gray-300 font-medium">Schedule Date & Time</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="bulk_scheduled_at"
                          type="datetime-local"
                          min={getMinDateTime()}
                          value={bulkSMS.scheduled_at}
                          onChange={(e) => setBulkSMS(prev => ({ ...prev, scheduled_at: e.target.value }))}
                          className="pl-10 bg-black/30 border-white/20 text-white rounded-xl h-12 focus:border-green-500 focus:ring-green-500/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-gray-300 font-medium">Upload CSV File</Label>
                      <div className="border-2 border-dashed border-green-500/30 rounded-2xl p-8 text-center bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:border-green-500/50 transition-colors">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer">
                          <Upload className="h-12 w-12 mx-auto text-green-400 mb-4" />
                          <p className="text-gray-300 mb-2 text-lg">Drag and drop a CSV file here, or click to select</p>
                          <p className="text-sm text-gray-400">CSV must contain &apos;recipient&apos; and &apos;message&apos; columns</p>
                        </label>
                      </div>
                      
                      {csvFile && (
                        <div className="flex items-center space-x-2 mt-2">
                          <FileText className="h-4 w-4 text-teal-400" />
                          <span className="text-sm text-gray-300">{csvFile.name}</span>
                        </div>
                      )}



                      <Button
                        variant="outline"
                        onClick={downloadSampleCSV}
                        className="mt-4 w-full border-green-500/30 text-green-300 hover:bg-green-500/10 rounded-xl h-10"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Download Sample CSV
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-gray-300 font-medium">CSV Preview</Label>
                      <div className="bg-black/30 border border-white/20 rounded-xl p-6 max-h-80 overflow-y-auto">
                        {csvData.length > 0 ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 font-medium border-b border-white/10 pb-2">
                              <span>Recipient</span>
                              <span>Message</span>
                            </div>
                            {csvData.slice(0, 8).map((row, index) => (
                              <div key={index} className="grid grid-cols-2 gap-4 text-sm text-gray-300 border-b border-white/10 pb-2">
                                <span className="truncate font-mono">{row.recipient}</span>
                                <span className="truncate">{row.message}</span>
                              </div>
                            ))}
                            {csvData.length > 8 && (
                              <div className="text-xs text-gray-500 text-center pt-2">
                                ... and {csvData.length - 8} more rows
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-12">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg">Upload a CSV file to see preview</p>
                            <p className="text-sm mt-1">Your data will appear here once uploaded</p>
                          </div>
                        )}
                      </div>
                      
                      {csvData.length > 0 && (
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-400">
                            {csvData.length} recipients loaded
                          </p>
                          <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500/30 text-green-300">
                            {csvData.length} SMS
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={handleBulkSMSSchedule}
                    disabled={isLoading || csvData.length === 0 || !bulkSMS.sender_id || !bulkSMS.scheduled_at}
                    className="w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-12 px-8 font-medium shadow-lg shadow-green-500/25 transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5 mr-2" />
                        Schedule Bulk SMS ({csvData.length})
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scheduled SMS Section */}
        {activeTab === 'scheduled' && (
          <div className="space-y-8">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-white/10">
                <CardTitle className="text-white text-2xl flex items-center space-x-3">
                  <div className="p-2 bg-teal-500/20 rounded-xl">
                    <Clock className="h-6 w-6 text-teal-400" />
                  </div>
                  <span>Scheduled SMS Messages</span>
                </CardTitle>
                <p className="text-gray-400">View and manage your scheduled SMS messages</p>
              </CardHeader>
              <CardContent className="p-8">
                {/* Filters */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <Label className="text-gray-300 font-medium">Status</Label>
                    <select
                      value={scheduledFilters.status}
                      onChange={(e) => setScheduledFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-black/30 border border-white/20 text-white rounded-xl px-4 py-3 h-12 focus:border-teal-500 focus:ring-teal-500/20"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="sent">Sent</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-gray-300 font-medium">Recipient</Label>
                    <Input
                      type="text"
                      placeholder="Filter by recipient"
                      value={scheduledFilters.recipient}
                      onChange={(e) => setScheduledFilters(prev => ({ ...prev, recipient: e.target.value }))}
                      className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 focus:border-teal-500 focus:ring-teal-500/20"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-gray-300 font-medium">Page</Label>
                    <Input
                      type="number"
                      min="1"
                      value={scheduledFilters.page}
                      onChange={(e) => setScheduledFilters(prev => ({ ...prev, page: parseInt(e.target.value) || 1 }))}
                      className="bg-black/30 border-white/20 text-white rounded-xl h-12 focus:border-teal-500 focus:ring-teal-500/20"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={fetchScheduledSMS}
                      disabled={isLoadingScheduled}
                      className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl h-12 font-medium shadow-lg shadow-teal-500/25 transition-all duration-300"
                    >
                      {isLoadingScheduled ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Refresh'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Scheduled SMS List */}
                <div className="space-y-6">
                  {isLoadingScheduled ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 mx-auto animate-spin text-teal-400" />
                      <p className="text-gray-400 mt-4 text-lg">Loading scheduled SMS...</p>
                    </div>
                  ) : scheduledSMS.length > 0 ? (
                    scheduledSMS.map((sms) => (
                      <div key={sms.id} className="bg-black/30 border border-white/10 rounded-2xl p-6 hover:border-teal-500/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-xl ${getStatusColor(sms.status || 'pending')}`}>
                                {getStatusIcon(sms.status || 'pending')}
                              </div>
                              <div>
                                <h3 className="text-white font-semibold text-lg">{sms.recipient}</h3>
                                <p className="text-sm text-gray-400">Scheduled for {new Date(sms.scheduled_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                              <p className="text-gray-300">{sms.message}</p>
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <span className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                                <span>Sender: {sms.sender_id}</span>
                              </span>
                              <span className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                <span>Cost: {sms.cost} credits</span>
                              </span>
                              {sms.batch_id && (
                                <span className="flex items-center space-x-2">
                                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                  <span>Batch: {sms.batch_id}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {sms.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelScheduledSMS(sms.id!)}
                                className="border-red-500/30 text-red-300 hover:bg-red-500/20 rounded-xl"
                              >
                                Cancel
                              </Button>
                            )}
                            <Badge className={`${getStatusColor(sms.status || 'pending')} border-0 px-3 py-1`}>
                              {sms.status || 'pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <Clock className="h-16 w-16 mx-auto text-gray-500 mb-6" />
                      <h3 className="text-white text-xl font-semibold mb-3">No Scheduled SMS</h3>
                      <p className="text-gray-400 text-lg">You haven&apos;t scheduled any SMS messages yet.</p>
                      <p className="text-gray-500 mt-2">Use the tabs above to schedule your first SMS message.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
