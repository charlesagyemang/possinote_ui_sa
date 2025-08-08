'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Clock, ChevronLeft, ChevronRight, Filter, Search, Phone, DollarSign, RefreshCw, MessageSquare, FileDown } from 'lucide-react';
import { SmsService, SmsMessage, Pagination } from '@/lib/services/sms';

export default function SmsHistoryPage() {
  // Data states
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Prevent duplicate API calls
  const lastCallTime = useRef<number>(0);

  // Fetch SMS history
  const fetchSmsHistory = async () => {
    // Prevent duplicate calls within 100ms
    const now = Date.now();
    if (now - lastCallTime.current < 100) {
      return;
    }
    lastCallTime.current = now;

    try {
      setIsLoading(true);
      setError(null);

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
        setError(data.message || 'Failed to fetch SMS history');
      }
    } catch (error: unknown) {
      console.error('Failed to fetch SMS history:', error);
      setError('Failed to load SMS history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Single useEffect for API calls
  useEffect(() => {
    fetchSmsHistory();
  }, [
    currentPage,
    statusFilter,
    dateFilter,
    apiKeyFilter,
    senderIdFilter,
    phoneFilter,
    minCost,
    maxCost,
    startDate,
    endDate
  ]);

  // Client-side search filtering
  const filteredMessages = messages.filter((message: SmsMessage) =>
    message.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.message_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.message && message.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper functions
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
    return phone.replace(/\d(?=\d{4})/g, '*');
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      
      const params: Record<string, string | number> = {
        per_page: 1000
      };

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

      const data = await SmsService.getSmsHistory(params);

      if (data.success && data.data?.messages) {
        const csvContent = [
          ['Message ID', 'To', 'Status', 'Cost', 'Created At', 'Message'],
          ...data.data.messages.map((message: SmsMessage) => [
            message.message_id,
            message.to,
            message.status,
            message.cost,
            message.created_at,
            message.message?.substring(0, 100) || ''
          ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sms-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error: unknown) {
      console.error('Export failed:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setCurrentPage(1);
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
              SMS History
            </h1>
          </div>
          <p className="text-gray-400 text-lg">View and manage your SMS message history</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={resetFilters}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl px-6 py-3 font-medium shadow-lg shadow-indigo-500/25"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
          <Button
            onClick={exportToCSV}
            disabled={isExporting}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl px-6 py-3 font-medium shadow-lg shadow-green-500/25"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>

      {/* Filters */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-white/10">
          <CardTitle className="text-white text-xl flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Filter className="h-5 w-5 text-indigo-400" />
            </div>
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="date">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
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

            {/* API Key Filter */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Select value={apiKeyFilter} onValueChange={setApiKeyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select API key" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All API Keys</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cost Range */}
            <div className="space-y-2">
              <Label htmlFor="cost">Cost Range</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Min"
                  value={minCost}
                  onChange={(e) => setMinCost(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Max"
                  value={maxCost}
                  onChange={(e) => setMaxCost(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderId">Sender ID</Label>
              <Input
                placeholder="Enter sender ID"
                value={senderIdFilter}
                onChange={(e) => setSenderIdFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                placeholder="Enter phone number"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Messages</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by phone, message ID, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
          <CardTitle className="text-white text-xl flex items-center justify-between">
            <span className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
              <span>SMS Messages</span>
            </span>
            {pagination && (
              <span className="text-sm text-gray-400">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total_count)} of{' '}
                {pagination.total_count} messages
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Loading messages...</div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">No messages found</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message: SmsMessage) => (
                <div
                  key={message.message_id}
                  className="p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(message.status)}>
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(message.status)}
                            <span>{message.status}</span>
                          </span>
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="font-mono">{formatPhone(message.to)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">ID:</span>
                          <span className="font-mono text-sm">{message.message_id}</span>
                        </div>
                        {message.cost && (
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">${message.cost}</span>
                          </div>
                        )}
                      </div>

                      {message.message && (
                        <div className="mt-3 p-3 bg-gray-800/50 rounded border border-gray-700">
                          <p className="text-sm text-gray-300">{message.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-400">
                Page {pagination.current_page} of {pagination.total_pages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= pagination.total_pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
