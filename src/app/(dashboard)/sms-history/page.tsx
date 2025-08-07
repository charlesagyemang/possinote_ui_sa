'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, AlertCircle, Clock, ChevronLeft, ChevronRight, Filter, Search, Calendar, Phone, DollarSign, Key, User, RefreshCw, MessageSquare, Eye, FileDown } from 'lucide-react';

interface SmsMessage {
  message_id: string;
  to: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  created_at: string;
  cost: string;
  message?: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export default function SmsHistoryPage() {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [apiKeyFilter, setApiKeyFilter] = useState('all');
  const [senderIdFilter, setSenderIdFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Export states
  const [isExporting, setIsExporting] = useState(false);

  const fetchSmsHistory = async () => {
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

      if (apiKeyFilter !== 'all') {
        params.api_key_id = apiKeyFilter;
      }

      if (minCost) {
        params.min_cost = parseFloat(minCost);
      }

      if (maxCost) {
        params.max_cost = parseFloat(maxCost);
      }

      if (senderIdFilter) {
        params.sender_id = senderIdFilter;
      }

      if (phoneFilter) {
        params.phone = phoneFilter;
      }

      // Debug status filter specifically
      console.log('🔍 STATUS FILTER DEBUG:');
      console.log('- statusFilter value:', statusFilter);
      console.log('- statusFilter !== "all":', statusFilter !== 'all');
      console.log('- params.status:', params.status);
      console.log('🔍 END STATUS DEBUG');

      console.log('=== SMS History Filter Debug ===');
      console.log('Current filter values:');
      console.log('- statusFilter:', statusFilter, '(will be included:', statusFilter !== 'all', ')');
      console.log('- dateFilter:', dateFilter);
      console.log('- apiKeyFilter:', apiKeyFilter);
      console.log('- senderIdFilter:', senderIdFilter);
      console.log('- phoneFilter:', phoneFilter);
      console.log('- minCost:', minCost);
      console.log('- maxCost:', maxCost);
      console.log('- startDate:', startDate);
      console.log('- endDate:', endDate);
      console.log('Final params:', params);
      console.log('=== END DEBUG ===');

      const response = await fetch('/api/sms-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 SMS History API Response:', data);

      if (data.success) {
        setMessages(data.data.messages || []);
        setPagination(data.data.pagination || null);
        console.log('🔍 Messages set:', data.data.messages?.length || 0);
        console.log('🔍 Pagination set:', data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch SMS history');
        console.error('🔍 API returned error:', data.message);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch SMS history:', error);
      
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
        setError('Failed to load SMS history. Please try again.');
        setIsRateLimited(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Single useEffect for all filter changes
  useEffect(() => {
    console.log('🔍 useEffect triggered with statusFilter:', statusFilter);
    // Immediate fetch for all filters (no delay)
    fetchSmsHistory();
  }, [
    currentPage, 
    statusFilter, 
    dateFilter, 
    apiKeyFilter, 
    senderIdFilter, 
    phoneFilter,
    searchTerm, 
    minCost, 
    maxCost, 
    startDate, 
    endDate
  ]);

  const filteredMessages = messages.filter((message: SmsMessage) =>
    message.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.message_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.message && message.message.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const formatPhone = (phone: string) => {
    // Show only last 4 digits for privacy
    return phone.replace(/\d(?=\d{4})/g, '*');
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

      if (apiKeyFilter !== 'all') {
        params.api_key_id = apiKeyFilter;
      }

      if (minCost) {
        params.min_cost = parseFloat(minCost);
      }

      if (maxCost) {
        params.max_cost = parseFloat(maxCost);
      }

      if (senderIdFilter) {
        params.sender_id = senderIdFilter;
      }

      if (phoneFilter) {
        params.phone = phoneFilter;
      }

      const response = await fetch('/api/sms-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const allMessages = data.data.messages || [];
      
      // Create CSV content
      const headers = ['Message ID', 'Phone Number', 'Status', 'Cost (₵)', 'Date', 'Message'];
      const csvContent = [
        headers.join(','),
        ...allMessages.map((message: SmsMessage) => [
          message.message_id,
          message.to,
          message.status,
          message.cost,
          new Date(message.created_at).toLocaleString(),
          message.message ? `"${message.message.replace(/"/g, '""')}"` : ''
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename based on filters
      let filename = 'sms_history';
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
    setApiKeyFilter('all');
    setMinCost('');
    setMaxCost('');
    setSenderIdFilter('');
    setPhoneFilter('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setCurrentPage(1);
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400">Loading SMS history...</p>
        </div>
      </div>
    );
  }

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
              SMS History
            </h1>
          </div>
          <p className="text-gray-400 text-lg">View all your sent SMS messages and their status</p>
        </div>

        {/* Stats */}
        {pagination && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Messages</p>
                    <p className="text-2xl font-bold text-white">{pagination.total_count.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Current Page</p>
                    <p className="text-2xl font-bold text-white">{pagination.current_page}</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Clock className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Pages</p>
                    <p className="text-2xl font-bold text-white">{pagination.total_pages}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <Eye className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Per Page</p>
                    <p className="text-2xl font-bold text-white">{pagination.per_page}</p>
                  </div>
                  <div className="p-3 bg-amber-500/20 rounded-xl">
                    <DollarSign className="h-6 w-6 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
            <CardTitle className="text-white text-xl flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Filter className="h-5 w-5 text-blue-400" />
              </div>
              <span>Filters & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Search and Status Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    placeholder="Search by phone, message ID, or message content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 pl-10 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div className="relative">
                  <Select value={statusFilter} onValueChange={(value) => {
                    console.log('🔍 Status filter changed to:', value);
                    setStatusFilter(value);
                  }}>
                    <SelectTrigger className={`bg-black/30 border-white/20 text-white rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20 ${
                      statusFilter && statusFilter !== 'all' ? 'border-blue-500/50 bg-blue-500/10' : ''
                    }`}>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    {statusFilter && statusFilter !== 'all' && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">✓</span>
                      </div>
                    )}
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Status</SelectItem>
                      {/* availableFilters?.status?.map((status: string) => ( */}
                        <SelectItem key="sent" value="sent">Sent</SelectItem>
                        <SelectItem key="delivered" value="delivered">Delivered</SelectItem>
                        <SelectItem key="failed" value="failed">Failed</SelectItem>
                        <SelectItem key="pending" value="pending">Pending</SelectItem>
                        <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
                      {/* )) || ( */}
                        {/* <>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </> */}
                      {/* ) */}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={apiKeyFilter} onValueChange={setApiKeyFilter}>
                  <SelectTrigger className="bg-black/30 border-white/20 text-white rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder="Filter by API Key" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All API Keys</SelectItem>
                    {/* availableFilters?.api_keys?.map((key: any) => ( */}
                      <SelectItem key="key1" value="key1">API Key 1</SelectItem>
                      <SelectItem key="key2" value="key2">API Key 2</SelectItem>
                      <SelectItem key="key3" value="key3">API Key 3</SelectItem>
                    {/* )) */}
                  </SelectContent>
                </Select>

                <Button
                  onClick={fetchSmsHistory}
                  disabled={isRateLimited}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isRateLimited ? 'Rate Limited' : 'Refresh'}
                </Button>
              </div>

              {/* Date and Cost Filters */}
              <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm font-medium">Date Filter</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="bg-black/30 border-white/20 text-white rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {/* availableFilters?.date_filter?.map((filter: string) => ( */}
                        <SelectItem key="today" value="today">Today</SelectItem>
                        <SelectItem key="yesterday" value="yesterday">Yesterday</SelectItem>
                        <SelectItem key="this_week" value="this_week">This Week</SelectItem>
                        <SelectItem key="this_month" value="this_month">This Month</SelectItem>
                        <SelectItem key="last_month" value="last_month">Last Month</SelectItem>
                        <SelectItem key="custom" value="custom">Custom Range</SelectItem>
                      {/* )) || ( */}
                        {/* <>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="yesterday">Yesterday</SelectItem>
                          <SelectItem value="this_week">This Week</SelectItem>
                          <SelectItem value="this_month">This Month</SelectItem>
                          <SelectItem value="last_month">Last Month</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </> */}
                      {/* ) */}
                    </SelectContent>
                  </Select>
                </div>

                {dateFilter === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm font-medium">Start Date</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-black/30 border-white/20 text-white rounded-xl h-12 pl-10 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm font-medium">End Date</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-black/30 border-white/20 text-white rounded-xl h-12 pl-10 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm font-medium">Min Cost (₵)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.00"
                    value={minCost}
                    onChange={(e) => setMinCost(e.target.value)}
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm font-medium">Max Cost (₵)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.00"
                    value={maxCost}
                    onChange={(e) => setMaxCost(e.target.value)}
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm font-medium">Sender ID</Label>
                  <Input
                    placeholder="e.g., Possitech"
                    value={senderIdFilter}
                    onChange={(e) => setSenderIdFilter(e.target.value)}
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm font-medium">Phone Number</Label>
                  <Input
                    placeholder="e.g., +233244"
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    className="bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-end space-x-2">
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 rounded-xl h-12 font-medium flex-1"
                  >
                    Reset
                  </Button>

                  <Button
                    onClick={exportToCSV}
                    disabled={isExporting}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl h-12 font-medium flex-1"
                  >
                    {isExporting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Exporting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <FileDown className="h-4 w-4" />
                        <span>Export</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>


            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10">
            <CardTitle className="text-white text-2xl flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <MessageSquare className="h-6 w-6 text-green-400" />
              </div>
              <span>SMS Messages</span>
            </CardTitle>
            
            {/* Active Filters Display */}
            {(statusFilter && statusFilter !== 'all') || 
             (dateFilter && dateFilter !== 'custom') || 
             (apiKeyFilter && apiKeyFilter !== 'all') || 
             senderIdFilter || 
             phoneFilter || 
             minCost || 
             maxCost ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-gray-400 text-sm">Active filters:</span>
                {statusFilter && statusFilter !== 'all' && (
                  <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-300">
                    Status: {statusFilter}
                  </Badge>
                )}
                {dateFilter && dateFilter !== 'custom' && (
                  <Badge className="bg-green-500/20 border-green-500/30 text-green-300">
                    Date: {dateFilter.replace('_', ' ')}
                  </Badge>
                )}
                {apiKeyFilter && apiKeyFilter !== 'all' && (
                  <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                    API Key: {apiKeyFilter}
                  </Badge>
                )}
                {senderIdFilter && (
                  <Badge className="bg-orange-500/20 border-orange-500/30 text-orange-300">
                    Sender: {senderIdFilter}
                  </Badge>
                )}
                {phoneFilter && (
                  <Badge className="bg-red-500/20 border-red-500/30 text-red-300">
                    Phone: {phoneFilter}
                  </Badge>
                )}
                {(minCost || maxCost) && (
                  <Badge className="bg-yellow-500/20 border-yellow-500/30 text-yellow-300">
                    Cost: {minCost || '0'} - {maxCost || '∞'}
                  </Badge>
                )}
              </div>
            ) : null}
            

          </CardHeader>
          <CardContent className="p-8">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="flex-1">
                    <p className="text-red-400 font-medium">{error}</p>
                    <p className="text-red-300 text-sm mt-1">
                      {error.includes('Too many requests') 
                        ? `The API is rate limited. Please wait ${rateLimitCountdown} seconds before trying again.`
                        : 'Please check your connection and try again.'
                      }
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setError(null);
                      setIsRateLimited(false);
                      fetchSmsHistory();
                    }}
                    disabled={isRateLimited}
                    variant="outline"
                    size="sm"
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {isRateLimited ? 'Wait...' : 'Retry'}
                  </Button>
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400">Loading SMS messages...</p>
                </div>
              </div>
            ) : filteredMessages.length > 0 ? (
              <div className="space-y-4">
                {filteredMessages.map((message, index) => (
                  <div key={index} className="border border-white/10 rounded-2xl p-6 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm hover:from-white/10 hover:to-white/15 transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-white font-medium">{formatPhone(message.to)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-400">{formatDate(message.created_at)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 text-sm">Message ID:</span>
                          <span className="text-white font-mono text-sm">{message.message_id}</span>
                        </div>
                        {message.message && (
                          <p className="text-gray-300 text-sm truncate max-w-xs">
                            {message.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(message.status)}`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(message.status)}
                            <span className="capitalize">{message.status}</span>
                          </div>
                        </Badge>
                      </div>

                      <div className="flex items-center justify-end space-x-2">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-amber-400" />
                          <span className="text-white font-medium">₵{message.cost}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-gray-500/20 rounded-2xl w-fit mx-auto">
                    <MessageSquare className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-400">No SMS messages found</p>
                  <p className="text-sm text-gray-500">Try adjusting your filters or search terms</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-gray-400">
                  Showing page {pagination.current_page} of {pagination.total_pages}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 rounded-xl"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const page = Math.max(1, Math.min(pagination.total_pages - 4, pagination.current_page - 2)) + i;
                      return (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          variant={page === currentPage ? "default" : "outline"}
                          className={`rounded-xl ${
                            page === currentPage 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                              : 'border-white/20 text-white hover:bg-white/10'
                          }`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
                    disabled={currentPage === pagination.total_pages}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 rounded-xl"
                  >
                    Next
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