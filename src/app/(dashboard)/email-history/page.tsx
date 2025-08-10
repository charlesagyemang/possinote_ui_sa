'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Search, 
  Mail, 
  RefreshCw, 
  MessageSquare, 
  Eye, 
  FileDown 
} from 'lucide-react';
import { EmailService, EmailHistoryRecord } from '@/lib/services/email';

interface Pagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export default function EmailHistoryPage() {
  const [emails, setEmails] = useState<EmailHistoryRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const fetchEmailHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
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
        console.log('🔍 Status filter applied:', statusFilter);
      } else {
        console.log('🔍 No status filter applied (statusFilter:', statusFilter, ')');
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

      // Debug status filter specifically
      console.log('🔍 STATUS FILTER DEBUG:');
      console.log('- statusFilter value:', statusFilter);
      console.log('- statusFilter !== "all":', statusFilter !== 'all');
      console.log('- params.status:', params.status);
      console.log('🔍 END STATUS DEBUG');

      console.log('=== EMAIL History Filter Debug ===');
      console.log('Current filter values:');
      console.log('- statusFilter:', statusFilter, '(will be included:', statusFilter !== 'all', ')');
      console.log('- dateFilter:', dateFilter);
      console.log('- emailFilter:', emailFilter);
      console.log('- senderNameFilter:', senderNameFilter);
      console.log('- minCost:', minCost);
      console.log('- maxCost:', maxCost);
      console.log('- startDate:', startDate);
      console.log('- endDate:', endDate);
      console.log('Final params:', params);
      console.log('=== END DEBUG ===');

      const data = await EmailService.getEmailHistory(params);
      console.log('🔍 Email History API Response:', data);

      if (data.success) {
        setEmails(data.emails || []);
        setPagination(data.pagination || null);
        console.log('🔍 Emails set:', data.emails?.length || 0);
        console.log('🔍 Pagination set:', data.pagination);
      } else {
        setError(data.error || 'Failed to fetch email history');
        console.error('🔍 API returned error:', data.error);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch email history:', error);
      
      // Handle rate limiting
      if (error instanceof Error && error.message.includes('429')) {
        setError('Too many requests. Please wait a moment and try again.');
        setIsRateLimited(true);
        console.log('Rate limited - waiting before retry...');
        
        // Auto-clear rate limit after 30 seconds with countdown
        let countdown = 30;
        setRateLimitCountdown(countdown);
        
        const countdownInterval = setInterval(() => {
          countdown--;
          setRateLimitCountdown(countdown);
          
          if (countdown <= 0) {
            clearInterval(countdownInterval);
            setIsRateLimited(false);
            setError(null);
            setRateLimitCountdown(0);
          }
        }, 1000);
      } else {
        setError('Failed to load email history. Please try again.');
        setIsRateLimited(false);
      }
    } finally {
      setIsLoading(false);
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
    console.log('🔍 useEffect triggered with statusFilter:', statusFilter);
    // Immediate fetch for all filters (no delay)
    fetchEmailHistory();
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
    fetchEmailHistory
  ]);

  const filteredEmails = emails.filter((email: EmailHistoryRecord) =>
    email.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.message_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (email.content && email.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      const headers = ['Message ID', 'Recipient', 'Subject', 'Status', 'Cost (₵)', 'Date', 'API Key', 'Sender Name'];
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400">Loading email history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Email History</h1>
            <p className="text-gray-400">View and manage your email sending history</p>
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
                <Label className="text-gray-300">Min Cost (₵)</Label>
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
                <Label className="text-gray-300">Max Cost (₵)</Label>
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
                  onClick={() => fetchEmailHistory()}
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
            {filteredEmails.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No emails found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEmails.map((email) => (
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
                            ₵{parseFloat(String(email.cost)).toFixed(3)}
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
      </div>
    </div>
  );
}
