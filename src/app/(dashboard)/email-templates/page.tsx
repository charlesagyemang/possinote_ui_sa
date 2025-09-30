'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Send,
  Search,
  FileText,
  Calendar,
  Store,
  Folder,
  Users,
  Upload,
  AlertCircle,
  Download,
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  RefreshCw, 
  MessageSquare, 
  Eye, 
  FileDown,
  Mail,
  Variable
} from 'lucide-react';
import { EmailTemplate, TemplatePreviewData } from '@/types/emailTemplates';
import { EmailTemplateService } from '@/lib/services/emailTemplates';
import { EmailService, EmailHistoryRecord } from '@/lib/services/email';
import { SchedulingService, ScheduleEmailRequest, ScheduleMultipleEmailsRequest, ScheduledEmail, ScheduledEmailFilters } from '@/lib/services/scheduling';
import { usePaymentRequired } from '@/components/PaymentRequiredProvider';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import emailTemplatesData from '@/data/emailTemplates.json';

export default function EmailTemplatesPage() {
  const { showPaymentRequired } = usePaymentRequired();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendEmail, setSendEmail] = useState({
    recipient: '',
    subject: '',
    variables: {} as TemplatePreviewData
  });

  // Bulk email state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkEmail, setBulkEmail] = useState({
    template: null as EmailTemplate | null,
    requiredColumns: [] as string[],
    csvData: [] as Record<string, string>[],
    subject: ''
  });
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');

  // Scheduling state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState({
    recipient: '',
    subject: '',
    variables: {} as TemplatePreviewData,
    scheduled_at: ''
  });
  const [showScheduleBulkModal, setShowScheduleBulkModal] = useState(false);
  const [isBulkScheduling, setIsBulkScheduling] = useState(false);
  const [scheduleBulkEmail, setScheduleBulkEmail] = useState({
    template: null as EmailTemplate | null,
    requiredColumns: [] as string[],
    csvData: [] as Record<string, string>[],
    subject: '',
    scheduled_at: ''
  });

  // Email History states
  const [emails, setEmails] = useState<EmailHistoryRecord[]>([]);
  const [pagination, setPagination] = useState<{
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  } | null>(null);
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

  const [searchTermHistory, setSearchTermHistory] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Scheduled Email History states
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [scheduledPagination, setScheduledPagination] = useState<{
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  } | null>(null);
  const [isScheduledHistoryLoading, setIsScheduledHistoryLoading] = useState(false);
  const [scheduledHistoryError, setScheduledHistoryError] = useState<string | null>(null);

  // Scheduled Email History filter states
  const [scheduledCurrentPage, setScheduledCurrentPage] = useState(1);
  const [scheduledStatusFilter, setScheduledStatusFilter] = useState('all');
  const [scheduledDateFilter, setScheduledDateFilter] = useState('all');
  const [scheduledEmailFilter, setScheduledEmailFilter] = useState('');
  const [scheduledSenderNameFilter, setScheduledSenderNameFilter] = useState('');
  const [scheduledSubjectFilter, setScheduledSubjectFilter] = useState('');
  const [scheduledSearchTerm, setScheduledSearchTerm] = useState('');
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [scheduledEndDate, setScheduledEndDate] = useState('');

  // Export states
  const [isExporting, setIsExporting] = useState(false);

  // Template store search and filter states
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Use the imported template store from JSON
  const templateStore = emailTemplatesData;

  // Get unique categories from templates
  const categories = ['All', ...new Set(templateStore.map(template => template.category))];

  // Filter templates based on search and category
  const filteredStoreTemplates = templateStore.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(storeSearchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Extract variables from template
  const extractTemplateVariables = (template: EmailTemplate): string[] => {
    const variables = new Set<string>();
    
    // Extract from subject
    const subjectMatches = template.subject.match(/\{\{(\w+)\}\}/g);
    if (subjectMatches) {
      subjectMatches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '');
        variables.add(varName);
      });
    }
    
    // Extract from HTML
    const htmlMatches = template.html.match(/\{\{(\w+)\}\}/g);
    if (htmlMatches) {
      htmlMatches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '');
        variables.add(varName);
      });
    }
    
    return Array.from(variables);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const fetchedTemplates = await EmailTemplateService.getTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await EmailTemplateService.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error) {
    }
  };

  const duplicateTemplate = async (template: EmailTemplate) => {
    try {
      const newTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        description: template.description ? `${template.description} (Copy)` : 'Copy of existing template'
      };
      
      const created = await EmailTemplateService.createTemplate(newTemplate);
      setTemplates(prev => [...prev, created]);
    } catch (error) {
    }
  };

  const sendTemplateEmail = async () => {
    if (!selectedTemplate || !sendEmail.recipient) return;

    try {
      setIsSending(true);
      
      // Replace variables in template HTML and subject locally
      let renderedHtml = selectedTemplate.html;
      let renderedSubject = selectedTemplate.subject;
      
      Object.entries(sendEmail.variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'gi');
        renderedHtml = renderedHtml.replace(regex, value || '');
        renderedSubject = renderedSubject.replace(regex, value || '');
      });
      
      // Send email directly to email service with rendered HTML
      const response = await EmailService.sendEmail(
        sendEmail.recipient,
        sendEmail.subject || renderedSubject,
        renderedHtml
      );

      if (response.success) {
        showToast('success', 'Email Sent', 'Email sent successfully!');
        setSelectedTemplate(null);
        setSendEmail({ recipient: '', subject: '', variables: {} });
      } else {
        showToast('error', 'Send Failed', 'Failed to send email: ' + response.error);
      }
    } catch (error: unknown) {
      
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
      
      showToast('error', 'Send Failed', 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle CSV file upload for bulk email
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Validate required columns
        const missingColumns = bulkEmail.requiredColumns.filter(col => 
          !headers.includes(col)
        );
        
        if (missingColumns.length > 0) {
          setCsvError(`Missing required columns: ${missingColumns.join(', ')}`);
          setCsvSuccess('');
          return;
        }

        // Parse CSV data
        const data = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        setBulkEmail(prev => ({ ...prev, csvData: data }));
        setCsvSuccess(`Successfully loaded ${data.length} recipients`);
        setCsvError('');
      } catch {
        setCsvError('Failed to parse CSV file. Please check the format.');
        setCsvSuccess('');
      }
    };
    reader.readAsText(file);
  };

  // Send bulk emails
  const sendBulkEmails = async () => {
    if (!bulkEmail.template || bulkEmail.csvData.length === 0) return;

    try {
      setIsBulkSending(true);
      
      // Process each row and send email
      const emails = bulkEmail.csvData.map(row => {
        let renderedHtml = bulkEmail.template!.html;
        let renderedSubject = bulkEmail.subject;
        
        // Replace variables with row data
        Object.entries(row).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'gi');
          renderedHtml = renderedHtml.replace(regex, String(value) || '');
          renderedSubject = renderedSubject.replace(regex, String(value) || '');
        });

        return {
          to: row.email || row.Email || row.EMAIL,
          subject: renderedSubject,
          html: renderedHtml
        };
      });

      // Send bulk emails
      const response = await EmailService.sendBulkEmails(emails);

      if (response.success) {
        showToast('success', 'Bulk Emails Sent', `Successfully sent ${emails.length} emails!`);
        setShowBulkModal(false);
        setBulkEmail({ template: null, requiredColumns: [], csvData: [], subject: '' });
        setCsvError('');
        setCsvSuccess('');
      } else {
        showToast('error', 'Bulk Send Failed', 'Failed to send bulk emails: ' + response.error);
      }
    } catch (error: unknown) {
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to send bulk emails. Please reload your account.',
            '/billing'
          );
          return;
        }
      }
      
      showToast('error', 'Bulk Send Failed', 'Failed to send bulk emails. Please try again.');
    } finally {
      setIsBulkSending(false);
    }
  };

  // Scheduling functions
  const scheduleTemplateEmail = async () => {
    if (!selectedTemplate || !scheduleEmail.recipient || !scheduleEmail.scheduled_at) return;

    try {
      setIsScheduling(true);
      
      // Replace variables in template HTML and subject locally
      let renderedHtml = selectedTemplate.html;
      let renderedSubject = scheduleEmail.subject;
      
      Object.entries(scheduleEmail.variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'gi');
        renderedHtml = renderedHtml.replace(regex, value || '');
        renderedSubject = renderedSubject.replace(regex, value || '');
      });
      
      // Schedule email
      const request: ScheduleEmailRequest = {
        scheduled_email: {
          recipient: scheduleEmail.recipient,
          subject: renderedSubject,
          content: renderedHtml,
          scheduled_at: scheduleEmail.scheduled_at
        }
      };

      const response = await SchedulingService.scheduleEmail(request);

      if (response.success) {
        showToast('success', 'Email Scheduled', `Email scheduled successfully for ${new Date(scheduleEmail.scheduled_at).toLocaleString()}`);
        setSelectedTemplate(null);
        setScheduleEmail({ recipient: '', subject: '', variables: {}, scheduled_at: '' });
        setShowScheduleModal(false);
      } else {
        showToast('error', 'Schedule Failed', 'Failed to schedule email: ' + response.error);
      }
    } catch (error: unknown) {
      
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
      
      showToast('error', 'Schedule Failed', 'Failed to schedule email. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  const scheduleBulkEmails = async () => {
    if (!scheduleBulkEmail.template || scheduleBulkEmail.csvData.length === 0 || !scheduleBulkEmail.scheduled_at) return;

    try {
      setIsBulkScheduling(true);
      
      // Process each row and prepare emails array
      const emails = scheduleBulkEmail.csvData.map(row => {
        let renderedHtml = scheduleBulkEmail.template!.html;
        let renderedSubject = scheduleBulkEmail.subject || scheduleBulkEmail.template!.subject;
        
        // Replace variables with row data
        Object.entries(row).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'gi');
          renderedHtml = renderedHtml.replace(regex, String(value) || '');
          renderedSubject = renderedSubject.replace(regex, String(value) || '');
        });

        return {
          recipient: row.email || row.Email || row.EMAIL,
          subject: renderedSubject,
          content: renderedHtml,
          scheduled_at: scheduleBulkEmail.scheduled_at
        };
      });

      // Prepare to schedule emails

      // Schedule all emails in one request
      const request: ScheduleMultipleEmailsRequest = {
        emails: emails
      };

      // Process the request to schedule emails

      const response = await SchedulingService.scheduleMultipleEmails(request);
      
      if (response.success) {
        showToast('success', 'Bulk Emails Scheduled', `Successfully scheduled ${response.data.total_scheduled} emails for ${new Date(scheduleBulkEmail.scheduled_at).toLocaleString()}`);
      } else {
        showToast('error', 'Bulk Schedule Failed', 'Failed to schedule bulk emails: ' + response.error);
      }
      
      setShowScheduleBulkModal(false);
      setScheduleBulkEmail({ template: null, requiredColumns: [], csvData: [], subject: '', scheduled_at: '' });
      setCsvError('');
      setCsvSuccess('');
    } catch (error: unknown) {
      
      // Handle 402 Payment Required error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 402) {
          showPaymentRequired(
            axiosError.response?.data?.message || 'Insufficient credits to schedule bulk emails. Please reload your account.',
            '/usage'
          );
          return;
        }
      }
      
      showToast('error', 'Bulk Schedule Failed', 'Failed to schedule bulk emails. Please try again.');
    } finally {
      setIsBulkScheduling(false);
    }
  };

  // Scheduled Email History functions
  const fetchScheduledEmails = useCallback(async () => {
    try {
      setIsScheduledHistoryLoading(true);
      setScheduledHistoryError(null);

      const params: ScheduledEmailFilters = {
        page: scheduledCurrentPage,
        per_page: 10
      };

      if (scheduledStatusFilter !== 'all') {
        params.status = scheduledStatusFilter;
      }

      if (scheduledDateFilter !== 'all') {
        if (scheduledDateFilter === 'custom') {
          if (scheduledStartDate) {
            params.start_date = scheduledStartDate;
          }
          if (scheduledEndDate) {
            params.end_date = scheduledEndDate;
          }
        } else {
          params.date_filter = scheduledDateFilter;
        }
      }

      if (scheduledEmailFilter) {
        params.recipient = scheduledEmailFilter;
      }

      if (scheduledSenderNameFilter) {
        params.sender_name = scheduledSenderNameFilter;
      }

      if (scheduledSubjectFilter) {
        params.subject = scheduledSubjectFilter;
      }

      const data = await SchedulingService.getScheduledEmails(params);

      if (data.success) {
        setScheduledEmails(data.data.scheduled_emails);
        setScheduledPagination(data.data.pagination);
      } else {
        setScheduledHistoryError(data.error || 'Failed to fetch scheduled emails');
      }
    } catch (error: unknown) {
      
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
      
      setScheduledHistoryError('Failed to load scheduled emails. Please try again.');
    } finally {
      setIsScheduledHistoryLoading(false);
    }
  }, [
    scheduledCurrentPage, 
    scheduledStatusFilter, 
    scheduledDateFilter, 
    scheduledEmailFilter, 
    scheduledSenderNameFilter,
    scheduledSubjectFilter,
    scheduledStartDate, 
    scheduledEndDate,
    showPaymentRequired
  ]);

  const cancelScheduledEmail = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) return;

    try {
      const response = await SchedulingService.cancelScheduledEmail(id);

      if (response.success) {
        showToast('success', 'Email Cancelled', 'Scheduled email cancelled successfully');
        // Refresh the scheduled emails list
        fetchScheduledEmails();
      } else {
        showToast('error', 'Cancel Failed', 'Failed to cancel scheduled email: ' + response.error);
      }
    } catch (error: unknown) {
      showToast('error', 'Cancel Failed', 'Failed to cancel scheduled email. Please try again.');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatScheduledDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const navigateToTemplateBuilder = (template: { name: string; description?: string; subject: string; html: string }) => {
    // Navigate to builder with template data using Base64 encoding for safer transport
    try {
      const templateObject = {
        name: template.name,
        description: template.description,
        subject: template.subject,
        html: template.html
      };
      
      // Use Base64 encoding to avoid URI encoding issues
      const jsonString = JSON.stringify(templateObject);
      const base64Data = btoa(encodeURIComponent(jsonString));
      
      // Navigate to the builder with base64 encoded data
      window.location.href = `/email-templates/builder?templateBase64=${base64Data}`;
    } catch (error) {
      // Fallback: navigate without template data
      window.location.href = '/email-templates/builder';
    }
  };

  const renderTemplatePreview = (html: string, variables: string[]) => {
    let previewHTML = html;
    variables.forEach(varName => {
      const regex = new RegExp(`{{${varName}}}`, 'gi');
      previewHTML = previewHTML.replace(regex, `Sample ${varName}`);
    });
    return previewHTML;
  };

  // Email History helper functions
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
    fetchHistory();
  }, [
    currentPage, 
    statusFilter, 
    dateFilter, 
    emailFilter, 
    senderNameFilter,
    searchTermHistory, 
    minCost, 
    maxCost, 
    startDate, 
    endDate,
    fetchHistory
  ]);

  // useEffect for scheduled email history
  useEffect(() => {
    fetchScheduledEmails();
  }, [
    scheduledCurrentPage, 
    scheduledStatusFilter, 
    scheduledDateFilter, 
    scheduledEmailFilter, 
    scheduledSenderNameFilter,
    scheduledSubjectFilter,
    scheduledSearchTerm, 
    scheduledStartDate, 
    scheduledEndDate,
    fetchScheduledEmails
  ]);

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
      let filename = 'template_email_history';
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
      showToast('error', 'Export Failed', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchTermHistory('');
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Email Templates</h1>
            <p className="text-sm sm:text-base text-gray-400">Create and manage beautiful email templates</p>
          </div>
          <Link href="/email-templates/builder" className="w-full sm:w-auto">
            <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="my-templates" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="w-full min-w-max sm:grid sm:grid-cols-4 bg-slate-800/50">
              <TabsTrigger value="my-templates" className="data-[state=active]:bg-gradient-to-r from-teal-600 to-emerald-600 flex-shrink-0 px-2 sm:px-4">
                <Folder className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">My Templates</span>
                <span className="sm:hidden ml-1">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="template-store" className="data-[state=active]:bg-gradient-to-r from-teal-600 to-emerald-600 flex-shrink-0 px-2 sm:px-4">
                <Store className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Template Store</span>
                <span className="sm:hidden ml-1">Store</span>
              </TabsTrigger>
              <TabsTrigger value="email-history" className="data-[state=active]:bg-gradient-to-r from-teal-600 to-emerald-600 flex-shrink-0 px-2 sm:px-4">
                <MessageSquare className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Email History</span>
                <span className="sm:hidden ml-1">History</span>
              </TabsTrigger>
              <TabsTrigger value="scheduled-email-history" className="data-[state=active]:bg-gradient-to-r from-teal-600 to-emerald-600 flex-shrink-0 px-2 sm:px-4">
                <Clock className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Scheduled Email History</span>
                <span className="sm:hidden ml-1">Scheduled</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* My Templates Tab */}
          <TabsContent value="my-templates" className="space-y-6">
            {/* Search */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Templates Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-white text-lg font-medium mb-2">No templates found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchTerm ? 'No templates match your search.' : 'Get started by creating your first email template.'}
                  </p>
                  <Link href="/email-templates/builder">
                    <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {filteredTemplates.map((template) => (
              <Card key={template.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0">
                    <div className="flex-1">
                      <CardTitle className="text-white text-base sm:text-lg mb-1 sm:mb-2">{template.name}</CardTitle>
                      {template.description && (
                        <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">{template.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 sm:space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(template.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>{template.components.length} components</span>
                        </div>
                      </div>
                    </div>
                    {template.is_default && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300 text-xs self-start">
                        Default
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <div className="space-y-3">
                    {/* Actions */}
                    <div className="space-y-3">
                      {/* First row: Edit, Copy, Delete */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/email-templates/builder?id=${template.id}`} className="flex-1 sm:flex-none">
                          <Button variant="outline" size="sm" className="border-slate-600 text-gray-300 hover:bg-slate-700 w-full sm:w-auto">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateTemplate(template)}
                          className="border-slate-600 text-gray-300 hover:bg-slate-700 flex-1 sm:flex-none"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          <span className="sm:hidden">Delete</span>
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>

                      {/* Second row: Send buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const variables = extractTemplateVariables(template);
                            const initialVariables: TemplatePreviewData = {};
                            variables.forEach(varName => {
                              initialVariables[varName] = `Sample ${varName}`;
                            });
                            
                            setSendEmail({
                              recipient: '',
                              subject: template.subject,
                              variables: initialVariables
                            });
                            setSelectedTemplate(template);
                          }}
                          className="border-slate-600 text-gray-300 hover:bg-slate-700 flex-1 sm:flex-none"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Send Single</span>
                          <span className="sm:hidden">Send</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const variables = extractTemplateVariables(template);
                            setBulkEmail({
                              template: template,
                              requiredColumns: variables,
                              csvData: [],
                              subject: template.subject
                            });
                            setShowBulkModal(true);
                          }}
                          className="border-green-600 text-green-300 hover:bg-green-500/10 flex-1 sm:flex-none"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Send Bulk</span>
                          <span className="sm:hidden">Bulk</span>
                        </Button>
                      </div>

                      {/* Third row: Schedule buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const variables = extractTemplateVariables(template);
                            const initialVariables: TemplatePreviewData = {};
                            variables.forEach(varName => {
                              initialVariables[varName] = `Sample ${varName}`;
                            });
                            
                            setScheduleEmail({
                              recipient: '',
                              subject: template.subject,
                              variables: initialVariables,
                              scheduled_at: ''
                            });
                            setSelectedTemplate(template);
                            setShowScheduleModal(true);
                          }}
                          className="border-blue-600 text-blue-300 hover:bg-blue-500/10 flex-1 sm:flex-none"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Schedule Single</span>
                          <span className="sm:hidden">Schedule</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const variables = extractTemplateVariables(template);
                            setScheduleBulkEmail({
                              template: template,
                              requiredColumns: variables,
                              csvData: [],
                              subject: template.subject,
                              scheduled_at: ''
                            });
                            setShowScheduleBulkModal(true);
                          }}
                          className="border-purple-600 text-purple-300 hover:bg-purple-500/10 flex-1 sm:flex-none"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Schedule Bulk</span>
                          <span className="sm:hidden">Bulk</span>
                        </Button>
                      </div>
                    </div>

                    {/* HTML Preview */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <div 
                        className="p-4 text-black"
                        dangerouslySetInnerHTML={{ __html: renderTemplatePreview(template.html, extractTemplateVariables(template)) }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          {/* Template Store Tab */}
          <TabsContent value="template-store" className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col gap-4 items-start justify-between">
                <div className="w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search templates..."
                      value={storeSearchTerm}
                      onChange={(e) => setStoreSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 h-10 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span className="text-xs sm:text-sm text-gray-400">Category:</span>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white flex-1 h-10 sm:h-12 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {categories.map((category) => (
                        <SelectItem 
                          key={category} 
                          value={category}
                          className="text-white hover:bg-slate-700"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Results counter */}
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-400">
                  Showing {filteredStoreTemplates.length} of {templateStore.length} templates
                </span>
                
                {/* Category badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {categories.slice(1).map((category) => {
                    const count = templateStore.filter(t => t.category === category).length;
                    return (
                      <Badge 
                        key={category}
                        variant={selectedCategory === category ? "default" : "secondary"}
                        className={`text-xs cursor-pointer transition-colors ${
                          selectedCategory === category 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category} ({count})
                      </Badge>
                    );
                  })}
                </div>
              </div>
              
              {/* Clear filters */}
              {(storeSearchTerm || selectedCategory !== 'All') && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStoreSearchTerm('');
                      setSelectedCategory('All');
                    }}
                    className="text-gray-400 border-slate-600 hover:bg-slate-700 text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
                  >
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Templates Grid */}
            {filteredStoreTemplates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📧</div>
                <h3 className="text-xl text-white mb-2">No templates found</h3>
                <p className="text-gray-400 mb-4">
                  Try adjusting your search terms or category filter
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStoreSearchTerm('');
                    setSelectedCategory('All');
                  }}
                  className="text-gray-400 border-slate-600 hover:bg-slate-700"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredStoreTemplates.map((template) => (
                <Card key={template.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg sm:text-xl mb-1 sm:mb-2">{template.name}</CardTitle>
                        <p className="text-gray-400 text-sm sm:text-base mb-2 sm:mb-3">{template.description}</p>
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">
                            {template.category}
                          </Badge>
                          <span className="text-gray-500 text-xs sm:text-sm">
                            {template.variables.length} variables
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions - Moved to header */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToTemplateBuilder(template)}
                          className="border-slate-600 text-gray-300 hover:bg-slate-700 flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm"
                        >
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Use Template</span>
                          <span className="sm:hidden">Use</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Convert template store template to EmailTemplate format
                            const emailTemplate: EmailTemplate = {
                              id: template.id,
                              name: template.name,
                              description: template.description,
                              subject: template.subject,
                              html: template.html,
                              variables: template.variables.map(name => ({
                                id: `var_${name}`,
                                name,
                                description: `Variable: ${name}`,
                                defaultValue: '',
                                required: false
                              })),
                              components: [],
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString()
                            };
                            
                            setBulkEmail({
                              template: emailTemplate,
                              requiredColumns: template.variables,
                              csvData: [],
                              subject: template.subject
                            });
                            setShowBulkModal(true);
                          }}
                          className="border-green-600 text-green-300 hover:bg-green-500/10 flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm"
                        >
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Send Bulk</span>
                          <span className="sm:hidden">Send</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Left Column - Variables & Info */}
                      <div className="lg:col-span-1 space-y-3 sm:space-y-4">
                        <div>
                          <h4 className="text-white font-semibold text-sm sm:text-base mb-2 sm:mb-3 flex items-center">
                            <Variable className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-purple-400" />
                            Template Variables
                          </h4>
                          <div className="flex flex-wrap gap-1 sm:gap-1.5">
                            {template.variables.map((varName) => (
                              <Badge key={varName} variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300 text-xs">
                                {`{{${varName}}}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-white font-semibold text-sm sm:text-base mb-1 sm:mb-2 flex items-center">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-400" />
                            Subject Line
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm bg-slate-700/50 p-2 sm:p-3 rounded-lg font-mono overflow-x-auto whitespace-pre-wrap">
                            {template.subject}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-white font-semibold text-sm sm:text-base mb-1 sm:mb-2 flex items-center">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-400" />
                            Template Details
                          </h4>
                          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Category:</span>
                              <span className="text-gray-300">{template.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Variables:</span>
                              <span className="text-gray-300">{template.variables.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Template ID:</span>
                              <span className="text-gray-300 font-mono text-xs truncate max-w-[120px] sm:max-w-none">{template.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Large Preview */}
                      <div className="lg:col-span-2">
                        <h4 className="text-white font-semibold text-sm sm:text-base mb-2 sm:mb-3 flex items-center">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-yellow-400" />
                          Live Preview
                        </h4>
                        <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-slate-600">
                          <div 
                            className="p-3 sm:p-6 text-black w-full"
                            style={{ 
                              fontSize: '10px',
                              lineHeight: '1.3',
                              transform: 'scale(0.7)',
                              transformOrigin: 'top left',
                              width: '142%'
                            }}
                            dangerouslySetInnerHTML={{ __html: renderTemplatePreview(template.html, template.variables) }}
                          />
                        </div>
                        <p className="text-gray-400 text-xs mt-1 sm:mt-2 text-center">
                          Preview shows sample data. Customize variables when using the template.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>

          {/* Email History Tab */}
          <TabsContent value="email-history" className="space-y-6">
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
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center space-x-2 text-base sm:text-lg">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by email, subject, or content..."
                    value={searchTermHistory}
                    onChange={(e) => setSearchTermHistory(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm sm:text-base">Status</Label>
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
                    <span>Template Email History</span>
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
                    <p className="text-gray-400">Loading template email history...</p>
                  </div>
                ) : emails.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No template emails found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {emails
                      .filter((email: EmailHistoryRecord) =>
                        email.recipient.toLowerCase().includes(searchTermHistory.toLowerCase()) ||
                        email.message_id.toLowerCase().includes(searchTermHistory.toLowerCase()) ||
                        email.subject.toLowerCase().includes(searchTermHistory.toLowerCase()) ||
                        (email.content && email.content.toLowerCase().includes(searchTermHistory.toLowerCase()))
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
                                  showToast('info', 'Email Content', 'Email content preview functionality coming soon');
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

          {/* Scheduled Email History Tab */}
          <TabsContent value="scheduled-email-history" className="space-y-6">
            {/* Error/Success Messages */}
            {scheduledHistoryError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-400" />
                <span className="text-red-300">{scheduledHistoryError}</span>
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
                    value={scheduledSearchTerm}
                    onChange={(e) => setScheduledSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Status</Label>
                    <Select value={scheduledStatusFilter} onValueChange={setScheduledStatusFilter}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
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
                  <div className="space-y-2">
                    <Label className="text-gray-300">Date Range</Label>
                    <Select value={scheduledDateFilter} onValueChange={setScheduledDateFilter}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
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
                  <div className="space-y-2">
                    <Label className="text-gray-300">Email Address</Label>
                    <Input
                      placeholder="Filter by email..."
                      value={scheduledEmailFilter}
                      onChange={(e) => setScheduledEmailFilter(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  {/* Sender Name Filter */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Sender Name</Label>
                    <Input
                      placeholder="Filter by sender..."
                      value={scheduledSenderNameFilter}
                      onChange={(e) => setScheduledSenderNameFilter(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                {/* Custom Date Range */}
                {scheduledDateFilter === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Start Date</Label>
                      <Input
                        type="date"
                        value={scheduledStartDate}
                        onChange={(e) => setScheduledStartDate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">End Date</Label>
                      <Input
                        type="date"
                        value={scheduledEndDate}
                        onChange={(e) => setScheduledEndDate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Subject Filter */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Subject</Label>
                  <Input
                    placeholder="Filter by subject..."
                    value={scheduledSubjectFilter}
                    onChange={(e) => setScheduledSubjectFilter(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Reset Filters */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setScheduledStatusFilter('all');
                      setScheduledDateFilter('all');
                      setScheduledEmailFilter('');
                      setScheduledSenderNameFilter('');
                      setScheduledSubjectFilter('');
                      setScheduledSearchTerm('');
                      setScheduledStartDate('');
                      setScheduledEndDate('');
                      setScheduledCurrentPage(1);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filters
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
                      {scheduledPagination?.total_count || 0} total
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
                {isScheduledHistoryLoading ? (
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
                        email.recipient.toLowerCase().includes(scheduledSearchTerm.toLowerCase()) ||
                        email.id.toLowerCase().includes(scheduledSearchTerm.toLowerCase()) ||
                        email.subject.toLowerCase().includes(scheduledSearchTerm.toLowerCase()) ||
                        (email.content && email.content.toLowerCase().includes(scheduledSearchTerm.toLowerCase()))
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
                                  Scheduled: {formatScheduledDate(email.scheduled_at)}
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
                                  showToast('info', 'Email Content', 'Email content preview functionality coming soon');
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
            {scheduledPagination && scheduledPagination.total_pages > 1 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Showing page {scheduledPagination.current_page} of {scheduledPagination.total_pages} 
                      ({scheduledPagination.total_count} total emails)
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setScheduledCurrentPage(Math.max(1, scheduledCurrentPage - 1))}
                        disabled={scheduledCurrentPage === 1}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-300 px-3">
                        {scheduledCurrentPage} / {scheduledPagination.total_pages}
                      </span>
                      <Button
                        onClick={() => setScheduledCurrentPage(Math.min(scheduledPagination.total_pages, scheduledCurrentPage + 1))}
                        disabled={scheduledCurrentPage === scheduledPagination.total_pages}
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

        {/* Send Template Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white">Send Template Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm">Recipient Email</label>
                  <Input
                    type="email"
                    value={sendEmail.recipient}
                    onChange={(e) => setSendEmail(prev => ({ ...prev, recipient: e.target.value }))}
                    placeholder="recipient@example.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Subject Line</label>
                  <Input
                    value={sendEmail.subject}
                    onChange={(e) => setSendEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={selectedTemplate.subject}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Variables */}
                {Object.keys(sendEmail.variables).length > 0 && (
                  <div>
                    <label className="text-gray-300 text-sm">Template Variables</label>
                    <div className="space-y-2 mt-2">
                      {Object.entries(sendEmail.variables).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs text-gray-400">{`{{${key}}}`}</label>
                          <Input
                            value={value}
                            onChange={(e) => setSendEmail(prev => ({
                              ...prev,
                              variables: { ...prev.variables, [key]: e.target.value }
                            }))}
                            placeholder={`Enter value for ${key}`}
                            className="bg-slate-700 border-slate-600 text-white text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={sendTemplateEmail}
                    disabled={isSending || !sendEmail.recipient}
                    className="bg-purple-600 hover:bg-purple-700 flex-1"
                  >
                    {isSending ? 'Sending...' : 'Send Email'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTemplate(null)}
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk Email Modal */}
        {showBulkModal && bulkEmail.template && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white">Send Bulk Email with Template</CardTitle>
                <p className="text-gray-400 text-sm">Upload a CSV file with recipient data to send personalized emails</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Info */}
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Template: {bulkEmail.template.name}</h3>
                  <p className="text-gray-300 text-sm mb-3">{bulkEmail.template.description}</p>
                  
                  <div>
                    <label className="text-gray-300 text-sm">Required CSV Columns:</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {bulkEmail.requiredColumns.map((col) => (
                        <Badge key={col} variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                          {col}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300">
                        email
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const headers = [...bulkEmail.requiredColumns, 'email'];
                          const csvContent = headers.join(',') + '\n' + 
                            headers.map(h => `Sample ${h}`).join(',') + '\n' +
                            headers.map(h => `Another ${h}`).join(',');
                          
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'template_example.csv';
                          a.click();
                          window.URL.revokeObjectURL(url);
                        }}
                        className="border-blue-600 text-blue-300 hover:bg-blue-500/10 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Example CSV
                      </Button>
                    </div>
                  </div>
                </div>

                {/* CSV Upload */}
                <div>
                  <label className="text-gray-300 text-sm">Upload CSV File</label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                    />
                  </div>
                  
                  {csvError && (
                    <div className="mt-2 flex items-center text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {csvError}
                    </div>
                  )}
                  
                  {csvSuccess && (
                    <div className="mt-2 flex items-center text-green-400 text-sm">
                      <Upload className="h-4 w-4 mr-2" />
                      {csvSuccess}
                    </div>
                  )}
                </div>

                {/* CSV Preview */}
                {bulkEmail.csvData.length > 0 && (
                  <div>
                    <label className="text-gray-300 text-sm">Preview (First 3 rows):</label>
                    <div className="mt-2 bg-slate-700/50 p-4 rounded-lg overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-300 border-b border-slate-600">
                            {Object.keys(bulkEmail.csvData[0]).map((header) => (
                              <th key={header} className="text-left p-2">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bulkEmail.csvData.slice(0, 3).map((row, index) => (
                            <tr key={index} className="text-gray-400 border-b border-slate-600">
                              {Object.values(row).map((value, i) => (
                                <td key={i} className="p-2">{String(value)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Subject Line */}
                <div>
                  <label className="text-gray-300 text-sm">Subject Line</label>
                  <Input
                    value={bulkEmail.subject}
                    onChange={(e) => setBulkEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject line"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={sendBulkEmails}
                    disabled={isBulkSending || bulkEmail.csvData.length === 0}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    {isBulkSending ? 'Sending...' : `Send ${bulkEmail.csvData.length} Emails`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkEmail({ template: null, requiredColumns: [], csvData: [], subject: '' });
                      setCsvError('');
                      setCsvSuccess('');
                    }}
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Schedule Single Email Modal */}
        {showScheduleModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white">Schedule Template Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm">Recipient Email</label>
                  <Input
                    type="email"
                    value={scheduleEmail.recipient}
                    onChange={(e) => setScheduleEmail(prev => ({ ...prev, recipient: e.target.value }))}
                    placeholder="recipient@example.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Schedule Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={scheduleEmail.scheduled_at}
                    onChange={(e) => setScheduleEmail(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="text-gray-300 text-sm">Subject Line</label>
                  <Input
                    value={scheduleEmail.subject}
                    onChange={(e) => setScheduleEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={selectedTemplate.subject}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Variables */}
                {Object.keys(scheduleEmail.variables).length > 0 && (
                  <div>
                    <label className="text-gray-300 text-sm">Template Variables</label>
                    <div className="space-y-2 mt-2">
                      {Object.entries(scheduleEmail.variables).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs text-gray-400">{`{{${key}}}`}</label>
                          <Input
                            value={value}
                            onChange={(e) => setScheduleEmail(prev => ({
                              ...prev,
                              variables: { ...prev.variables, [key]: e.target.value }
                            }))}
                            placeholder={`Enter value for ${key}`}
                            className="bg-slate-700 border-slate-600 text-white text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={scheduleTemplateEmail}
                    disabled={isScheduling || !scheduleEmail.recipient || !scheduleEmail.scheduled_at}
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                  >
                    {isScheduling ? 'Scheduling...' : 'Schedule Email'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowScheduleModal(false);
                      setScheduleEmail({ recipient: '', subject: '', variables: {}, scheduled_at: '' });
                    }}
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Schedule Bulk Email Modal */}
        {showScheduleBulkModal && scheduleBulkEmail.template && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white">Schedule Bulk Email with Template</CardTitle>
                <p className="text-gray-400 text-sm">Upload a CSV file with recipient data to schedule personalized emails</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Schedule Date & Time */}
                <div>
                  <label className="text-gray-300 text-sm">Schedule Date & Time *</label>
                  <Input
                    type="datetime-local"
                    value={scheduleBulkEmail.scheduled_at}
                    onChange={(e) => setScheduleBulkEmail(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Template Info */}
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Template: {scheduleBulkEmail.template.name}</h3>
                  <p className="text-gray-300 text-sm mb-3">{scheduleBulkEmail.template.description}</p>
                  
                  <div>
                    <label className="text-gray-300 text-sm">Required CSV Columns:</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {scheduleBulkEmail.requiredColumns.map((col) => (
                        <Badge key={col} variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                          {col}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300">
                        email
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const headers = [...scheduleBulkEmail.requiredColumns, 'email'];
                          const csvContent = headers.join(',') + '\n' + 
                            headers.map(h => `Sample ${h}`).join(',') + '\n' +
                            headers.map(h => `Another ${h}`).join(',');
                          
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'template_example.csv';
                          a.click();
                          window.URL.revokeObjectURL(url);
                        }}
                        className="border-blue-600 text-blue-300 hover:bg-blue-500/10 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Example CSV
                      </Button>
                    </div>
                  </div>
                </div>

                {/* CSV Upload */}
                <div>
                  <label className="text-gray-300 text-sm">Upload CSV File</label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = (e) => {
                          try {
                            const csvText = e.target?.result as string;
                            const lines = csvText.split('\n');
                            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                            
                            // Validate required columns
                            const missingColumns = scheduleBulkEmail.requiredColumns.filter(col => 
                              !headers.includes(col)
                            );
                            
                            if (missingColumns.length > 0) {
                              setCsvError(`Missing required columns: ${missingColumns.join(', ')}`);
                              setCsvSuccess('');
                              return;
                            }

                            // Parse CSV data
                            const data = lines.slice(1).filter(line => line.trim()).map(line => {
                              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                              const row: Record<string, string> = {};
                              headers.forEach((header, index) => {
                                row[header] = values[index] || '';
                              });
                              return row;
                            });

                            setScheduleBulkEmail(prev => ({ ...prev, csvData: data }));
                            setCsvSuccess(`Successfully loaded ${data.length} recipients`);
                            setCsvError('');
                          } catch {
                            setCsvError('Failed to parse CSV file. Please check the format.');
                            setCsvSuccess('');
                          }
                        };
                        reader.readAsText(file);
                      }}
                      className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                    />
                  </div>
                  
                  {csvError && (
                    <div className="mt-2 flex items-center text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {csvError}
                    </div>
                  )}
                  
                  {csvSuccess && (
                    <div className="mt-2 flex items-center text-green-400 text-sm">
                      <Upload className="h-4 w-4 mr-2" />
                      {csvSuccess}
                    </div>
                  )}
                </div>

                {/* CSV Preview */}
                {scheduleBulkEmail.csvData.length > 0 && (
                  <div>
                    <label className="text-gray-300 text-sm">Preview (First 3 rows):</label>
                    <div className="mt-2 bg-slate-700/50 p-4 rounded-lg overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-300 border-b border-slate-600">
                            {Object.keys(scheduleBulkEmail.csvData[0]).map((header) => (
                              <th key={header} className="text-left p-2">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {scheduleBulkEmail.csvData.slice(0, 3).map((row, index) => (
                            <tr key={index} className="text-gray-400 border-b border-slate-600">
                              {Object.values(row).map((value, i) => (
                                <td key={i} className="p-2">{String(value)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Subject Line */}
                <div>
                  <label className="text-gray-300 text-sm">Subject Line</label>
                  <Input
                    value={scheduleBulkEmail.subject}
                    onChange={(e) => setScheduleBulkEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject line"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={scheduleBulkEmails}
                    disabled={isBulkScheduling || scheduleBulkEmail.csvData.length === 0 || !scheduleBulkEmail.scheduled_at}
                    className="bg-purple-600 hover:bg-purple-700 flex-1"
                  >
                    {isBulkScheduling ? 'Scheduling...' : `Schedule ${scheduleBulkEmail.csvData.length} Emails`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowScheduleBulkModal(false);
                      setScheduleBulkEmail({ template: null, requiredColumns: [], csvData: [], subject: '', scheduled_at: '' });
                      setCsvError('');
                      setCsvSuccess('');
                    }}
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
