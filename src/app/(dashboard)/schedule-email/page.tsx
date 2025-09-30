'use client';

import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search,
  FileText,
  Clock,
  Users,
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  RefreshCw, 
  MessageSquare, 
  Eye, 
  FileDown,
  Mail
} from 'lucide-react';
import { 
  SchedulingService, 
  ScheduledEmail, 
  ScheduledEmailFilters,
  ScheduleEmailRequest,
  ScheduleBulkEmailRequest
} from '@/lib/services/scheduling';
import { usePaymentRequired } from '@/components/PaymentRequiredProvider';

export default function ScheduleEmailPage() {
  const { showPaymentRequired } = usePaymentRequired();
  const [activeTab, setActiveTab] = useState('schedule-single');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Scheduled emails state
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [pagination, setPagination] = useState<{
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  } | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('');
  const [senderNameFilter, setSenderNameFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Schedule email states
  const [scheduleEmail, setScheduleEmail] = useState({
    recipient: '',
    subject: '',
    content: '',
    sender_name: '',
    scheduled_at: ''
  });
  const [isScheduling, setIsScheduling] = useState(false);

  // Bulk schedule states
  const [bulkSchedule, setBulkSchedule] = useState({
    subject: '',
    content: '',
    sender_name: '',
    scheduled_at: '',
    recipients: ''
  });
  const [isBulkScheduling, setIsBulkScheduling] = useState(false);

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
  const [isDynamicScheduling, setIsDynamicScheduling] = useState(false);

  // Export states
  const [isExporting, setIsExporting] = useState(false);

  const fetchScheduledEmails = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      setHistoryError(null);
      const params: ScheduledEmailFilters = {
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

      if (emailFilter) {
        params.recipient = emailFilter;
      }

      if (senderNameFilter) {
        params.sender_name = senderNameFilter;
      }

      if (subjectFilter) {
        params.subject = subjectFilter;
      }

      const data = await SchedulingService.getScheduledEmails(params);

      if (data.success) {
        setScheduledEmails(data.data.scheduled_emails);
        setPagination(data.data.pagination);
      } else {
        setHistoryError(data.error || 'Failed to fetch scheduled emails');
      }
    } catch (error: unknown) {
      console.error('Failed to fetch scheduled emails:', error);
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to view scheduled emails. Please reload your account.',
            '/billing'
          );
          return;
        }
      }
      
      setHistoryError('Failed to load scheduled emails. Please try again.');
    } finally {
      setIsHistoryLoading(false);
    }
  }, [
    currentPage, 
    statusFilter, 
    dateFilter, 
    emailFilter, 
    senderNameFilter,
    subjectFilter,
    startDate, 
    endDate,
    showPaymentRequired
  ]);

  // Single useEffect for all filter changes
  useEffect(() => {
    if (activeTab === 'scheduled') {
      fetchScheduledEmails();
    }
  }, [
    currentPage, 
    statusFilter, 
    dateFilter, 
    emailFilter, 
    senderNameFilter,
    subjectFilter,
    searchTerm, 
    startDate, 
    endDate,
    fetchScheduledEmails,
    activeTab
  ]);

  const scheduleSingleEmail = async () => {
    if (!scheduleEmail.recipient || !scheduleEmail.subject || !scheduleEmail.content || !scheduleEmail.scheduled_at) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsScheduling(true);
      setError(null);
      setSuccess(null);

      const request: ScheduleEmailRequest = {
        scheduled_email: {
          recipient: scheduleEmail.recipient,
          subject: scheduleEmail.subject,
          content: scheduleEmail.content,
          sender_name: scheduleEmail.sender_name || undefined,
          scheduled_at: scheduleEmail.scheduled_at
        }
      };

      const response = await SchedulingService.scheduleEmail(request);

      if (response.success) {
        setSuccess(`Email scheduled successfully! ID: ${response.data.id}`);
        setScheduleEmail({
          recipient: '',
          subject: '',
          content: '',
          sender_name: '',
          scheduled_at: ''
        });
        // Refresh the scheduled emails list
        fetchScheduledEmails();
      } else {
        setError(response.error || 'Failed to schedule email');
      }
    } catch (error: unknown) {
      console.error('Failed to schedule email:', error);
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to schedule email. Please reload your account.',
            '/billing'
          );
          return;
        }
      }
      
      setError('Failed to schedule email. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  const scheduleBulkEmails = async () => {
    if (!bulkSchedule.subject || !bulkSchedule.content || !bulkSchedule.scheduled_at || !bulkSchedule.recipients) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsBulkScheduling(true);
      setError(null);
      setSuccess(null);

      const recipients = bulkSchedule.recipients
        .split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      if (recipients.length === 0) {
        setError('Please enter at least one recipient email');
        return;
      }

      const request: ScheduleBulkEmailRequest = {
        bulk_scheduled_email: {
          subject: bulkSchedule.subject,
          content: bulkSchedule.content,
          sender_name: bulkSchedule.sender_name || undefined,
          scheduled_at: bulkSchedule.scheduled_at,
          recipients
        }
      };

      const response = await SchedulingService.scheduleBulkEmails(request);

      if (response.success) {
        setSuccess(`Bulk emails scheduled successfully! Batch ID: ${response.data.batch_id}, Total: ${response.data.total_scheduled}`);
        setBulkSchedule({
          subject: '',
          content: '',
          sender_name: '',
          scheduled_at: '',
          recipients: ''
        });
        // Refresh the scheduled emails list
        fetchScheduledEmails();
      } else {
        setError(response.error || 'Failed to schedule bulk emails');
      }
    } catch (error: unknown) {
      console.error('Failed to schedule bulk emails:', error);
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to schedule bulk emails. Please reload your account.',
            '/billing'
          );
          return;
        }
      }
      
      setError('Failed to schedule bulk emails. Please try again.');
    } finally {
      setIsBulkScheduling(false);
    }
  };

  const cancelScheduledEmail = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email? Credits will be refunded.')) {
      return;
    }

    try {
      const response = await SchedulingService.cancelScheduledEmail(id);

      if (response.success) {
        setSuccess(`Email cancelled successfully! Refunded: ₵${response.data.refunded_credits}`);
        // Refresh the scheduled emails list
        fetchScheduledEmails();
      } else {
        setError(response.error || 'Failed to cancel scheduled email');
      }
    } catch (error: unknown) {
      console.error('Failed to cancel scheduled email:', error);
      setError('Failed to cancel scheduled email. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case 'failed':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      case 'cancelled':
        return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
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
      const params: ScheduledEmailFilters = {
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

      if (emailFilter) {
        params.recipient = emailFilter;
      }

      if (senderNameFilter) {
        params.sender_name = senderNameFilter;
      }

      if (subjectFilter) {
        params.subject = subjectFilter;
      }

      const data = await SchedulingService.getScheduledEmails(params);
      const allEmails = data.data.scheduled_emails;
      
      // Create CSV content
      const headers = ['ID', 'Recipient', 'Subject', 'Status', 'Cost (Credits)', 'Scheduled At', 'Sender Name', 'Batch ID', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...allEmails.map((email: ScheduledEmail) => [
          email.id,
          email.recipient,
          `"${email.subject.replace(/"/g, '""')}"`,
          email.status,
          email.cost,
          new Date(email.scheduled_at).toLocaleString(),
          email.sender_name || '',
          email.batch_id || '',
          new Date(email.created_at).toLocaleString()
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename based on filters
      let filename = 'scheduled_emails';
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
    setSuccess(`Prepared ${previews.length} personalized emails. Review before scheduling.`);
  };

  const scheduleDynamicBulkEmails = async () => {
    if (!emailPreviews.length) {
      setError('No emails to schedule');
      return;
    }
    setIsDynamicScheduling(true);
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
            const request: ScheduleEmailRequest = {
              scheduled_email: {
                recipient: item.email,
                subject: item.subject,
                content: item.content,
                sender_name: item.sender_name,
                scheduled_at: bulkSchedule.scheduled_at
              }
            };
            const resp = await SchedulingService.scheduleEmail(request);
            if (resp.success) successCount++; else failCount++;
          } catch {
            failCount++;
          }
        }
      };
      const workers = Array.from({ length: Math.min(concurrency, emailPreviews.length) }, () => worker());
      await Promise.all(workers);
      setSuccess(`Personalized emails scheduled. Successful: ${successCount}, Failed: ${failCount}`);
      // reset
      setFileData([]);
      setFileHeaders([]);
      setEmailColumn('');
      setSubjectTemplate('');
      setContentTemplate('');
      setSenderNameTemplate('');
      setEmailPreviews([]);
      setShowDynamicPreview(false);
      // Refresh the scheduled emails list
      fetchScheduledEmails();
    } catch (err) {
      console.error('Dynamic bulk email schedule error:', err);
      setError('Failed to schedule personalized bulk emails');
    } finally {
      setIsDynamicScheduling(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setEmailFilter('');
    setSenderNameFilter('');
    setSubjectFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 sm:gap-0">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Schedule Email</h1>
            <p className="text-sm sm:text-base text-gray-400">Schedule emails for future delivery and manage scheduled emails</p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
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
          <div className="overflow-x-auto">
            <TabsList className="w-full min-w-max sm:grid sm:grid-cols-3 bg-slate-800/50">
              <TabsTrigger value="schedule-single" className="data-[state=active]:bg-purple-600 flex-shrink-0 px-2 sm:px-4">
                <Mail className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Schedule Single</span>
                <span className="sm:hidden ml-1">Single</span>
              </TabsTrigger>
              <TabsTrigger value="schedule-bulk" className="data-[state=active]:bg-purple-600 flex-shrink-0 px-2 sm:px-4">
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Schedule Bulk</span>
                <span className="sm:hidden ml-1">Bulk</span>
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="data-[state=active]:bg-purple-600 flex-shrink-0 px-2 sm:px-4">
                <Clock className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Scheduled Emails</span>
                <span className="sm:hidden ml-1">History</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scheduled Emails Tab */}
          <TabsContent value="scheduled" className="space-y-6">
            {/* Error/Success Messages */}
            {historyError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-300">{historyError}</span>
              </div>
            )}

            {/* Filters */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center space-x-2 text-base sm:text-lg">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by email, subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white h-9 sm:h-10 text-sm sm:text-base"
                  />
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Status Filter */}
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-gray-300 text-sm sm:text-base">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 sm:h-10 text-sm sm:text-base">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Filter */}
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-gray-300 text-sm sm:text-base">Date Range</Label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 sm:h-10 text-sm sm:text-base">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="this_week">This Week</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email Filter */}
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-gray-300 text-sm sm:text-base">Email Address</Label>
                    <Input
                      placeholder="Filter by email..."
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white h-9 sm:h-10 text-sm sm:text-base"
                    />
                  </div>

                  {/* Sender Name Filter */}
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-gray-300 text-sm sm:text-base">Sender Name</Label>
                    <Input
                      placeholder="Filter by sender..."
                      value={senderNameFilter}
                      onChange={(e) => setSenderNameFilter(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white h-9 sm:h-10 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Subject Filter */}
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-gray-300 text-sm sm:text-base">Subject</Label>
                  <Input
                    placeholder="Filter by subject..."
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white h-9 sm:h-10 text-sm sm:text-base"
                  />
                </div>

                {/* Custom Date Range */}
                {dateFilter === 'custom' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1 sm:space-y-2">
                      <Label className="text-gray-300 text-sm sm:text-base">Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white h-9 sm:h-10 text-sm sm:text-base"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label className="text-gray-300 text-sm sm:text-base">End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white h-9 sm:h-10 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    className="border-slate-600 text-gray-300 hover:bg-slate-700 w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
                  >
                    Reset Filters
                  </Button>
                  <Button
                    onClick={exportToCSV}
                    disabled={isExporting}
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
                  >
                    {isExporting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm sm:text-base">Exporting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <FileDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-sm sm:text-base">Export CSV</span>
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
                    <Clock className="h-5 w-5 text-purple-400" />
                    <span>Scheduled Emails</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      {pagination?.total_count || 0} total
                    </Badge>
                    <Button
                      onClick={() => fetchScheduledEmails()}
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
                    <p className="text-gray-400">Loading scheduled emails...</p>
                  </div>
                ) : scheduledEmails.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No scheduled emails found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledEmails
                      .filter((email: ScheduledEmail) =>
                        email.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        email.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (email.content && email.content.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map((email) => (
                        <div
                          key={email.id}
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
                                  Scheduled: {formatDate(email.scheduled_at)}
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
                                {email.sender_name && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">Sender:</span>
                                    <span className="text-xs text-gray-400">{email.sender_name}</span>
                                  </div>
                                )}
                                {email.batch_id && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">Batch ID:</span>
                                    <span className="text-xs text-gray-400">{email.batch_id}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {email.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => cancelScheduledEmail(email.id)}
                                  className="border-red-600 text-red-300 hover:bg-red-500/10"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
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

          {/* Schedule Single Email Tab */}
          <TabsContent value="schedule-single" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-purple-400" />
                  <span>Schedule Single Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient" className="text-gray-300">Recipient Email *</Label>
                    <Input
                      id="recipient"
                      type="email"
                      placeholder="recipient@example.com"
                      value={scheduleEmail.recipient}
                      onChange={(e) => setScheduleEmail(prev => ({ ...prev, recipient: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_at" className="text-gray-300">Schedule Date & Time *</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={scheduleEmail.scheduled_at}
                      onChange={(e) => setScheduleEmail(prev => ({ ...prev, scheduled_at: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-gray-300">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Email subject"
                    value={scheduleEmail.subject}
                    onChange={(e) => setScheduleEmail(prev => ({ ...prev, subject: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender_name" className="text-gray-300">Sender Name (Optional)</Label>
                  <Input
                    id="sender_name"
                    placeholder="Your Name or Company"
                    value={scheduleEmail.sender_name}
                    onChange={(e) => setScheduleEmail(prev => ({ ...prev, sender_name: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-gray-300">Email Content (HTML) *</Label>
                  <Textarea
                    id="content"
                    placeholder="<h1>Hello!</h1><p>This is your scheduled email content.</p>"
                    value={scheduleEmail.content}
                    onChange={(e) => setScheduleEmail(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="bg-slate-700 border-slate-600 text-white font-mono"
                  />
                  <p className="text-sm text-gray-400">
                    You can use HTML tags for formatting
                  </p>
                </div>

                <Button 
                  onClick={scheduleSingleEmail} 
                  disabled={isScheduling}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isScheduling ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Scheduling...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Schedule Email</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Bulk Email Tab */}
          <TabsContent value="schedule-bulk" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  <span>Schedule Bulk Emails</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-scheduled_at" className="text-gray-300">Schedule Date & Time *</Label>
                    <Input
                      id="bulk-scheduled_at"
                      type="datetime-local"
                      value={bulkSchedule.scheduled_at}
                      onChange={(e) => setBulkSchedule(prev => ({ ...prev, scheduled_at: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk-sender_name" className="text-gray-300">Sender Name (Optional)</Label>
                    <Input
                      id="bulk-sender_name"
                      placeholder="Your Name or Company"
                      value={bulkSchedule.sender_name}
                      onChange={(e) => setBulkSchedule(prev => ({ ...prev, sender_name: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulk-subject" className="text-gray-300">Subject *</Label>
                  <Input
                    id="bulk-subject"
                    placeholder="Bulk email subject"
                    value={bulkSchedule.subject}
                    onChange={(e) => setBulkSchedule(prev => ({ ...prev, subject: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-recipients" className="text-gray-300">Recipient Emails *</Label>
                  <Textarea
                    id="bulk-recipients"
                    placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
                    value={bulkSchedule.recipients}
                    onChange={(e) => setBulkSchedule(prev => ({ ...prev, recipients: e.target.value }))}
                    rows={4}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-sm text-gray-400">
                    Enter one email per line
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulk-content" className="text-gray-300">Email Content (HTML) *</Label>
                  <Textarea
                    id="bulk-content"
                    placeholder="<h1>Hello!</h1><p>This is your bulk scheduled email content.</p>"
                    value={bulkSchedule.content}
                    onChange={(e) => setBulkSchedule(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="bg-slate-700 border-slate-600 text-white font-mono"
                  />
                  <p className="text-sm text-gray-400">
                    You can use HTML tags for formatting
                  </p>
                </div>

                <Button 
                  onClick={scheduleBulkEmails} 
                  disabled={isBulkScheduling}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isBulkScheduling ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Scheduling Bulk Emails...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Schedule Bulk Emails</span>
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
                  <span>Dynamic Bulk Email Scheduling (File Upload)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Schedule Date & Time */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Schedule Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={bulkSchedule.scheduled_at}
                    onChange={(e) => setBulkSchedule(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

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
                  <Button onClick={previewDynamicEmails} disabled={!fileData.length || !emailColumn || !subjectTemplate.trim() || !contentTemplate.trim() || !bulkSchedule.scheduled_at} className="bg-emerald-600 hover:bg-emerald-700">
                    Preview Personalized Emails
                  </Button>
                  {showDynamicPreview && (
                    <Button onClick={scheduleDynamicBulkEmails} disabled={isDynamicScheduling || emailPreviews.length === 0} className="bg-purple-600 hover:bg-purple-700">
                      {isDynamicScheduling ? 'Scheduling...' : `Schedule ${emailPreviews.length} Emails`}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

