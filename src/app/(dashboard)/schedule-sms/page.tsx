'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Clock, 
  Send, 
  Upload, 
  FileText, 
  Calendar,
  Phone,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { SchedulingService, ScheduledSMS, BulkScheduledSMS } from '@/lib/services/scheduling';
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
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Array<{ recipient: string; message: string }>>([]);
  const [csvError, setCsvError] = useState<string>('');
  const [csvSuccess, setCsvSuccess] = useState<string>('');

  // Senders state
  const [senders, setSenders] = useState<string[]>([]);

  useEffect(() => {
    fetchSenders();
  }, []);

  const fetchSenders = async () => {
    try {
      // This would need to be implemented based on your existing sender fetching logic
      // For now, using a placeholder
      setSenders(['Possitech', 'MyCompany', 'Notifications']);
    } catch (error) {
      console.error('Failed to fetch senders:', error);
    }
  };

  const handleSingleSMSSchedule = async () => {
    if (!singleSMS.recipient || !singleSMS.message || !singleSMS.sender_id || !singleSMS.scheduled_at) {
      showToast('error', 'Validation Error', 'Please fill in all required fields');
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
      const response = await SchedulingService.scheduleSMS(singleSMS as ScheduledSMS);
      
      if (response.success) {
        showToast('success', 'SMS Scheduled', `SMS scheduled successfully for ${new Date(singleSMS.scheduled_at!).toLocaleString()}`);
        // Reset form
        setSingleSMS({
          recipient: '',
          message: '',
          sender_id: '',
          scheduled_at: ''
        });
      }
    } catch (error: unknown) {
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
      const response = await SchedulingService.scheduleBulkSMS(bulkSMS as BulkScheduledSMS);
      
      if (response.success) {
        showToast('success', 'Bulk SMS Scheduled', `${response.data.scheduled_count} SMS messages scheduled successfully for ${new Date(bulkSMS.scheduled_at!).toLocaleString()}`);
        // Reset form
        setBulkSMS({
          sender_id: '',
          scheduled_at: '',
          messages: []
        });
        setCsvData([]);
        setCsvFile(null);
      }
    } catch (error: unknown) {
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
        const requiredHeaders = ['recipient', 'message'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setCsvError(`Missing required columns: ${missingHeaders.join(', ')}`);
          return;
        }

        const data: Array<{ recipient: string; message: string }> = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim());
          if (values.length >= 2) {
            data.push({
              recipient: values[headers.indexOf('recipient')],
              message: values[headers.indexOf('message')]
            });
          }
        }

        if (data.length === 0) {
          setCsvError('No valid data found in CSV file');
          return;
        }

        setCsvData(data);
        setBulkSMS(prev => ({ ...prev, messages: data }));
        setCsvSuccess(`Successfully loaded ${data.length} recipients from CSV`);
        
        setTimeout(() => setCsvSuccess(''), 3000);
             } catch (error: unknown) {
         setCsvError('Failed to parse CSV file');
       }
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const csvContent = 'recipient,message\n+233244123456,Hello from PossiNotify!\n+233244789012,Your scheduled message here';
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

        {/* Main Content */}
        <Tabs defaultValue="single" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
            <TabsTrigger value="single" className="data-[state=active]:bg-gradient-to-r from-teal-600 to-emerald-600">
              <Send className="h-4 w-4 mr-2" />
              Single SMS
            </TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-gradient-to-r from-teal-600 to-emerald-600">
              <Upload className="h-4 w-4 mr-2" />
              Bulk SMS
            </TabsTrigger>
          </TabsList>

          {/* Single SMS Tab */}
          <TabsContent value="single" className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-white/10">
                <CardTitle className="text-white text-xl flex items-center space-x-3">
                  <div className="p-2 bg-teal-500/20 rounded-xl">
                    <MessageSquare className="h-5 w-5 text-teal-400" />
                  </div>
                  <span>Schedule Single SMS</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recipient" className="text-gray-300">Recipient Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="recipient"
                          type="tel"
                          placeholder="+233244123456"
                          value={singleSMS.recipient}
                          onChange={(e) => setSingleSMS(prev => ({ ...prev, recipient: e.target.value }))}
                          className="pl-10 bg-black/30 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="sender_id" className="text-gray-300">Sender ID</Label>
                      <select
                        id="sender_id"
                        value={singleSMS.sender_id}
                        onChange={(e) => setSingleSMS(prev => ({ ...prev, sender_id: e.target.value }))}
                        className="w-full bg-black/30 border border-white/20 text-white rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-teal-500/20"
                      >
                        <option value="">Select Sender ID</option>
                        {senders.map((sender) => (
                          <option key={sender} value={sender}>{sender}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="scheduled_at" className="text-gray-300">Schedule Date & Time</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="scheduled_at"
                          type="datetime-local"
                          min={getMinDateTime()}
                          value={singleSMS.scheduled_at}
                          onChange={(e) => setSingleSMS(prev => ({ ...prev, scheduled_at: e.target.value }))}
                          className="pl-10 bg-black/30 border-white/20 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="message" className="text-gray-300">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Enter your SMS message..."
                        value={singleSMS.message}
                        onChange={(e) => setSingleSMS(prev => ({ ...prev, message: e.target.value }))}
                        className="bg-black/30 border-white/20 text-white placeholder-gray-400 min-h-[200px]"
                        maxLength={160}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          {singleSMS.message?.length || 0}/160 characters
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {Math.ceil((singleSMS.message?.length || 0) / 160)} SMS
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={handleSingleSMSSchedule}
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
                        Schedule SMS
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk SMS Tab */}
          <TabsContent value="bulk" className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-white/10">
                <CardTitle className="text-white text-xl flex items-center space-x-3">
                  <div className="p-2 bg-teal-500/20 rounded-xl">
                    <Upload className="h-5 w-5 text-teal-400" />
                  </div>
                  <span>Schedule Bulk SMS</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulk_sender_id" className="text-gray-300">Sender ID</Label>
                      <select
                        id="bulk_sender_id"
                        value={bulkSMS.sender_id}
                        onChange={(e) => setBulkSMS(prev => ({ ...prev, sender_id: e.target.value }))}
                        className="w-full bg-black/30 border border-white/20 text-white rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-teal-500/20"
                      >
                        <option value="">Select Sender ID</option>
                        {senders.map((sender) => (
                          <option key={sender} value={sender}>{sender}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="bulk_scheduled_at" className="text-gray-300">Schedule Date & Time</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="bulk_scheduled_at"
                          type="datetime-local"
                          min={getMinDateTime()}
                          value={bulkSMS.scheduled_at}
                          onChange={(e) => setBulkSMS(prev => ({ ...prev, scheduled_at: e.target.value }))}
                          className="pl-10 bg-black/30 border-white/20 text-white"
                        />
                      </div>
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
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 font-medium">
                              <span>Recipient</span>
                              <span>Message</span>
                            </div>
                            {csvData.slice(0, 5).map((row, index) => (
                              <div key={index} className="grid grid-cols-2 gap-4 text-sm text-gray-300 border-b border-white/10 pb-2">
                                <span className="truncate">{row.recipient}</span>
                                <span className="truncate">{row.message}</span>
                              </div>
                            ))}
                            {csvData.length > 5 && (
                              <div className="text-xs text-gray-500 text-center pt-2">
                                ... and {csvData.length - 5} more rows
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
                            {csvData.length} recipients loaded
                          </span>
                          <Badge variant="outline" className="text-xs">
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
                        Schedule Bulk SMS ({csvData.length})
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
