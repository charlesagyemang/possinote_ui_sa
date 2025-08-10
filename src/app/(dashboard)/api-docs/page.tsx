'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  MessageSquare, 
  Mail, 
  Code, 
  Copy,
  Check,
  AlertCircle,
  Info,
  ExternalLink,
  XCircle
} from 'lucide-react';
import { ApiKeyService } from '@/lib/services/apiKeys';

export default function ApiDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; key_prefix: string; full_key: string; permissions: { sms: string[]; email: string[]; analytics: string[]; api_keys: string[]; senders: string[] } }>>([]);
  const [loading, setLoading] = useState(true);

  // Fetch API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        console.log('=== API KEYS DEBUG START ===');
        console.log('Fetching API keys for docs page...');
        const response = await ApiKeyService.getApiKeys();
        console.log('Full API response:', response);
        console.log('Response type:', typeof response);
        console.log('Response.success:', response.success);
        console.log('Response.data:', response.data);
        console.log('Response.data?.api_keys:', response.data?.api_keys);
        console.log('Response.data?.api_keys type:', typeof response.data?.api_keys);
        console.log('Response.data?.api_keys length:', response.data?.api_keys?.length);
        
        if (response.success) {
          const keys = response.data?.api_keys || [];
          console.log('Keys to set:', keys);
          console.log('Keys array type:', Array.isArray(keys));
          setApiKeys(keys);
          console.log('API keys state set successfully');
        } else {
          console.log('Response was not successful');
        }
        console.log('=== API KEYS DEBUG END ===');
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchApiKeys();
  }, []);

  const copyToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(identifier);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const CodeBlock = ({ children, language = 'json', identifier }: { children: string; language?: string; identifier?: string }) => (
    <div className="relative">
      <pre className="bg-slate-800 rounded-lg p-4 overflow-x-auto text-sm">
        <code className={`language-${language}`}>{children}</code>
      </pre>
      {identifier && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0"
          onClick={() => copyToClipboard(children, identifier)}
        >
          {copiedCode === identifier ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );

  const EndpointCard = ({ 
    method, 
    endpoint, 
    description, 
    requestBody, 
    response, 
    notes 
  }: {
    method: string;
    endpoint: string;
    description: string;
    requestBody?: string;
    response?: string;
    notes?: string[];
  }) => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge 
            variant={method === 'POST' ? 'default' : method === 'GET' ? 'secondary' : 'outline'}
            className={method === 'POST' ? 'bg-green-600' : method === 'GET' ? 'bg-blue-600' : ''}
          >
            {method}
          </Badge>
          <code className="text-sm bg-slate-700 px-2 py-1 rounded">{endpoint}</code>
        </div>
        <CardTitle className="text-lg text-white mt-2">{description}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requestBody && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Request Body:</h4>
            <CodeBlock identifier={`req-${endpoint}`}>{requestBody}</CodeBlock>
          </div>
        )}
        {response && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Response:</h4>
            <CodeBlock identifier={`res-${endpoint}`}>{response}</CodeBlock>
          </div>
        )}
        {notes && notes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Notes:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
              {notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold text-white">API Documentation</h1>
          <p className="text-gray-400">Complete guide to integrate PossiNotify API into your applications</p>
        </div>
      </div>

      {/* API Key Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Code className="h-5 w-5" />
            Your API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-400">Loading API keys...</div>
          ) : apiKeys.length > 0 ? (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                                     <div>
                     <div className="font-medium text-white">{apiKey.name}</div>
                     <div className="text-sm text-gray-400">
                       Permissions: {Object.keys(apiKey.permissions).filter(key => 
                         apiKey.permissions[key as keyof typeof apiKey.permissions].length > 0
                       ).join(', ')}
                     </div>
                   </div>
                                     <div className="flex items-center gap-2">
                     <code className="text-sm bg-slate-600 px-2 py-1 rounded text-gray-300">
                       {apiKey.full_key ? apiKey.full_key.substring(0, 12) + '...' : 'No key'}
                     </code>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => apiKey.full_key && copyToClipboard(apiKey.full_key, `key-${apiKey.id}`)}
                       disabled={!apiKey.full_key}
                     >
                       {copiedCode === `key-${apiKey.id}` ? (
                         <Check className="h-4 w-4 text-green-500" />
                       ) : (
                         <Copy className="h-4 w-4" />
                       )}
                     </Button>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No API keys found. Create one in Settings to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="h-5 w-5" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-300">Base URL</h4>
                             <code className="text-sm bg-slate-700 px-2 py-1 rounded text-green-400">
                 https://notifyapi.possitech.net/api/v1
               </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-300">Authentication</h4>
              <code className="text-sm bg-slate-700 px-2 py-1 rounded text-blue-400">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-1">Important:</p>
                <p>All endpoints are asynchronous - they queue jobs for background processing and return immediately with job IDs for tracking.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Tabs defaultValue="sms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS Endpoints
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Endpoints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms" className="space-y-6">
          {/* Send Single SMS */}
          <EndpointCard
            method="POST"
            endpoint="/sms/send"
            description="Send a single SMS message"
            requestBody={`{
  "sms": {
    "to": "+233541348180",
    "message": "Hello from PossiNotify!",
    "sender_id": "MyBrand"
  }
}`}
            response={`{
  "success": true,
  "data": {
    "message_id": "msg_abc123def456",
    "to": "+233541348180",
    "status": "queued",
    "cost": 1.0,
    "created_at": "2025-08-09T18:30:00Z"
  }
}`}
            notes={[
              "sender_id is optional. If not provided, defaults to 'Possitech'",
              "Phone number must be in E.164 format (+233...)",
              "Message limited to 160 characters",
              "Credits are deducted immediately",
              "SMS is queued for background delivery"
            ]}
          />

          {/* Send Bulk SMS */}
          <EndpointCard
            method="POST"
            endpoint="/sms/bulk"
            description="Send multiple SMS messages in a single request"
            requestBody={`{
  "bulk_sms": {
    "sender_id": "MyBrand",
    "messages": [
      {
        "to": "+233541348180",
        "message": "Hello John!"
      },
      {
        "to": "+233277119919",
        "message": "Hello Jane!"
      }
    ]
  }
}`}
            response={`{
  "success": true,
  "data": {
    "batch_id": "batch_abc123def456",
    "total_messages": 2,
    "successful": 2,
    "failed": 0,
    "total_cost": 2.0,
    "messages": [
      {
        "message_id": "msg_abc123_0",
        "to": "+233541348180",
        "status": "queued"
      },
      {
        "message_id": "msg_def456_1",
        "to": "+233277119919",
        "status": "queued"
      }
    ],
    "job_id": "550c4620-76bb-4bbb-8015-ff9ab94358f8"
  }
}`}
            notes={[
              "All messages use the same sender_id (optional)",
              "Credits are deducted upfront for the entire batch",
              "Each message is queued individually for background processing",
              "Use batch_id to correlate related messages",
              "Use job_id to track the bulk job status"
            ]}
          />

          {/* Check SMS Status */}
          <EndpointCard
            method="GET"
            endpoint="/sms/{message_id}"
            description="Get the status of a specific SMS message"
            response={`{
  "success": true,
  "data": {
    "message_id": "msg_abc123def456",
    "to": "+233541348180",
    "message": "Hello from PossiNotify!",
    "status": "delivered",
    "delivered_at": "2025-08-09T18:31:00Z",
    "cost": 1.0
  }
}`}
            notes={[
              "Status values: pending, sent, delivered, failed"
            ]}
          />

          {/* List SMS Messages */}
          <EndpointCard
            method="GET"
            endpoint="/sms?page=1&per_page=20"
            description="Get a paginated list of SMS messages with filtering options"
            response={`{
  "success": true,
  "data": {
    "messages": [
      {
        "message_id": "msg_abc123def456",
        "to": "+233541348180",
        "message": "Hello from PossiNotify!",
        "status": "delivered",
        "created_at": "2025-08-09T18:30:00Z",
        "cost": 1.0,
        "api_key_name": "Production Key",
        "sender_id": "MyBrand"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 100,
      "per_page": 20
    }
  }
}`}
            notes={[
              "Query parameters: page, per_page, status, phone, sender_id, start_date, end_date, date_filter",
              "per_page max is 100",
              "date_filter options: today, yesterday, this_week, this_month, last_month"
            ]}
          />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          {/* Send Single Email */}
          <EndpointCard
            method="POST"
            endpoint="/emails/send"
            description="Send a single email message"
            requestBody={`{
  "recipient": "user@example.com",
  "subject": "Welcome to PossiNotify",
  "content": "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
  "sender_name": "PossiNotify Team"
}`}
            response={`{
  "success": true,
  "message": "Email queued for delivery",
  "recipient": "user@example.com",
  "message_id": "msg_abc123def456"
}`}
            notes={[
              "sender_name is optional",
              "Content supports HTML",
              "Credits are deducted immediately",
              "Email is queued for background delivery"
            ]}
          />

          {/* Send Bulk Email */}
          <EndpointCard
            method="POST"
            endpoint="/emails/bulk"
            description="Send multiple emails in a single request"
            requestBody={`{
  "recipients": ["user1@example.com", "user2@example.com"],
  "subject": "Monthly Newsletter",
  "content": "<h1>Newsletter</h1><p>This month's updates...</p>",
  "sender_name": "Newsletter Team"
}`}
            response={`{
  "success": true,
  "message": "Bulk emails queued for delivery",
  "queued_count": 2,
  "total_count": 2,
  "batch_id": "batch_abc123def456",
  "emails": [
    {
      "message_id": "msg_abc123_0",
      "recipient": "user1@example.com",
      "status": "queued"
    },
    {
      "message_id": "msg_def456_1",
      "recipient": "user2@example.com",
      "status": "queued"
    }
  ],
  "job_id": "550c4620-76bb-4bbb-8015-ff9ab94358f8"
}`}
            notes={[
              "All emails use the same subject, content, and sender_name",
              "Invalid email addresses are filtered out before processing",
              "Credits are deducted upfront for valid recipients only",
              "Each email is queued individually for background processing",
              "Use batch_id to correlate related emails",
              "Use job_id to track the bulk job status"
            ]}
          />

          {/* Check Email Status */}
          <EndpointCard
            method="GET"
            endpoint="/emails/{message_id}"
            description="Get the status of a specific email message"
            response={`{
  "success": true,
  "message_id": "msg_abc123def456",
  "recipient": "user@example.com",
  "subject": "Welcome to PossiNotify",
  "content": "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
  "status": "sent",
  "created_at": "2025-08-09T18:30:00Z",
  "cost": 1.0,
  "sender_name": "PossiNotify Team"
}`}
            notes={[
              "Status values: pending, sent, delivered, failed, bounced"
            ]}
          />

          {/* List Email Messages */}
          <EndpointCard
            method="GET"
            endpoint="/emails?page=1&per_page=20"
            description="Get a paginated list of email messages with filtering options"
            response={`{
  "success": true,
  "emails": [
    {
      "message_id": "msg_abc123def456",
      "recipient": "user@example.com",
      "subject": "Welcome to PossiNotify",
      "content": "Welcome! Thank you for joining us...",
      "status": "sent",
      "created_at": "2025-08-09T18:30:00Z",
      "cost": 1.0,
      "api_key_name": "Production Key",
      "sender_name": "PossiNotify Team"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 100,
    "per_page": 20
  }
}`}
            notes={[
              "Query parameters: page, per_page, status, email, sender_name, start_date, end_date, date_filter",
              "per_page max is 100",
              "date_filter options: today, yesterday, this_week, this_month, last_month"
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Error Responses */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Error Responses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-red-400 mb-2">400 Bad Request</h4>
              <CodeBlock identifier="error-400">{`{
  "error": "Missing required parameters: recipients, subject, content"
}`}</CodeBlock>
            </div>
            <div>
              <h4 className="font-semibold text-red-400 mb-2">401 Unauthorized</h4>
              <CodeBlock identifier="error-401">{`{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}`}</CodeBlock>
            </div>
            <div>
              <h4 className="font-semibold text-red-400 mb-2">402 Payment Required</h4>
              <CodeBlock identifier="error-402">{`{
  "error": "Insufficient credits. Need 10.0 credits for 10 SMS messages."
}`}</CodeBlock>
            </div>
            <div>
              <h4 className="font-semibold text-red-400 mb-2">429 Too Many Requests</h4>
              <CodeBlock identifier="error-429">{`{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please try again later.",
  "reset_time": "2025-08-09T19:00:00Z"
}`}</CodeBlock>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SDK Examples */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">SDK Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="javascript" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="javascript">JavaScript/Node.js</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
            
            <TabsContent value="javascript">
              <CodeBlock identifier="js-example" language="javascript">{`const possiNotify = require('possinotify-sdk');

// Send single SMS
const smsResult = await possiNotify.sms.send({
  to: '+233541348180',
  message: 'Hello!',
  sender_id: 'MyBrand'
});

// Send bulk SMS
const bulkSmsResult = await possiNotify.sms.bulk({
  messages: [
    { to: '+233541348180', message: 'Hello John!' },
    { to: '+233277119919', message: 'Hello Jane!' }
  ],
  sender_id: 'MyBrand'
});

// Check status
const status = await possiNotify.sms.status(smsResult.message_id);`}</CodeBlock>
            </TabsContent>
            
            <TabsContent value="python">
              <CodeBlock identifier="python-example" language="python">{`import possinotify

# Send single email
email_result = possinotify.email.send(
    recipient='user@example.com',
    subject='Welcome!',
    content='<h1>Welcome</h1>',
    sender_name='Team'
)

# Send bulk email
bulk_result = possinotify.email.bulk(
    recipients=['user1@example.com', 'user2@example.com'],
    subject='Newsletter',
    content='<h1>Newsletter</h1>'
)

# Check status
status = possinotify.email.status(email_result.message_id)`}</CodeBlock>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-400">Do's</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Always check credit balance before sending large batches</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use batch_id to correlate related messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Monitor job_id for bulk operation status</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Validate phone numbers and email addresses before sending</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Test with small batches before sending large campaigns</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-red-400">Don'ts</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Don't send without checking credit balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Don't ignore rate limits</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Don't send to invalid phone numbers or emails</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Don't send large batches without testing</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Don't forget to handle error responses</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <Mail className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <h4 className="font-semibold text-white mb-1">Email Support</h4>
              <p className="text-sm text-gray-400">support@possitech.net</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <ExternalLink className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <h4 className="font-semibold text-white mb-1">Documentation</h4>
              <p className="text-sm text-gray-400">docs.possitech.net</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <Info className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <h4 className="font-semibold text-white mb-1">Status Page</h4>
              <p className="text-sm text-gray-400">status.possitech.net</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
