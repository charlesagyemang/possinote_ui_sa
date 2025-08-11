'use client';

import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  Send, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle,
  Upload,
  Download,
  Trash2,
  AlertCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Search, 
  RefreshCw, 
  MessageSquare, 
  Eye, 
  FileDown 
} from 'lucide-react';
import { EmailService, EmailHistoryRecord } from '@/lib/services/email';
import { usePaymentRequired } from '@/components/PaymentRequiredProvider';

interface EmailResult {
  email: string;
  success: boolean;
  message_id?: string;
  submitted_at?: string;
  error?: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
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
    content: '',
    sender_name: ''
  });

  // Bulk email states
  const [bulkEmails, setBulkEmails] = useState({
    recipients: '',
    subject: '',
    content: '',
    sender_name: ''
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

  // Dynamic bulk (file-driven) states
  type DataRow = { [key: string]: string | number };
  const [fileData, setFileData] = useState<DataRow[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [emailColumn, setEmailColumn] = useState<string>('');
  const [subjectTemplate, setSubjectTemplate] = useState<string>('');
  const [contentTemplate, setContentTemplate] = useState<string>('');
  const [senderNameTemplate, setSenderNameTemplate] = useState<string>('');
  const [emailPreviews, setEmailPreviews] = useState<Array<{ email: string; subject: string; content: string; sender_name?: string; originalData: DataRow }>>([]);
  const [showDynamicPreview, setShowDynamicPreview] = useState<boolean>(false);

  // Email History states
  const [emails, setEmails] = useState<EmailHistoryRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  // Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('');
  const [senderNameFilter, setSenderNameFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Export states
  const [isExporting, setIsExporting] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      setHistoryError(null);
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: 20
      };

      // Use date filter if set, otherwise use custom date range
      if (dateFilter && dateFilter !== 'custom') {
        params.date_filter = dateFilter;
      } else {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      // Add other filters
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (minCost) {
        params.min_cost = parseFloat(minCost);
      }

      if (maxCost) {
        params.max_cost = parseFloat(maxCost);
      }

      if (emailFilter) {
        params.email = emailFilter;
      }

      if (senderNameFilter) {
        params.sender_name = senderNameFilter;
      }

      const data = await EmailService.getEmailHistory(params);

      if (data.success) {
        setEmails(data.emails || []);
        setPagination(data.pagination || null);
      } else {
        setHistoryError(data.error || 'Failed to fetch email history');
      }
    } catch (error: unknown) {
      console.error('Failed to fetch email history:', error);
      
      // Handle rate limiting
      if (error instanceof Error && error.message.includes('429')) {
        setHistoryError('Too many requests. Please wait a moment and try again.');
        setIsRateLimited(true);
        
        // Auto-clear rate limit after 30 seconds with countdown
        let countdown = 30;
        setRateLimitCountdown(countdown);
        
        const countdownInterval = setInterval(() => {
          countdown--;
          setRateLimitCountdown(countdown);
          
          if (countdown <= 0) {
            clearInterval(countdownInterval);
            setIsRateLimited(false);
            setHistoryError(null);
            setRateLimitCountdown(0);
          }
        }, 1000);
      } else {
        setHistoryError('Failed to load email history. Please try again.');
        setIsRateLimited(false);
      }
    } finally {
      setIsHistoryLoading(false);
    }
  }, [
    currentPage, 
    statusFilter, 
    dateFilter, 
    emailFilter, 
    senderNameFilter,
    minCost, 
    maxCost, 
    startDate, 
    endDate
  ]);

  // Single useEffect for all filter changes
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [
    currentPage, 
    statusFilter, 
    dateFilter, 
    emailFilter, 
    senderNameFilter,
    searchTerm, 
    minCost, 
    maxCost, 
    startDate, 
    endDate,
    fetchHistory,
    activeTab
  ]);

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

  // ===== Dynamic bulk helpers (CSV/TSV/Excel/JSON) =====
  const parseCSV = async (csvText: string): Promise<DataRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as DataRow[]),
        error: (error: unknown) => reject(error)
      });
    });
  };

  const parseTSV = async (tsvText: string): Promise<DataRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(tsvText, {
        header: true,
        skipEmptyLines: true,
        delimiter: '\t',
        complete: (results) => resolve(results.data as DataRow[]),
        error: (error: unknown) => reject(error)
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
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const parseJSON = (jsonText: string): DataRow[] => {
    const data = JSON.parse(jsonText);
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data];
    throw new Error('Invalid JSON format');
  };

  const handleDynamicFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      let rows: DataRow[] = [];
      if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        rows = await parseExcel(file);
      } else if (file.name.toLowerCase().endsWith('.tsv')) {
        rows = await parseTSV(await file.text());
      } else if (file.name.toLowerCase().endsWith('.json')) {
        rows = parseJSON(await file.text());
      } else {
        rows = await parseCSV(await file.text());
      }
      if (!rows.length) throw new Error('No data found in file');
      const headers = Object.keys(rows[0]);
      setFileHeaders(headers);
      setFileData(rows);
      const autoEmail = headers.find(h => h.toLowerCase().includes('email')) || '';
      setEmailColumn(prev => prev || autoEmail);
      setSuccess(`Loaded ${rows.length} rows. Columns: ${headers.join(', ')}`);
    } catch (err) {
      console.error('Dynamic file parse error:', err);
      setError('Failed to parse file');
    }
  };

  const buildTemplate = (tpl: string, row: DataRow): string => {
    let out = tpl;
    Object.keys(row).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      out = out.replace(regex, String(row[key] ?? ''));
    });
    return out;
  };

  const previewDynamicEmails = () => {
    if (!fileData.length || !emailColumn || !subjectTemplate.trim() || !contentTemplate.trim()) {
      setError('Upload file, select email column, and add subject/content templates');
      return;
    }
    const previews: Array<{ email: string; subject: string; content: string; sender_name?: string; originalData: DataRow }>= [];
    for (const row of fileData) {
      const email = String(row[emailColumn] || '').trim();
      if (!email) continue;
      const subject = buildTemplate(subjectTemplate, row);
      const content = buildTemplate(contentTemplate, row);
      const sender_name = senderNameTemplate.trim() ? buildTemplate(senderNameTemplate, row) : undefined;
      previews.push({ email, subject, content, sender_name, originalData: row });
    }
    setEmailPreviews(previews);
    setShowDynamicPreview(true);
    setSuccess(`Prepared ${previews.length} personalized emails. Review before sending.`);
  };

  const sendDynamicBulkEmails = async () => {
    if (!emailPreviews.length) {
      setError('No emails to send');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const concurrency = 5;
      let index = 0;
      let successCount = 0;
      let failCount = 0;
      const worker = async () => {
        while (index < emailPreviews.length) {
          const current = index++;
          const item = emailPreviews[current];
          try {
            const resp = await EmailService.sendEmail(item.email, item.subject, item.content, item.sender_name);
            if (resp.success) successCount++; else failCount++;
          } catch {
            failCount++;
          }
        }
      };
      const workers = Array.from({ length: Math.min(concurrency, emailPreviews.length) }, () => worker());
      await Promise.all(workers);
      setSuccess(`Personalized emails sent. Successful: ${successCount}, Failed: ${failCount}`);
      // reset
      setFileData([]);
      setFileHeaders([]);
      setEmailColumn('');
      setSubjectTemplate('');
      setContentTemplate('');
      setSenderNameTemplate('');
      setEmailPreviews([]);
      setShowDynamicPreview(false);
    } catch (err) {
      console.error('Dynamic bulk email send error:', err);
      setError('Failed to send personalized bulk emails');
    } finally {
      setIsLoading(false);
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
        singleEmail.content,
        singleEmail.sender_name || undefined
      );

      if (response.success) {
        const successMessage = response.message_id 
          ? `Email queued successfully! Message ID: ${response.message_id}`
          : response.message || 'Email sent successfully!';
        
        setSuccess(successMessage);
        setSingleEmail({ recipient: '', subject: '', content: '', sender_name: '' });
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
        bulkEmails.content,
        bulkEmails.sender_name || undefined
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
        setBulkEmails({ recipients: '', subject: '', content: '', sender_name: '' });
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

  // Email History helper functions
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'delivered':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      case 'failed':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case 'cancelled':
        return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatEmail = (email: string) => {
    // Show only first and last part for privacy
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) return email;
    return `${localPart.substring(0, 3)}***@${domain}`;
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      
      // Fetch all data for export (without pagination)
      const params: Record<string, string | number> = {
        per_page: 1000 // Get maximum data
      };

      // Use date filter if set, otherwise use custom date range
      if (dateFilter && dateFilter !== 'custom') {
        params.date_filter = dateFilter;
      } else {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      // Add other filters
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (minCost) {
        params.min_cost = parseFloat(minCost);
      }

      if (maxCost) {
        params.max_cost = parseFloat(maxCost);
      }

      if (emailFilter) {
        params.email = emailFilter;
      }

      if (senderNameFilter) {
        params.sender_name = senderNameFilter;
      }

      const data = await EmailService.getEmailHistory(params);
      const allEmails = data.emails || [];
      
      // Create CSV content
      const headers = ['Message ID', 'Recipient', 'Subject', 'Status', 'Cost (Credits)', 'Date', 'API Key', 'Sender Name'];
      const csvContent = [
        headers.join(','),
        ...allEmails.map((email: EmailHistoryRecord) => [
          email.message_id,
          email.recipient,
          `"${email.subject.replace(/"/g, '""')}"`,
          email.status,
          email.cost,
          new Date(email.created_at).toLocaleString(),
          email.api_key_name || '',
          email.sender_name || ''
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename based on filters
      let filename = 'email_history';
      if (dateFilter && dateFilter !== 'custom') {
        filename += `_${dateFilter}`;
      } else {
        filename += `_${startDate}_to_${endDate}`;
      }
      if (statusFilter !== 'all') {
        filename += `_${statusFilter}`;
      }
      filename += '.csv';
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('today');
    setEmailFilter('');
    setSenderNameFilter('');
    setMinCost('');
    setMaxCost('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-6">
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
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="single" className="data-[state=active]:bg-purple-600">
              <Mail className="h-4 w-4 mr-2" />
              Single Email
            </TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-purple-600">
              <Users className="h-4 w-4 mr-2" />
              Bulk Email
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
              <MessageSquare className="h-4 w-4 mr-2" />
              Email History
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="sender-name" className="text-gray-300">Sender Name (Optional)</Label>
                    <Input
                      id="sender-name"
                      placeholder="Support Team"
                      value={singleEmail.sender_name}
                      onChange={(e) => setSingleEmail(prev => ({ ...prev, sender_name: e.target.value }))}
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
                  <div className="space-y-2">
                    <Label htmlFor="bulk-sender-name" className="text-gray-300">Sender Name (Optional)</Label>
                    <Input
                      id="bulk-sender-name"
                      placeholder="Support Team"
                      value={bulkEmails.sender_name}
                      onChange={(e) => setBulkEmails(prev => ({ ...prev, sender_name: e.target.value }))}
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

            {/* Dynamic Bulk Email (File Upload) */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  <span>Dynamic Bulk Email (File Upload)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Upload CSV/Excel/JSON/TSV</Label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json,.tsv"
                    onChange={handleDynamicFileUpload}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white hover:file:from-purple-600 hover:file:to-pink-600"
                  />
                  {fileData.length > 0 && (
                    <p className="text-sm text-green-400">Loaded {fileData.length} rows • Columns: {fileHeaders.join(', ')}</p>
                  )}
                </div>

                {/* Email Column */}
                {fileHeaders.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Email Column (required)</Label>
                    <select
                      value={emailColumn}
                      onChange={(e) => setEmailColumn(e.target.value)}
                      className="w-full bg-slate-700 border-slate-600 rounded-xl p-3 text-white"
                    >
                      <option value="">Select email column...</option>
                      {fileHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Templates */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Subject Template</Label>
                    <Input
                      value={subjectTemplate}
                      onChange={(e) => setSubjectTemplate(e.target.value)}
                      placeholder="Welcome {{first_name}} to {{company}}"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Sender Name Template (Optional)</Label>
                    <Input
                      value={senderNameTemplate}
                      onChange={(e) => setSenderNameTemplate(e.target.value)}
                      placeholder="Support Team"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {fileHeaders.map(h => (
                        <Badge key={h} variant="outline" className="text-xs cursor-pointer bg-purple-500/20 border-purple-500/30 text-purple-300" onClick={() => setSenderNameTemplate(senderNameTemplate + `{{${h}}}`)}>
                          {`{{${h}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300">Content Template</Label>
                    <Textarea
                      value={contentTemplate}
                      onChange={(e) => setContentTemplate(e.target.value)}
                      placeholder="Hello {{first_name}}, we are excited to have you at {{company}}."
                      rows={6}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {fileHeaders.map(h => (
                        <Badge key={h} variant="outline" className="text-xs cursor-pointer bg-purple-500/20 border-purple-500/30 text-purple-300" onClick={() => setContentTemplate(contentTemplate + `{{${h}}}`)}>
                          {`{{${h}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={previewDynamicEmails} disabled={!fileData.length || !emailColumn || !subjectTemplate.trim() || !contentTemplate.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                    Preview Personalized Emails
                  </Button>
                  {showDynamicPreview && (
                    <Button onClick={sendDynamicBulkEmails} disabled={isLoading || emailPreviews.length === 0} className="bg-purple-600 hover:bg-purple-700">
                      {isLoading ? 'Sending...' : `Send ${emailPreviews.length} Emails`}
                    </Button>
                  )}
                </div>

                {/* Preview */}
                {showDynamicPreview && emailPreviews.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Preview (first 5)</Label>
                    {emailPreviews.slice(0, 5).map((p, idx) => (
                      <div key={idx} className="border border-slate-700 rounded-xl p-4">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                          <span>{p.email}</span>
                          <div className="text-right">
                            <div>Subject: <span className="text-gray-200">{p.subject}</span></div>
                            {p.sender_name && <div>Sender: <span className="text-gray-200">{p.sender_name}</span></div>}
                          </div>
                        </div>
                        <p className="text-gray-200 text-sm whitespace-pre-wrap">{p.content}</p>
                      </div>
                    ))}
                    {emailPreviews.length > 5 && (
                      <p className="text-xs text-gray-500">...and {emailPreviews.length - 5} more</p>
                    )}
                  </div>
                )}
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

                     {/* Email History Tab */}
           <TabsContent value="history" className="space-y-6">
             {/* Error/Success Messages */}
             {historyError && (
               <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center space-x-2">
                 <XCircle className="h-5 w-5 text-red-400" />
                 <span className="text-red-300">{historyError}</span>
                 {isRateLimited && (
                   <span className="text-red-300 ml-2">
                     (Retry in {rateLimitCountdown}s)
                   </span>
                 )}
               </div>
             )}

             {/* Filters */}
             <Card className="bg-slate-800/50 border-slate-700">
               <CardHeader>
                 <CardTitle className="text-white flex items-center space-x-2">
                   <Filter className="h-5 w-5 text-purple-400" />
                   <span>Filters</span>
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Search */}
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                   <Input
                     placeholder="Search by email, subject, or content..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-10 bg-slate-700 border-slate-600 text-white"
                   />
                 </div>

                 {/* Filter Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   {/* Status Filter */}
                   <div className="space-y-2">
                     <Label className="text-gray-300">Status</Label>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                       <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                         <SelectValue placeholder="All Statuses" />
                       </SelectTrigger>
                       <SelectContent className="bg-slate-700 border-slate-600">
                         <SelectItem value="all">All Statuses</SelectItem>
                         <SelectItem value="pending">Pending</SelectItem>
                         <SelectItem value="sent">Sent</SelectItem>
                         <SelectItem value="delivered">Delivered</SelectItem>
                         <SelectItem value="failed">Failed</SelectItem>
                         <SelectItem value="cancelled">Cancelled</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   {/* Date Filter */}
                   <div className="space-y-2">
                     <Label className="text-gray-300">Date Range</Label>
                     <Select value={dateFilter} onValueChange={setDateFilter}>
                       <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                         <SelectValue placeholder="Select date range" />
                       </SelectTrigger>
                       <SelectContent className="bg-slate-700 border-slate-600">
                         <SelectItem value="all">All Time</SelectItem>
                         <SelectItem value="today">Today</SelectItem>
                         <SelectItem value="yesterday">Yesterday</SelectItem>
                         <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                         <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                         <SelectItem value="this_month">This Month</SelectItem>
                         <SelectItem value="last_month">Last Month</SelectItem>
                         <SelectItem value="custom">Custom Range</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   {/* Email Filter */}
                   <div className="space-y-2">
                     <Label className="text-gray-300">Email Address</Label>
                     <Input
                       placeholder="Filter by email..."
                       value={emailFilter}
                       onChange={(e) => setEmailFilter(e.target.value)}
                       className="bg-slate-700 border-slate-600 text-white"
                     />
                   </div>

                   {/* Sender Name Filter */}
                   <div className="space-y-2">
                     <Label className="text-gray-300">Sender Name</Label>
                     <Input
                       placeholder="Filter by sender..."
                       value={senderNameFilter}
                       onChange={(e) => setSenderNameFilter(e.target.value)}
                       className="bg-slate-700 border-slate-600 text-white"
                     />
                   </div>
                 </div>

                 {/* Custom Date Range */}
                 {dateFilter === 'custom' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label className="text-gray-300">Start Date</Label>
                       <Input
                         type="date"
                         value={startDate}
                         onChange={(e) => setStartDate(e.target.value)}
                         className="bg-slate-700 border-slate-600 text-white"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-gray-300">End Date</Label>
                       <Input
                         type="date"
                         value={endDate}
                         onChange={(e) => setEndDate(e.target.value)}
                         className="bg-slate-700 border-slate-600 text-white"
                       />
                     </div>
                   </div>
                 )}

                 {/* Cost Range */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-gray-300">Min Cost (Credits)</Label>
                     <Input
                       type="number"
                       step="0.001"
                       placeholder="0.001"
                       value={minCost}
                       onChange={(e) => setMinCost(e.target.value)}
                       className="bg-slate-700 border-slate-600 text-white"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-gray-300">Max Cost (Credits)</Label>
                     <Input
                       type="number"
                       step="0.001"
                       placeholder="0.01"
                       value={maxCost}
                       onChange={(e) => setMaxCost(e.target.value)}
                       className="bg-slate-700 border-slate-600 text-white"
                     />
                   </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex justify-between items-center">
                   <Button
                     onClick={resetFilters}
                     variant="outline"
                     className="border-slate-600 text-gray-300 hover:bg-slate-700"
                   >
                     Reset Filters
                   </Button>
                   <Button
                     onClick={exportToCSV}
                     disabled={isExporting}
                     className="bg-purple-600 hover:bg-purple-700"
                   >
                     {isExporting ? (
                       <div className="flex items-center space-x-2">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                         <span>Exporting...</span>
                       </div>
                     ) : (
                       <div className="flex items-center space-x-2">
                         <FileDown className="h-4 w-4" />
                         <span>Export CSV</span>
                       </div>
                     )}
                   </Button>
                 </div>
               </CardContent>
             </Card>

             {/* Results */}
             <Card className="bg-slate-800/50 border-slate-700">
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <CardTitle className="text-white flex items-center space-x-2">
                     <MessageSquare className="h-5 w-5 text-purple-400" />
                     <span>Email History</span>
                   </CardTitle>
                   <div className="flex items-center space-x-2">
                     <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                       {pagination?.total_count || 0} total
                     </Badge>
                     <Button
                       onClick={() => fetchHistory()}
                       variant="outline"
                       size="sm"
                       className="border-slate-600 text-gray-300 hover:bg-slate-700"
                     >
                       <RefreshCw className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 {isHistoryLoading ? (
                   <div className="text-center py-8">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                     <p className="text-gray-400">Loading email history...</p>
                   </div>
                 ) : emails.length === 0 ? (
                   <div className="text-center py-8">
                     <Mail className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                     <p className="text-gray-400">No emails found</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {emails
                       .filter((email: EmailHistoryRecord) =>
                         email.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.message_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (email.content && email.content.toLowerCase().includes(searchTerm.toLowerCase()))
                       )
                       .map((email) => (
                         <div
                           key={email.message_id}
                           className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                         >
                           <div className="flex items-start justify-between">
                             <div className="flex-1 space-y-2">
                               <div className="flex items-center space-x-3">
                                 <Badge className={getStatusColor(email.status)}>
                                   <div className="flex items-center space-x-1">
                                     {getStatusIcon(email.status)}
                                     <span className="capitalize">{email.status}</span>
                                   </div>
                                 </Badge>
                                 <span className="text-sm text-gray-400">
                                   {formatDate(email.created_at)}
                                 </span>
                                 <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                                   {parseFloat(String(email.cost)).toFixed(1)} credit{parseFloat(String(email.cost)) !== 1 ? 's' : ''}
                                 </Badge>
                               </div>
                               
                               <div className="space-y-1">
                                 <div className="flex items-center space-x-2">
                                   <Mail className="h-4 w-4 text-gray-400" />
                                   <span className="text-white font-medium">
                                     {formatEmail(email.recipient)}
                                   </span>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                   <MessageSquare className="h-4 w-4 text-gray-400" />
                                   <span className="text-gray-300 font-medium">
                                     {email.subject}
                                   </span>
                                 </div>
                                 {email.api_key_name && (
                                   <div className="flex items-center space-x-2">
                                     <span className="text-xs text-gray-500">API Key:</span>
                                     <span className="text-xs text-gray-400">{email.api_key_name}</span>
                                   </div>
                                 )}
                                 {email.sender_name && (
                                   <div className="flex items-center space-x-2">
                                     <span className="text-xs text-gray-500">Sender:</span>
                                     <span className="text-xs text-gray-400">{email.sender_name}</span>
                                   </div>
                                 )}
                               </div>
                             </div>
                             
                             <div className="flex items-center space-x-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => {
                                   // Show email content in a modal or expand
                                   console.log('Email content:', email.content);
                                 }}
                                 className="border-slate-600 text-gray-300 hover:bg-slate-700"
                               >
                                 <Eye className="h-4 w-4" />
                               </Button>
                             </div>
                           </div>
                         </div>
                       ))}
                   </div>
                 )}
               </CardContent>
             </Card>

             {/* Pagination */}
             {pagination && pagination.total_pages > 1 && (
               <Card className="bg-slate-800/50 border-slate-700">
                 <CardContent className="p-4">
                   <div className="flex items-center justify-between">
                     <div className="text-sm text-gray-400">
                       Showing page {pagination.current_page} of {pagination.total_pages} 
                       ({pagination.total_count} total emails)
                     </div>
                     <div className="flex items-center space-x-2">
                       <Button
                         onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                         disabled={currentPage === 1}
                         variant="outline"
                         size="sm"
                         className="border-slate-600 text-gray-300 hover:bg-slate-700"
                       >
                         <ChevronLeft className="h-4 w-4" />
                       </Button>
                       <span className="text-sm text-gray-300 px-3">
                         {currentPage} / {pagination.total_pages}
                       </span>
                       <Button
                         onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
                         disabled={currentPage === pagination.total_pages}
                         variant="outline"
                         size="sm"
                         className="border-slate-600 text-gray-300 hover:bg-slate-700"
                       >
                         <ChevronRight className="h-4 w-4" />
                       </Button>
                     </div>
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
