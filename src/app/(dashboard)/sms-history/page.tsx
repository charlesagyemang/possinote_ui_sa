'use client';

import { useEffect, useState, useCallback } from 'react';
import { SmsService } from '@/lib/services/sms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  Calendar,
  FileDown
} from 'lucide-react';

interface SmsMessage {
  message_id: string;
  to: string;
  status: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dateFilter, setDateFilter] = useState('today');
  const [apiKeyFilter, setApiKeyFilter] = useState('all');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [senderIdFilter, setSenderIdFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<any>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced fetch function
  const debouncedFetch = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      fetchSmsHistory();
    }, 300); // 300ms delay
    
    setDebounceTimer(timer);
  }, [debounceTimer]);

  // Immediate fetch for pagination and major filter changes
  useEffect(() => {
    fetchSmsHistory();
  }, [currentPage, statusFilter, dateFilter, apiKeyFilter]);

  // Debounced fetch for search and cost filters
  useEffect(() => {
    debouncedFetch();
  }, [searchTerm, minCost, maxCost, startDate, endDate, senderIdFilter, phoneFilter]);

  const fetchSmsHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = {
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

      console.log('SMS History API params being sent:', params);
      console.log('Status filter check - statusFilter:', statusFilter, 'will be included:', statusFilter !== 'all');
      const response = await SmsService.getSmsHistory(params);
      console.log('SMS History response:', response);
      
      setMessages(response.data?.messages || []);
      setPagination(response.data?.pagination || null);
      
      // Store available filters for UI
      if (response.data?.filters?.available) {
        setAvailableFilters(response.data.filters.available);
      }
    } catch (error: any) {
      console.error('Failed to fetch SMS history:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
        console.log('Rate limited - waiting before retry...');
      } else {
        setError('Failed to load SMS history. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMessages = messages.filter(message =>
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
      const params: any = {
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

      const response = await SmsService.getSmsHistory(params);
      const allMessages = response.data?.messages || [];
      
      // Create CSV content
      const headers = ['Message ID', 'Phone Number', 'Status', 'Cost (₵)', 'Date', 'Message'];
      const csvContent = [
        headers.join(','),
        ...allMessages.map(message => [
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-black/30 border-white/20 text-white rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Status</SelectItem>
                    {availableFilters?.status?.map((status: string) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    )) || (
                      <>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                <Select value={apiKeyFilter} onValueChange={setApiKeyFilter}>
                  <SelectTrigger className="bg-black/30 border-white/20 text-white rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder="Filter by API Key" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All API Keys</SelectItem>
                    {availableFilters?.api_keys?.map((key: any) => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={fetchSmsHistory}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl h-12 font-medium"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
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
                      {availableFilters?.date_filter?.map((filter: string) => (
                        <SelectItem key={filter} value={filter}>
                          {filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      )) || (
                        <>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="yesterday">Yesterday</SelectItem>
                          <SelectItem value="this_week">This Week</SelectItem>
                          <SelectItem value="this_month">This Month</SelectItem>
                          <SelectItem value="last_month">Last Month</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </>
                      )}
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
                        ? 'The API is rate limited. Please wait a moment before trying again.'
                        : 'Please check your connection and try again.'
                      }
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setError(null);
                      fetchSmsHistory();
                    }}
                    variant="outline"
                    size="sm"
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
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