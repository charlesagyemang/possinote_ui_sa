'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SmsService } from '@/lib/services/sms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Users, AlertCircle, Upload, FileText, Eye, Download, Sparkles, Zap, Target, CheckCircle } from 'lucide-react';

const smsSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required').max(160, 'Message too long (max 160 characters)'),
  sender_id: z.string().min(1, 'Sender ID is required'),
});

interface CsvRow {
  [key: string]: string;
}

interface ProcessedRecipient {
  name: string;
  phone: string;
  message: string;
  originalData: CsvRow;
}

export default function SmsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkRecipients, setBulkRecipients] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Advanced bulk SMS states
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [templateMessage, setTemplateMessage] = useState('');
  const [processedRecipients, setProcessedRecipients] = useState<ProcessedRecipient[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    name: '',
    phone: '',
  });

  // Test API connection
  const testApiConnection = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2025/api/v1'}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('API health check response:', response.status, response.statusText);
      if (response.ok) {
        setSuccessMessage('API connection successful!');
      } else {
        setErrorMessage(`API connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('API connection test failed:', error);
      setErrorMessage('API connection test failed - check if your Rails backend is running');
    }
  };

  const form = useForm({
    resolver: zodResolver(smsSchema),
    defaultValues: {
      to: '',
      message: '',
      sender_id: 'Possitech',
    },
  });

  const onSubmit = async (data: z.infer<typeof smsSchema>) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      console.log('Sending SMS with data:', data);
      const response = await SmsService.sendSms(data);
      console.log('SMS response:', response);
      setSuccessMessage('SMS sent successfully!');
      form.reset();
    } catch (error: any) {
      console.error('SMS error:', error);
      
      // Handle validation errors specifically
      if (error.response?.status === 422 && error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        setErrorMessage(`Validation errors: ${validationErrors}`);
      } else {
        const errorMsg = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to send SMS';
        setErrorMessage(`Error: ${errorMsg}`);
      }
      
      // Log additional debugging info
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // CSV parsing function
  const parseCSV = (csvText: string): CsvRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: CsvRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text);
      
      if (data.length > 0) {
        setCsvData(data);
        setCsvHeaders(Object.keys(data[0]));
        
        // Auto-detect columns
        const headers = Object.keys(data[0]);
        const nameColumn = headers.find(h => 
          h.toLowerCase().includes('name') || 
          h.toLowerCase().includes('full') ||
          h.toLowerCase().includes('first')
        );
        const phoneColumn = headers.find(h => 
          h.toLowerCase().includes('phone') || 
          h.toLowerCase().includes('mobile') ||
          h.toLowerCase().includes('number') ||
          h.toLowerCase().includes('tel')
        );
        
        setColumnMapping({
          name: nameColumn || headers[0],
          phone: phoneColumn || headers[1],
        });
        
        setSuccessMessage(`CSV uploaded successfully! Found ${data.length} recipients.`);
      } else {
        setErrorMessage('No valid data found in CSV file.');
      }
    };
    reader.readAsText(file);
  };

  // Process template and generate messages
  const processTemplate = () => {
    if (!templateMessage.trim() || !columnMapping.name || !columnMapping.phone) {
      setErrorMessage('Please fill in template message and select name/phone columns.');
      return;
    }

    const recipients: ProcessedRecipient[] = [];
    
    for (const row of csvData) {
      const name = row[columnMapping.name] || 'Customer';
      const phone = row[columnMapping.phone] || '';
      
      if (!phone) continue;
      
      // Replace template variables
      let message = templateMessage;
      Object.keys(row).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'gi');
        message = message.replace(regex, row[key] || '');
      });
      
      // Also replace common variables
      message = message.replace(/{{name}}/gi, name);
      message = message.replace(/{{phone}}/gi, phone);
      
      recipients.push({
        name,
        phone,
        message,
        originalData: row,
      });
    }
    
    setProcessedRecipients(recipients);
    setShowPreview(true);
    setSuccessMessage(`Processed ${recipients.length} recipients. Review the preview before sending.`);
  };

  // Send advanced bulk SMS
  const sendAdvancedBulkSms = async () => {
    if (processedRecipients.length === 0) {
      setErrorMessage('No recipients to send to.');
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const messages = processedRecipients.map(recipient => ({
        to: recipient.phone,
        message: recipient.message,
      }));

      console.log('Sending advanced bulk SMS with data:', { messages, sender_id: 'Possitech' });
      const response = await SmsService.sendBulkSms({
        messages,
        sender_id: 'Possitech',
      });
      
      console.log('Advanced bulk SMS response:', response);
      
      // Show detailed success message with batch info
      const batchInfo = response.data;
      const successMsg = `Advanced bulk SMS sent successfully! Batch ID: ${batchInfo.batch_id}, Total: ${batchInfo.total_messages}, Successful: ${batchInfo.successful}, Failed: ${batchInfo.failed}, Cost: ₵${batchInfo.total_cost}`;
      setSuccessMessage(successMsg);
      
      // Reset form
      setCsvData([]);
      setCsvHeaders([]);
      setTemplateMessage('');
      setProcessedRecipients([]);
      setShowPreview(false);
      setColumnMapping({ name: '', phone: '' });
      
    } catch (error: any) {
      console.error('Advanced bulk SMS error:', error);
      
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        setErrorMessage(`Validation errors: ${validationErrors}`);
      } else {
        const errorMsg = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to send advanced bulk SMS';
        setErrorMessage(`Error: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendBulkSms = async () => {
    if (!bulkRecipients.trim() || !bulkMessage.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    const recipients = bulkRecipients.split('\n').filter(r => r.trim());
    if (recipients.length === 0) {
      setErrorMessage('Please enter at least one recipient');
      return;
    }

    const messages = recipients.map(to => ({
      to: to.trim(),
      message: bulkMessage,
    }));

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      console.log('Sending bulk SMS with data:', { messages, sender_id: 'Possitech' });
      const response = await SmsService.sendBulkSms({
        messages,
        sender_id: 'Possitech',
      });
      console.log('Bulk SMS response:', response);
      
      // Show detailed success message with batch info
      const batchInfo = response.data;
      const successMsg = `Bulk SMS sent successfully! Batch ID: ${batchInfo.batch_id}, Total: ${batchInfo.total_messages}, Successful: ${batchInfo.successful}, Failed: ${batchInfo.failed}, Cost: ₵${batchInfo.total_cost}`;
      setSuccessMessage(successMsg);
      setBulkRecipients('');
      setBulkMessage('');
    } catch (error: any) {
      console.error('Bulk SMS error:', error);
      
      // Handle validation errors specifically
      if (error.response?.status === 422 && error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        setErrorMessage(`Validation errors: ${validationErrors}`);
      } else {
        const errorMsg = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to send bulk SMS';
        setErrorMessage(`Error: ${errorMsg}`);
      }
      
      // Log additional debugging info
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              SMS Dashboard
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Powerful SMS messaging with advanced bulk capabilities</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
            <div className="flex space-x-2">
              <Button
                variant={!bulkMode ? 'default' : 'ghost'}
                onClick={() => setBulkMode(false)}
                className={`rounded-xl px-6 py-3 transition-all duration-300 ${
                  !bulkMode 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Single SMS
              </Button>
              <Button
                variant={bulkMode ? 'default' : 'ghost'}
                onClick={() => setBulkMode(true)}
                className={`rounded-xl px-6 py-3 transition-all duration-300 ${
                  bulkMode 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Bulk SMS
              </Button>
            </div>
          </div>
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
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <span className="text-red-300 font-medium">{errorMessage}</span>
            </div>
          </div>
        )}

        {!bulkMode ? (
          /* Single SMS Card */
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
              <CardTitle className="text-white text-2xl flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-blue-400" />
                </div>
                <span>Send Single SMS</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="to" className="text-gray-300 font-medium">Phone Number</Label>
                    <Input
                      {...form.register('to')}
                      placeholder="+233244123456"
                      className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                    {form.formState.errors.to && (
                      <p className="text-red-400 text-sm">{form.formState.errors.to.message}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="sender_id" className="text-gray-300 font-medium">Sender ID</Label>
                    <Input
                      {...form.register('sender_id')}
                      placeholder="Possitech"
                      className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="message" className="text-gray-300 font-medium">Message</Label>
                  <Textarea
                    {...form.register('message')}
                    placeholder="Enter your message..."
                    maxLength={160}
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                    rows={4}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400">
                      {form.watch('message')?.length || 0}/160 characters
                    </p>
                    {form.watch('message') && (
                      <Badge variant="outline" className="text-xs bg-blue-500/20 border-blue-500/30 text-blue-300">
                        {Math.ceil((form.watch('message')?.length || 0) / 160)} SMS
                      </Badge>
                    )}
                  </div>
                  {form.formState.errors.message && (
                    <p className="text-red-400 text-sm">{form.formState.errors.message.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl h-12 text-lg font-medium shadow-lg shadow-blue-500/25 transition-all duration-300"
                >
                  <Send className="h-5 w-5 mr-2" />
                  {isLoading ? 'Sending...' : 'Send SMS'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Simple Bulk SMS */}
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
                <CardTitle className="text-white text-2xl flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <Users className="h-6 w-6 text-green-400" />
                  </div>
                  <span>Simple Bulk SMS</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="recipients" className="text-gray-300 font-medium">Recipients (one per line)</Label>
                    <Textarea
                      value={bulkRecipients}
                      onChange={(e) => setBulkRecipients(e.target.value)}
                      placeholder="+233244123456&#10;+233244789012&#10;+233244345678"
                      rows={5}
                      className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-green-500 focus:ring-green-500/20"
                    />
                    <p className="text-sm text-gray-400">
                      {bulkRecipients.split('\n').filter(r => r.trim()).length} recipients
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="bulk_message" className="text-gray-300 font-medium">Message</Label>
                    <Textarea
                      value={bulkMessage}
                      onChange={(e) => setBulkMessage(e.target.value)}
                      placeholder="Enter your message..."
                      maxLength={160}
                      className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-green-500 focus:ring-green-500/20"
                      rows={4}
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-400">
                        {bulkMessage.length}/160 characters
                      </p>
                      {bulkMessage && (
                        <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500/30 text-green-300">
                          {Math.ceil(bulkMessage.length / 160)} SMS per recipient
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={sendBulkSms} 
                    disabled={isLoading || !bulkRecipients.trim() || !bulkMessage.trim()}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-12 text-lg font-medium shadow-lg shadow-green-500/25 transition-all duration-300"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    {isLoading ? 'Sending...' : 'Send Bulk SMS'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Bulk SMS with CSV */}
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/10">
                <CardTitle className="text-white text-2xl flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Sparkles className="h-6 w-6 text-purple-400" />
                  </div>
                  <span>Advanced Bulk SMS (CSV Upload)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* File Upload */}
                  <div className="space-y-4">
                    <Label className="text-gray-300 font-medium">Upload CSV File</Label>
                    <div className="border-2 border-dashed border-purple-500/30 rounded-2xl p-8 text-center bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                      <Upload className="h-12 w-12 mx-auto text-purple-400 mb-4" />
                      <p className="text-gray-300 mb-4 text-lg">Drag and drop a CSV file here, or click to select</p>
                      
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white hover:file:from-purple-600 hover:file:to-pink-600 transition-all duration-300"
                      />
                      
                      <p className="text-xs text-gray-500 mt-4">Example CSV format: name,phone,company</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const csvContent = "name,phone,company\nJohn Doe,+233244123456,Acme Corp\nJane Smith,+233244123457,Tech Solutions\nBob Wilson,+233244123458,Startup Inc";
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'sample_recipients.csv';
                          a.click();
                          window.URL.revokeObjectURL(url);
                        }}
                        className="mt-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample CSV
                      </Button>
                    </div>
                    {csvData.length > 0 && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">CSV loaded with {csvData.length} recipients</span>
                      </div>
                    )}
                  </div>

                  {/* Column Mapping */}
                  {csvHeaders.length > 0 && (
                    <div className="space-y-4">
                      <Label className="text-gray-300 font-medium">Column Mapping</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-400">Name Column</Label>
                          <select
                            value={columnMapping.name}
                            onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                            className="w-full bg-black/30 border-white/20 text-white rounded-xl p-3 focus:border-purple-500 focus:ring-purple-500/20"
                          >
                            {csvHeaders.map(header => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-400">Phone Column</Label>
                          <select
                            value={columnMapping.phone}
                            onChange={(e) => setColumnMapping({ ...columnMapping, phone: e.target.value })}
                            className="w-full bg-black/30 border-white/20 text-white rounded-xl p-3 focus:border-purple-500 focus:ring-purple-500/20"
                          >
                            {csvHeaders.map(header => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Template Message */}
                  <div className="space-y-4">
                    <Label className="text-gray-300 font-medium">Message Template</Label>
                    <Textarea
                      value={templateMessage}
                      onChange={(e) => setTemplateMessage(e.target.value)}
                      placeholder="Hello {{name}}, thank you for your interest. We'll contact you at {{phone}}."
                      maxLength={160}
                      className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                      rows={4}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setTemplateMessage("Hello {{name}}, thank you for your interest in {{company}}. We'll contact you soon at {{phone}}.")}
                        className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 text-blue-300 hover:from-blue-500/30 hover:to-purple-500/30"
                      >
                        Welcome Template
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setTemplateMessage("Hi {{name}}, your order has been confirmed. We'll deliver to {{phone}}. Thank you!")}
                        className="text-xs bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300 hover:from-green-500/30 hover:to-emerald-500/30"
                      >
                        Order Confirmation
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setTemplateMessage("Dear {{name}}, your appointment is confirmed for tomorrow. Contact {{phone}} if you need to reschedule.")}
                        className="text-xs bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-300 hover:from-orange-500/30 hover:to-red-500/30"
                      >
                        Appointment Reminder
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-400">
                        {templateMessage.length}/160 characters
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs cursor-pointer bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30" onClick={() => setTemplateMessage(templateMessage + '{{name}}')}>
                          Add {'{{name}}'}
                        </Badge>
                        <Badge variant="outline" className="text-xs cursor-pointer bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30" onClick={() => setTemplateMessage(templateMessage + '{{phone}}')}>
                          Add {'{{phone}}'}
                        </Badge>
                        {csvHeaders.map(header => (
                          <Badge 
                            key={header} 
                            variant="outline" 
                            className="text-xs cursor-pointer bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30" 
                            onClick={() => setTemplateMessage(templateMessage + `{{${header}}}`)}
                          >
                            Add {`{{${header}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button 
                      onClick={processTemplate}
                      disabled={!csvData.length || !templateMessage.trim() || !columnMapping.name || !columnMapping.phone}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl h-12 text-lg font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300"
                    >
                      <Eye className="h-5 w-5 mr-2" />
                      Preview Messages
                    </Button>
                    
                    {showPreview && (
                      <Button 
                        onClick={sendAdvancedBulkSms}
                        disabled={isLoading || processedRecipients.length === 0}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl h-12 text-lg font-medium shadow-lg shadow-purple-500/25 transition-all duration-300"
                      >
                        <Send className="h-5 w-5 mr-2" />
                        {isLoading ? 'Sending...' : `Send to ${processedRecipients.length} Recipients`}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Preview */}
            {showPreview && processedRecipients.length > 0 && (
              <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10">
                  <CardTitle className="text-white text-2xl flex items-center space-x-3">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <Target className="h-6 w-6 text-amber-400" />
                    </div>
                    <span>Message Preview</span>
                  </CardTitle>
                  <p className="text-sm text-gray-400">Showing first 5 messages (out of {processedRecipients.length})</p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    {processedRecipients.slice(0, 5).map((recipient, index) => (
                      <div key={index} className="border border-white/10 rounded-2xl p-4 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-medium text-white">{recipient.name}</span>
                          <span className="text-sm text-gray-400">{recipient.phone}</span>
                        </div>
                        <p className="text-sm text-gray-300">{recipient.message}</p>
                      </div>
                    ))}
                    {processedRecipients.length > 5 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-400">
                          ... and {processedRecipients.length - 5} more recipients
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-white/10">
              <CardTitle className="text-white text-xl flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Zap className="h-5 w-5 text-blue-400" />
                </div>
                <span>Quick Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use international format for phone numbers (e.g., +233244123456)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Messages are limited to 160 characters per SMS</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Sender ID must be pre-approved by your SMS provider</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Bulk SMS is charged per recipient per message</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
              <CardTitle className="text-white text-xl flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <Sparkles className="h-5 w-5 text-green-400" />
                </div>
                <span>Advanced Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>CSV should have columns: name, phone (or similar)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use {'{{name}}'}, {'{{phone}}'}, or {'{{column_name}}'} for template variables</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Download sample CSV to get started quickly</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Preview messages before sending to avoid errors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 