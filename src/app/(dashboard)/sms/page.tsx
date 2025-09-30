'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { SmsService, SmsMessage, Pagination } from '@/lib/services/sms';
import { SendersService, Sender } from '@/lib/services/senders';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { MessageSquare, Send, Users, AlertCircle, Upload, FileText, Eye, Download, Sparkles, Zap, Target, CheckCircle, FileSpreadsheet, FileJson, ChevronLeft, ChevronRight, Filter, RefreshCw, XCircle, Clock, Info } from 'lucide-react';
import SenderNamesModal from '@/components/SenderNamesModal';
import { usePaymentRequired } from '@/components/PaymentRequiredProvider';

const smsSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required').max(160, 'Message too long (max 160 characters)'),
  sender_id: z.string().optional().default('Possitech'),
});

interface DataRow {
  [key: string]: string | number;
}

interface ProcessedRecipient {
  name: string;
  phone: string;
  message: string;
  originalData: DataRow;
}

interface FileInfo {
  name: string;
  type: 'csv' | 'excel' | 'json' | 'tsv';
  size: number;
  columns: string[];
  rowCount: number;
}

export default function SmsPage() {
  const { showPaymentRequired } = usePaymentRequired();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'bulk' | 'history' | 'senders'>('senders');
  const [bulkRecipients, setBulkRecipients] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  // Sender ID for bulk actions
  const [selectedBulkSenderId, setSelectedBulkSenderId] = useState<string>('Possitech');

  // Advanced bulk SMS states
  const [fileData, setFileData] = useState<DataRow[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [templateMessage, setTemplateMessage] = useState('');

  // Custom function to set template message and auto-process if conditions are met
  const setTemplateMessageAndProcess = (message: string) => {
    setTemplateMessage(message);
    
    // Auto-process if file data is loaded, phone column is selected, and message is set
    if (fileData.length > 0 && phoneColumn && message.trim()) {
      console.log('🔄 Auto-processing template after message change');
      // Use setTimeout to ensure state is updated before processing
      setTimeout(() => {
        processTemplate();
      }, 100);
    }
  };
  const [processedRecipients, setProcessedRecipients] = useState<ProcessedRecipient[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [phoneColumn, setPhoneColumn] = useState('');

  // Sender Names states
  const [showSenderNamesModal, setShowSenderNamesModal] = useState(false);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [isAddingSenderName, setIsAddingSenderName] = useState(false);
  const [, setIsLoadingSenders] = useState(true);

  // SMS History states
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [apiKeyFilter, setApiKeyFilter] = useState('all');
  const [senderIdFilter, setSenderIdFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [, setSearchTerm] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setIsExporting] = useState(false);



  // Fetch senders
  const fetchSenders = async () => {
    try {
      setIsLoadingSenders(true);
      const response = await SendersService.getSenders();
      if (response.success) {
        setSenders(response.data.senders);
        // Auto-select first approved sender for bulk if not set
        const firstApproved = (response.data.senders || []).find((s: Sender) => s.status === 'approved');
        if (!selectedBulkSenderId && firstApproved) {
          setSelectedBulkSenderId(firstApproved.name);
        }
      } else {
        console.error('Failed to fetch senders:', response.error);
      }
    } catch (error) {
      console.error('Failed to fetch senders:', error);
    } finally {
      setIsLoadingSenders(false);
    }
  };

  // Handle adding sender name
  const handleAddSenderName = async (data: { name: string; description: string }) => {
    setIsAddingSenderName(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const response = await SendersService.createSender(data);
      
      if (response.success) {
        setSuccessMessage(response.data.message || `Sender name "${data.name}" added successfully!`);
        setShowSenderNamesModal(false);
        // Refresh the senders list
        await fetchSenders();
      } else {
        setErrorMessage(response.error || 'Failed to add sender name. Please try again.');
      }
      
    } catch (error: unknown) {
      console.error('Failed to add sender name:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add sender name. Please try again.';
      setErrorMessage(errorMessage);
    } finally {
      setIsAddingSenderName(false);
    }
  };

  // Fetch senders on component mount
  useEffect(() => {
    fetchSenders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSmsHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, dateFilter, apiKeyFilter, senderIdFilter, phoneFilter, minCost, maxCost, startDate, endDate]);

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
      const response = await SmsService.sendSms(data.to, data.message, data.sender_id);
      console.log('SMS response:', response);
      setSuccessMessage('SMS sent successfully!');
      form.reset();
    } catch (error: unknown) {
      console.error('SMS error:', error);
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to send SMS. Please reload your account.',
            '/billing'
          );
          return;
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send SMS';
      setErrorMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced file parsing functions
  const parseCSV = async (csvText: string): Promise<DataRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as DataRow[]);
        },
        error: (error: unknown) => {
          reject(error);
        }
      });
    });
  };

  const parseExcel = (file: File): Promise<DataRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData as DataRow[]);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const parseJSON = (jsonText: string): DataRow[] => {
    try {
      const data = JSON.parse(jsonText);
      if (Array.isArray(data)) {
        return data;
      } else if (typeof data === 'object' && data !== null) {
        return [data];
      }
      throw new Error('Invalid JSON format');
    } catch {
      throw new Error('Failed to parse JSON file');
    }
  };

  const parseTSV = async (tsvText: string): Promise<DataRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(tsvText, {
        header: true,
        skipEmptyLines: true,
        delimiter: '\t',
        complete: (results) => {
          resolve(results.data as DataRow[]);
        },
        error: (error: unknown) => {
          reject(error);
        }
      });
    });
  };

  // Enhanced file upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log('📁 File upload started:', file.name, 'Size:', file.size);
      
      let data: DataRow[] = [];
      let fileType: 'csv' | 'excel' | 'json' | 'tsv' = 'csv';
      
      // Determine file type and parse accordingly
      if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        fileType = 'excel';
        data = await parseExcel(file);
      } else if (file.name.toLowerCase().endsWith('.json')) {
        fileType = 'json';
        const text = await file.text();
        data = parseJSON(text);
      } else if (file.name.toLowerCase().endsWith('.tsv')) {
        fileType = 'tsv';
        const text = await file.text();
        data = await parseTSV(text);
      } else {
        // Default to CSV
        const text = await file.text();
        data = await parseCSV(text);
      }
      
      if (data.length === 0) {
        throw new Error('No data found in file');
      }
      
      // Extract headers from first row
      const headers = Object.keys(data[0]);
      console.log('📋 Headers found:', headers);
      
      // Create file info
      const fileInfo: FileInfo = {
        name: file.name,
        type: fileType,
        size: file.size,
        columns: headers,
        rowCount: data.length
      };
      
      setFileHeaders(headers);
      setFileData(data);
      setFileInfo(fileInfo);
      setShowPreview(true);
      
      // Auto-detect phone column
      const autoPhoneColumn = headers.find(h => 
        h.toLowerCase().includes('phone') || 
        h.toLowerCase().includes('mobile') || 
        h.toLowerCase().includes('number') ||
        h.toLowerCase().includes('tel') ||
        h.toLowerCase().includes('contact')
      );
      
      if (autoPhoneColumn) {
        setPhoneColumn(autoPhoneColumn);
        console.log('🔧 Auto-detected phone column:', autoPhoneColumn);
      }
      
      setSuccessMessage(`File uploaded successfully! Found ${data.length} rows with ${headers.length} columns. ${autoPhoneColumn ? `Phone column auto-detected: ${autoPhoneColumn}` : 'Please select phone column below.'}`);
      
      // Auto-process template if template message is already set and phone column is detected
      if (templateMessage.trim() && autoPhoneColumn) {
        console.log('🔄 Auto-processing template after file upload');
        // Use setTimeout to ensure state is updated before processing
        setTimeout(() => {
          processTemplate();
        }, 100);
      }
    } catch (error: unknown) {
      console.error('❌ File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse file';
      setErrorMessage(errorMessage);
    }
  };

  // Process template and generate messages
  const processTemplate = () => {
    console.log('🔧 processTemplate called with:', {
      templateMessage: templateMessage.trim(),
      phoneColumn,
      fileDataLength: fileData.length
    });
    
    if (!templateMessage.trim()) {
      setErrorMessage('Please fill in template message.');
      return;
    }
    
    if (!phoneColumn) {
      setErrorMessage('Please select a phone column.');
      return;
    }

    console.log('🔧 Processing template with data:', {
      templateMessage: templateMessage.substring(0, 100) + '...',
      fileDataLength: fileData.length
    });

    const recipients: ProcessedRecipient[] = [];
    
    for (const row of fileData) {
      const phone = String(row[phoneColumn] || '');
      
      if (!phone) {
        console.log('⚠️ Skipping row with no phone:', row);
        continue;
      }
      
      // Replace template variables dynamically
      let message = templateMessage;
      Object.keys(row).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'gi');
        message = message.replace(regex, String(row[key] || ''));
      });
      
      // Find name from available columns for display purposes
      const name = String(row.name || row.fullname || row.firstname || row.customer || 'Customer');
      
      recipients.push({
        name,
        phone,
        message,
        originalData: row,
      });
    }
    
    console.log('✅ Template processing complete:', {
      totalRecipients: recipients.length,
      sampleRecipient: recipients[0]
    });
    
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

    if (!selectedBulkSenderId) {
      setErrorMessage('Please select a sender ID.');
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // Create personalized messages array
      const messages = processedRecipients.map(recipient => ({
        to: recipient.phone,
        message: recipient.message
      }));

      console.log('Sending personalized bulk SMS with data:', { 
        messageCount: messages.length, 
        sender_id: selectedBulkSenderId,
        sampleMessage: messages[0]?.message 
      });
      
      const response = await SmsService.sendPersonalizedBulkSms(messages, selectedBulkSenderId);
      
      console.log('Advanced bulk SMS response:', response);
      
      // Show detailed success message with batch info
      const batchInfo = response.data;
      const successMsg = `Advanced bulk SMS sent successfully! Batch ID: ${batchInfo.batch_id}, Total: ${batchInfo.total_messages}, Successful: ${batchInfo.successful}, Failed: ${batchInfo.failed}, Cost: ₵${batchInfo.total_cost}`;
      setSuccessMessage(successMsg);
      
      // Reset form
      setFileData([]);
      setFileHeaders([]);
      setFileInfo(null);
      setPhoneColumn('');
      setTemplateMessage('');
      setProcessedRecipients([]);
      setShowPreview(false);
      
    } catch (error: unknown) {
      console.error('Advanced bulk SMS error:', error);
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to send bulk SMS. Please reload your account.',
            '/billing'
          );
          return;
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send advanced bulk SMS';
      setErrorMessage(`Error: ${errorMessage}`);
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

    const phoneNumbers = recipients.map(to => to.trim());

    if (!selectedBulkSenderId) {
      setErrorMessage('Please select a sender ID.');
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      console.log('Sending bulk SMS with data:', { phoneNumbers, sender_id: selectedBulkSenderId });
      const response = await SmsService.sendBulkSms(phoneNumbers, bulkMessage, selectedBulkSenderId);
      console.log('Bulk SMS response:', response);
      
      // Show detailed success message with batch info
      const batchInfo = response.data;
      const successMsg = `Bulk SMS sent successfully! Batch ID: ${batchInfo.batch_id}, Total: ${batchInfo.total_messages}, Successful: ${batchInfo.successful}, Failed: ${batchInfo.failed}, Cost: ₵${batchInfo.total_cost}`;
      setSuccessMessage(successMsg);
      setBulkRecipients('');
      setBulkMessage('');
    } catch (error: unknown) {
      console.error('Bulk SMS error:', error);
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to send bulk SMS. Please reload your account.',
            '/billing'
          );
          return;
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send bulk SMS';
      setErrorMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // SMS History functions
  const fetchSmsHistory = async () => {
    try {
      setIsLoadingHistory(true);
      setHistoryError(null);

      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: 20
      };

      // Add filters
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (dateFilter !== 'custom') {
        params.date_filter = dateFilter;
      } else {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }

      if (apiKeyFilter !== 'all') {
        params.api_key_id = apiKeyFilter;
      }

      if (senderIdFilter) {
        params.sender_id = senderIdFilter;
      }

      if (phoneFilter) {
        params.phone = phoneFilter;
      }

      if (minCost) {
        params.min_cost = parseFloat(minCost);
      }

      if (maxCost) {
        params.max_cost = parseFloat(maxCost);
      }

      const data = await SmsService.getSmsHistory(params);

      if (data.success) {
        setMessages(data.data?.messages || []);
        setPagination(data.data?.pagination || null);
      } else {
        setHistoryError(data.message || 'Failed to fetch SMS history');
      }
    } catch (error: unknown) {
      console.error('Failed to fetch SMS history:', error);
      setHistoryError('Failed to load SMS history. Please try again.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'sent':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'sent':
        return <MessageSquare className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _exportToCSV = async () => {
    // TODO: Implement export functionality when API is available
    console.log('Export functionality not yet implemented');
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setDateFilter('all');
    setApiKeyFilter('all');
    setSenderIdFilter('');
    setPhoneFilter('');
    setSearchTerm('');
    setMinCost('');
    setMaxCost('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              SMS Dashboard
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-lg">Powerful SMS messaging with advanced bulk capabilities</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-2 w-full max-w-full overflow-x-auto">
            <div className="flex flex-nowrap md:flex-wrap md:space-x-2 min-w-max md:min-w-0">
              <Button
                variant={mode === 'senders' ? 'default' : 'ghost'}
                onClick={() => setMode('senders')}
                className={`rounded-xl px-3 sm:px-6 py-3 transition-all duration-300 flex-shrink-0 ${
                  mode === 'senders'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <CheckCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sender Management</span>
                <span className="sm:hidden">Senders</span>
              </Button>
              <Button
                variant={mode === 'single' ? 'default' : 'ghost'}
                onClick={() => setMode('single')}
                className={`rounded-xl px-3 sm:px-6 py-3 transition-all duration-300 flex-shrink-0 ml-2 md:ml-0 ${
                  mode === 'single'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <MessageSquare className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Single SMS</span>
                <span className="sm:hidden">Single</span>
              </Button>
              <Button
                variant={mode === 'bulk' ? 'default' : 'ghost'}
                onClick={() => setMode('bulk')}
                className={`rounded-xl px-3 sm:px-6 py-3 transition-all duration-300 flex-shrink-0 ml-2 md:ml-0 ${
                  mode === 'bulk'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Bulk SMS</span>
                <span className="sm:hidden">Bulk</span>
              </Button>
              <Button
                variant={mode === 'history' ? 'default' : 'ghost'}
                onClick={() => setMode('history')}
                className={`rounded-xl px-3 sm:px-6 py-3 transition-all duration-300 flex-shrink-0 ml-2 md:ml-0 ${
                  mode === 'history'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">SMS History</span>
                <span className="sm:hidden">History</span>
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

        {mode === 'single' && (
          /* Single SMS Card */
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10 p-4 sm:p-6">
              <CardTitle className="text-white text-xl sm:text-2xl flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                </div>
                <span>Send Single SMS</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="to" className="text-gray-300 font-medium">Phone Number</Label>
                    <Input
                      {...form.register('to')}
                      placeholder="+233244123456"
                      className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-10 sm:h-12 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                    {form.formState.errors.to && (
                      <p className="text-red-400 text-sm">{form.formState.errors.to.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="sender_id" className="text-gray-300 font-medium">Sender ID</Label>
                    <Select
                      value={form.watch('sender_id')}
                      onValueChange={(value) => form.setValue('sender_id', value)}
                    >
                      <SelectTrigger className="bg-black/30 border-white/20 text-white rounded-xl h-10 sm:h-12 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Select sender name" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="Possitech" className="font-medium">
                          Possitech (Default)
                        </SelectItem>
                        {senders
                          .filter(sender => sender.status === 'approved')
                          .map((sender) => (
                            <SelectItem key={sender.id} value={sender.name}>
                              {sender.name}
                            </SelectItem>
                          ))}
                        {senders.filter(s => s.status === 'approved').length === 0 && (
                          <SelectItem value="no-senders" disabled>
                            No approved sender names available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.sender_id && (
                      <p className="text-red-400 text-sm">{form.formState.errors.sender_id.message}</p>
                    )}
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
        )}

        {mode === 'bulk' && (
          <div className="space-y-8">
            {/* Simple Bulk SMS */}
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10 p-4 sm:p-6">
                <CardTitle className="text-white text-xl sm:text-2xl flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                  </div>
                  <span>Simple Bulk SMS</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="space-y-6">
                  {/* Sender ID selection for simple bulk */}
                  <div className="space-y-3">
                    <Label htmlFor="bulk_sender_id" className="text-gray-300 font-medium">Sender ID</Label>
                    <Select
                      value={selectedBulkSenderId}
                      onValueChange={(value) => setSelectedBulkSenderId(value)}
                    >
                      <SelectTrigger className="bg-black/30 border-white/20 text-white rounded-xl h-12 focus:border-green-500 focus:ring-green-500/20">
                        <SelectValue placeholder="Select sender name" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="Possitech" className="font-medium">
                          Possitech (Default)
                        </SelectItem>
                        {senders
                          .filter(sender => sender.status === 'approved')
                          .map((sender) => (
                            <SelectItem key={sender.id} value={sender.name}>
                              {sender.name}
                            </SelectItem>
                          ))}
                        {senders.filter(s => s.status === 'approved').length === 0 && (
                          <SelectItem value="no-senders" disabled>
                            No approved sender names available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
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
                    disabled={isLoading || !bulkRecipients.trim() || !bulkMessage.trim() || !selectedBulkSenderId}
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
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/10 p-4 sm:p-6">
                <CardTitle className="text-white text-xl sm:text-2xl flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                  </div>
                  <span>Dynamic Bulk SMS</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="space-y-8">
                  {/* File Upload */}
                  <div className="space-y-4">
                    <Label className="text-gray-300 font-medium">Upload CSV File</Label>
                    <div className="border-2 border-dashed border-purple-500/30 rounded-2xl p-8 text-center bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                      <Upload className="h-12 w-12 mx-auto text-purple-400 mb-4" />
                      <p className="text-gray-300 mb-4 text-lg">Drag and drop a CSV file here, or click to select</p>
                      
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls,.json,.tsv"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white hover:file:from-purple-600 hover:file:to-pink-600 transition-all duration-300"
                      />
                      
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        <Badge variant="outline" className="text-xs bg-blue-500/20 border-blue-500/30 text-blue-300">
                          <FileText className="h-3 w-3 mr-1" />
                          CSV
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500/30 text-green-300">
                          <FileSpreadsheet className="h-3 w-3 mr-1" />
                          Excel
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-yellow-500/20 border-yellow-500/30 text-yellow-300">
                          <FileJson className="h-3 w-3 mr-1" />
                          JSON
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-purple-500/20 border-purple-500/30 text-purple-300">
                          <FileText className="h-3 w-3 mr-1" />
                          TSV
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-4">Supported formats: CSV, Excel (.xlsx/.xls), JSON, TSV</p>
                      <div className="flex gap-2 mt-4 justify-center">
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
                          className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300 hover:from-blue-500/30 hover:to-cyan-500/30"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          CSV Sample
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const jsonContent = JSON.stringify([
                              { name: "John Doe", phone: "+233244123456", company: "Acme Corp" },
                              { name: "Jane Smith", phone: "+233244123457", company: "Tech Solutions" },
                              { name: "Bob Wilson", phone: "+233244123458", company: "Startup Inc" }
                            ], null, 2);
                            const blob = new Blob([jsonContent], { type: 'application/json' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'sample_recipients.json';
                            a.click();
                            window.URL.revokeObjectURL(url);
                          }}
                          className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-300 hover:from-yellow-500/30 hover:to-orange-500/30"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          JSON Sample
                        </Button>
                      </div>
                    </div>
                    {fileData.length > 0 && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">{fileInfo?.type.toUpperCase()} loaded with {fileData.length} recipients</span>
                      </div>
                    )}
                  </div>



                  {/* Phone Column Mapping */}
                  {fileHeaders.length > 0 && (
                    <div className="space-y-4">
                      <Label className="text-gray-300 font-medium">Phone Column (Required)</Label>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-400">Select the column containing phone numbers</Label>
                        <select
                          value={phoneColumn}
                          onChange={(e) => setPhoneColumn(e.target.value)}
                          className="w-full bg-black/30 border-white/20 text-white rounded-xl p-3 focus:border-purple-500 focus:ring-purple-500/20"
                        >
                          <option value="">Select phone column...</option>
                          {fileHeaders.map((header: string) => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Sender ID selection for advanced bulk */}
                  <div className="space-y-3">
                    <Label htmlFor="adv_bulk_sender_id" className="text-gray-300 font-medium">Sender ID</Label>
                    <Select
                      value={selectedBulkSenderId}
                      onValueChange={(value) => setSelectedBulkSenderId(value)}
                    >
                      <SelectTrigger className="bg-black/30 border-white/20 text-white rounded-xl h-12 focus:border-purple-500 focus:ring-purple-500/20">
                        <SelectValue placeholder="Select sender name" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="Possitech" className="font-medium">
                          Possitech (Default)
                        </SelectItem>
                        {senders
                          .filter(sender => sender.status === 'approved')
                          .map((sender) => (
                            <SelectItem key={sender.id} value={sender.name}>
                              {sender.name}
                            </SelectItem>
                          ))}
                        {senders.filter(s => s.status === 'approved').length === 0 && (
                          <SelectItem value="no-senders" disabled>
                            No approved sender names available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Template Message */}
                  <div className="space-y-4">
                    <Label className="text-gray-300 font-medium">Message Template</Label>
                    <Textarea
                      value={templateMessage}
                      onChange={(e) => setTemplateMessageAndProcess(e.target.value)}
                      placeholder="Hello {{finney}}, thank you for your interest. We'll contact you at {{booty}}."
                      maxLength={160}
                      className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                      rows={4}
                    />

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
                        {fileHeaders.map((header: string) => (
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
                  <div className="space-y-4">
                    {/* Debug info */}
                    <div className="text-xs text-gray-400 bg-black/20 rounded-lg p-2 overflow-x-auto">
                      <div>Debug Info:</div>
                      <div>• File: {fileData.length} rows</div>
                      <div className="truncate">• Columns: {fileHeaders.join(', ')}</div>
                      <div>• Sender: {selectedBulkSenderId || '✗'}</div>
                      <div>• Phone col: {phoneColumn || '✗'}</div>
                      <div>• Template: {templateMessage.trim() ? '✓' : '✗'}</div>
                      <div>• Ready: {(!fileData.length || !templateMessage.trim() || !phoneColumn || !selectedBulkSenderId) ? 'No' : 'Yes'}</div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        onClick={() => {
                          console.log('🔘 Preview button clicked!');
                          console.log('🔘 Button state:', {
                            fileDataLength: fileData.length,
                            templateMessage: templateMessage.trim(),
                            phoneColumn,
                            availableColumns: fileHeaders
                          });
                          processTemplate();
                        }}
                        disabled={!fileData.length || !templateMessage.trim() || !phoneColumn || !selectedBulkSenderId}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl h-10 sm:h-12 text-sm sm:text-lg font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Preview Messages</span>
                        <span className="sm:hidden">Preview</span>
                        {(!fileData.length || !templateMessage.trim() || !phoneColumn || !selectedBulkSenderId) && (
                          <span className="ml-1 sm:ml-2 text-xs opacity-75 hidden sm:inline">(Upload file, select sender + phone column, and add template)</span>
                        )}
                      </Button>
                    
                                          {showPreview && (
                        <Button 
                          onClick={sendAdvancedBulkSms}
                          disabled={isLoading || processedRecipients.length === 0 || !selectedBulkSenderId}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl h-10 sm:h-12 text-sm sm:text-lg font-medium shadow-lg shadow-purple-500/25 transition-all duration-300"
                        >
                          <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                          {isLoading ? 'Sending...' : (
                            <>
                              <span className="hidden sm:inline">Send to {processedRecipients.length} Recipients</span>
                              <span className="sm:hidden">Send ({processedRecipients.length})</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Preview */}
            {showPreview && processedRecipients.length > 0 && (
              <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10 p-4 sm:p-6">
                  <CardTitle className="text-white text-xl sm:text-2xl flex items-center space-x-3">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <Target className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
                    </div>
                    <span>Message Preview</span>
                  </CardTitle>
                  <p className="text-sm text-gray-400">Showing first 5 messages (out of {processedRecipients.length})</p>
                </CardHeader>
                <CardContent className="p-4 sm:p-8">
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

        {/* SMS History Section */}
        {mode === 'history' && (
          <div className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-white/10 p-4 sm:p-6">
                <CardTitle className="text-white text-xl sm:text-2xl flex items-center space-x-3">
                  <div className="p-2 bg-teal-500/20 rounded-xl">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-teal-400" />
                  </div>
                  <span>SMS History</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-300">Status</Label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-black/30 border border-white/20 text-white rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-teal-500/20"
                    >
                      <option value="all">All Status</option>
                      <option value="delivered">Delivered</option>
                      <option value="sent">Sent</option>
                      <option value="failed">Failed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Phone Number</Label>
                    <Input
                      type="text"
                      placeholder="Filter by phone number"
                      value={phoneFilter}
                      onChange={(e) => setPhoneFilter(e.target.value)}
                      className="bg-black/30 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <Button
                      onClick={fetchSmsHistory}
                      disabled={isLoadingHistory}
                      className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                    >
                      {isLoadingHistory ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={resetFilters}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* SMS History List */}
                <div className="space-y-4">
                  {isLoadingHistory ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 mx-auto animate-spin text-teal-400" />
                      <p className="text-gray-400 mt-2">Loading SMS history...</p>
                    </div>
                  ) : historyError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto text-red-400" />
                      <p className="text-red-400 mt-2">{historyError}</p>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((sms) => (
                      <div key={sms.message_id} className="bg-black/30 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${getStatusColor(sms.status)}`}>
                                {getStatusIcon(sms.status)}
                              </div>
                              <div>
                                <h3 className="text-white font-medium">{formatPhone(sms.to)}</h3>
                                <p className="text-sm text-gray-400">Sent on {formatDate(sms.created_at)}</p>
                              </div>
                            </div>
                            {sms.message && (
                              <div className="bg-black/20 rounded-lg p-3">
                                <p className="text-gray-300 text-sm">{sms.message}</p>
                              </div>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Cost: {sms.cost} credits</span>
                              <span>ID: {sms.message_id}</span>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(sms.status)} border-0`}>
                            {sms.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                      <h3 className="text-white text-lg font-medium mb-2">No SMS History</h3>
                      <p className="text-gray-400">You haven&apos;t sent any SMS messages yet.</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-400">
                      Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_count} total)
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setCurrentPage(pagination.current_page - 1)}
                        disabled={pagination.current_page <= 1}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setCurrentPage(pagination.current_page + 1)}
                        disabled={pagination.current_page >= pagination.total_pages}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sender Management Section */}
        {mode === 'senders' && (
          <div className="space-y-8">
            {/* Sender Management Header */}
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-white/10 p-4 sm:p-6">
                <CardTitle className="text-white text-xl sm:text-2xl flex items-center space-x-3">
                  <div className="p-2 bg-orange-500/20 rounded-xl">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
                  </div>
                  <span>Sender Management</span>
                </CardTitle>
                <p className="text-gray-400 text-sm sm:text-base">Create and manage your SMS sender names</p>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                  {/* Create Sender Card */}
                  <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20">
                      <CardTitle className="text-white text-xl flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                          <CheckCircle className="h-5 w-5 text-blue-400" />
                        </div>
                        <span>Create New Sender</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <p className="text-gray-300 text-sm">
                          Create a new sender name for your SMS messages. Sender names must be approved by mobile network operators.
                        </p>
                        <Button 
                          onClick={() => setShowSenderNamesModal(true)}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl h-12 font-medium shadow-lg shadow-blue-500/25 transition-all duration-300"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Create Sender Name
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Manage Senders Card */}
                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-500/20">
                      <CardTitle className="text-white text-xl flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-xl">
                          <Users className="h-5 w-5 text-green-400" />
                        </div>
                        <span>Your Senders</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <p className="text-gray-300 text-sm">
                          View and manage your existing sender names. Only approved senders can be used for SMS.
                        </p>
                        <div className="space-y-3">
                          {senders.length === 0 ? (
                            <div className="text-center py-4">
                              <CheckCircle className="h-8 w-8 mx-auto text-gray-500 mb-2" />
                              <p className="text-gray-400 text-sm">No sender names found</p>
                            </div>
                          ) : (
                            senders.map((sender) => (
                              <div key={sender.id} className="bg-black/20 border border-white/10 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-white font-medium">{sender.name}</h4>
                                    <p className="text-gray-400 text-sm">{sender.description}</p>
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={`${
                                      sender.status === 'approved' 
                                        ? 'bg-green-500/20 border-green-500/30 text-green-300'
                                        : sender.status === 'pending'
                                        ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                                        : 'bg-red-500/20 border-red-500/30 text-red-300'
                                    }`}
                                  >
                                    {sender.status}
                                  </Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sender Guidelines */}
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl overflow-hidden mt-8">
                  <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
                    <CardTitle className="text-white text-xl flex items-center space-x-3">
                      <div className="p-2 bg-amber-500/20 rounded-xl">
                        <Info className="h-5 w-5 text-amber-400" />
                      </div>
                      <span>Sender Name Guidelines</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <span className="text-amber-400 font-semibold flex-shrink-0">1.</span>
                          <p>Maximum 11 alphanumeric characters or 14 numbers</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="text-amber-400 font-semibold flex-shrink-0">2.</span>
                          <p>Can contain underscores (_)</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="text-amber-400 font-semibold flex-shrink-0">3.</span>
                          <p>Mobile numbers must be in international format (233244111222)</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <span className="text-red-400 font-bold flex-shrink-0">4.</span>
                          <p className="font-bold text-red-400">Description is required</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="text-red-400 font-bold flex-shrink-0">5.</span>
                          <p className="font-bold text-red-400">Do not use brand names you don&apos;t own</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="text-amber-400 font-semibold flex-shrink-0">6.</span>
                          <p>Subject to approval by mobile network operators</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Cards - Only show on Single and Bulk SMS tabs */}
        {(mode === 'single' || mode === 'bulk') && (
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
                    <p>Support for CSV, Excel, JSON, and TSV file formats</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Auto-detect phone column or select manually</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p>All columns automatically available as template variables</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Use {'{{column_name}}'} syntax for any column in your file</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Preview messages before sending to avoid errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Sender Names Modal */}
      <SenderNamesModal
        isOpen={showSenderNamesModal}
        onClose={() => setShowSenderNamesModal(false)}
        onSubmit={handleAddSenderName}
        isLoading={isAddingSenderName}
      />
    </div>
  );
} 