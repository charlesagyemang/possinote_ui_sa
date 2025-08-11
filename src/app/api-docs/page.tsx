'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  MessageSquare, 
  Mail, 
  Copy,
  Check,
  Info,
  XCircle,
  Key,
  ArrowRight,
  Zap,
  Shield,
  Calendar,
  ChevronRight,
  Home,
  Code,
  Send,
  Users,
  Clock,
  Package
} from 'lucide-react';
import Link from 'next/link';

export default function ApiDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['sms', 'email', 'scheduling']);

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
    <div className="relative bg-slate-800 rounded-lg p-4 overflow-x-auto">
      <pre className="text-sm">
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

  const EndpointSection = ({ 
    method, 
    endpoint, 
    description, 
    requestBody, 
    response, 
    notes,
    curlExample
  }: {
    method: string;
    endpoint: string;
    description: string;
    requestBody?: string;
    response?: string;
    notes?: string[];
    curlExample?: string;
  }) => (
    <div className="space-y-6 mb-12">
      <div className="border-b border-slate-700 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Badge 
            variant={method === 'POST' ? 'default' : method === 'GET' ? 'secondary' : 'outline'}
            className={method === 'POST' ? 'bg-green-600' : method === 'GET' ? 'bg-blue-600' : ''}
          >
            {method}
          </Badge>
          <code className="text-sm bg-slate-700 px-3 py-1 rounded font-mono">{endpoint}</code>
        </div>
        <h3 className="text-xl font-bold text-white">{description}</h3>
      </div>

      <div className="space-y-6">
        {curlExample && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Code className="h-4 w-4" />
              cURL Example
            </h4>
            <CodeBlock identifier={`curl-${endpoint}`} language="bash">{curlExample}</CodeBlock>
          </div>
        )}
        
        {requestBody && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Request Body</h4>
            <CodeBlock identifier={`req-${endpoint}`}>{requestBody}</CodeBlock>
          </div>
        )}
        
        {response && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Response</h4>
            <CodeBlock identifier={`res-${endpoint}`}>{response}</CodeBlock>
          </div>
        )}
        
        {notes && notes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Notes</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-400 bg-slate-800/50 rounded-lg p-4">
              {notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'authentication', label: 'Authentication', icon: Key },
    { 
      id: 'sms', 
      label: 'SMS', 
      icon: MessageSquare,
      subItems: [
        { id: 'sms-send', label: 'Send Single SMS', icon: Send },
        { id: 'sms-bulk', label: 'Send Bulk SMS', icon: Users }
      ]
    },
    { 
      id: 'email', 
      label: 'Email', 
      icon: Mail,
      subItems: [
        { id: 'email-send', label: 'Send Single Email', icon: Send },
        { id: 'email-bulk', label: 'Send Bulk Email', icon: Users }
      ]
    },
    { 
      id: 'scheduling', 
      label: 'Scheduling', 
      icon: Calendar,
      subItems: [
        { id: 'schedule-sms', label: 'Schedule Single SMS', icon: Clock },
        { id: 'schedule-bulk-sms', label: 'Schedule Bulk SMS', icon: Clock },
        { id: 'schedule-email', label: 'Schedule Single Email', icon: Clock },
        { id: 'schedule-bulk-email', label: 'Schedule Bulk Email', icon: Clock },
        { id: 'schedule-bulk-individual', label: 'Schedule Bulk Individual', icon: Clock }
      ]
    },
    { id: 'sdks', label: 'SDKs', icon: Package },
    { id: 'errors', label: 'Error Handling', icon: XCircle },
    { id: 'best-practices', label: 'Best Practices', icon: Info }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
              <p className="text-gray-400 mb-6">
                PossiNote provides a powerful REST API for sending SMS messages, emails, and scheduling notifications. 
                Our API is designed to be simple, reliable, and scalable for developers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Base URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock identifier="base-url">https://notifyapi.possitech.net/api/v1</CodeBlock>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Content Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock identifier="content-type">application/json</CodeBlock>
                </CardContent>
              </Card>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-2">Important:</p>
                  <p>All endpoints are asynchronous - they queue jobs for background processing and return immediately with job IDs for tracking.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'authentication':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
              <p className="text-gray-400 mb-6">
                All API requests require authentication using your API key in the Authorization header.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Authorization Header</h3>
                <CodeBlock identifier="auth-header">Authorization: Bearer YOUR_API_KEY</CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Example Request</h3>
                <CodeBlock identifier="auth-example" language="bash">{`curl -X GET https://notifyapi.possitech.net/api/v1/usage \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</CodeBlock>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-semibold mb-1">Need an API Key?</p>
                    <p className="mb-3">Create an account and get your API key from the dashboard.</p>
                    <Link href="/pricing">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Get Started
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sms':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">SMS Endpoints</h2>
              <p className="text-gray-400 mb-6">
                Send SMS messages to phone numbers. All phone numbers must be in E.164 format.
              </p>
              
              {/* Sender ID Setup Notice */}
              <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-6 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Shield className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-300 mb-2">
                      ⚠️ Important: Sender ID Setup Required
                    </h3>
                    <p className="text-amber-200 mb-3">
                      Before sending SMS messages, you <strong>must</strong> create a sender ID in your dashboard. 
                      This sender ID will appear as the &quot;from&quot; name on your SMS messages.
                    </p>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                      <p className="text-sm text-gray-300 mb-2">
                        <strong>To set up your sender ID:</strong>
                      </p>
                      <ol className="text-sm text-gray-300 space-y-1 ml-4">
                        <li>1. Go to your <Link href="/dashboard" className="text-teal-400 hover:text-teal-300 underline">Dashboard</Link></li>
                        <li>2. Navigate to <strong>SMS Settings</strong> or <strong>Sender Names</strong></li>
                        <li>3. Create a new sender ID (e.g., &quot;POSSINOTE&quot;, &quot;MyCompany&quot;)</li>
                        <li>4. Wait for approval (usually instant for standard names)</li>
                        <li>5. Use the approved sender ID in your API requests</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sms-send':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Send Single SMS</h2>
              <p className="text-gray-400 mb-6">
                Send a single SMS message to one recipient.
              </p>
            </div>

            <EndpointSection
              method="POST"
              endpoint="/sms/send"
              description="Send a single SMS message"
              curlExample={`curl -X POST https://notifyapi.possitech.net/api/v1/sms/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sms": {
      "to": "+233541348180",
      "message": "Hello from PossiNote!",
      "sender_id": "MyBrand"
    }
  }'`}
              requestBody={`{
  "sms": {
    "to": "+233541348180",
    "message": "Hello from PossiNote!",
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
                "sender_id is required and must be pre-approved in your dashboard",
                "Phone number must be in E.164 format (+233...)",
                "Message limited to 160 characters",
                "Credits are deducted immediately",
                "SMS is queued for background delivery"
              ]}
            />
          </div>
        );

      case 'sms-bulk':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Send Bulk SMS</h2>
              <p className="text-gray-400 mb-6">
                Send multiple SMS messages in a single request.
              </p>
            </div>

            <EndpointSection
              method="POST"
              endpoint="/sms/bulk"
              description="Send multiple SMS messages in a single request"
              curlExample={`curl -X POST https://notifyapi.possitech.net/api/v1/sms/bulk \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
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
  }'`}
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
                "All messages use the same sender_id (required and must be pre-approved)",
                "Credits are deducted upfront for the entire batch",
                "Each message is queued individually for background processing",
                "Use batch_id to correlate related messages",
                "Use job_id to track the bulk job status"
              ]}
            />
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Email Endpoints</h2>
              <p className="text-gray-400 mb-6">
                Send emails to recipients. Content supports HTML formatting.
              </p>
            </div>
          </div>
        );

      case 'email-send':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Send Single Email</h2>
              <p className="text-gray-400 mb-6">
                Send a single email message to one recipient.
              </p>
            </div>

            <EndpointSection
              method="POST"
              endpoint="/emails/send"
              description="Send a single email message"
              curlExample={`curl -X POST https://notifyapi.possitech.net/api/v1/emails/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "user@example.com",
    "subject": "Welcome to PossiNote",
    "content": "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
    "sender_name": "PossiNote Team"
  }'`}
              requestBody={`{
  "recipient": "user@example.com",
  "subject": "Welcome to PossiNote",
  "content": "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
  "sender_name": "PossiNote Team"
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
          </div>
        );

      case 'email-bulk':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Send Bulk Email</h2>
              <p className="text-gray-400 mb-6">
                Send multiple emails in a single request.
              </p>
            </div>

            <EndpointSection
              method="POST"
              endpoint="/emails/bulk"
              description="Send multiple emails in a single request"
              curlExample={`curl -X POST https://notifyapi.possitech.net/api/v1/emails/bulk \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipients": ["user1@example.com", "user2@example.com"],
    "subject": "Monthly Newsletter",
    "content": "<h1>Newsletter</h1><p>This month updates...</p>",
    "sender_name": "Newsletter Team"
  }'`}
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
          </div>
        );

      case 'scheduling':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Scheduling Endpoints</h2>
              <p className="text-gray-400 mb-6">
                Schedule emails and SMS for future delivery. All scheduled times must be in ISO 8601 format.
              </p>
            </div>
          </div>
        );

      case 'schedule-sms':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Schedule Single SMS</h2>
              <p className="text-gray-400 mb-6">
                Schedule a single SMS message for future delivery.
              </p>
            </div>

            <EndpointSection
              method="POST"
              endpoint="/sms/schedule"
              description="Schedule a single SMS for future delivery"
              curlExample={`curl -X POST https://notifyapi.possitech.net/api/v1/sms/schedule \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "scheduled_sms": {
      "to": "+233541348180",
      "message": "Scheduled reminder from PossiNote!",
      "sender_id": "MyBrand",
      "scheduled_at": "2025-08-10T10:00:00Z"
    }
  }'`}
              requestBody={`{
  "scheduled_sms": {
    "to": "+233541348180",
    "message": "Scheduled reminder from PossiNote!",
    "sender_id": "MyBrand",
    "scheduled_at": "2025-08-10T10:00:00Z"
  }
}`}
              response={`{
  "success": true,
  "data": {
    "id": "sched_abc123def456",
    "to": "+233541348180",
    "message": "Scheduled reminder from PossiNote!",
    "scheduled_at": "2025-08-10T10:00:00Z",
    "status": "pending",
    "cost": 1.0
  }
}`}
              notes={[
                "sender_id is required and must be pre-approved in your dashboard",
                "scheduled_at must be in ISO 8601 format",
                "scheduled_at must be in the future",
                "Phone number must be in E.164 format (+233...)",
                "Credits are deducted immediately",
                "SMS will be sent at the scheduled time"
              ]}
            />
          </div>
        );

      case 'schedule-bulk-sms':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Schedule Bulk SMS</h2>
              <p className="text-gray-400 mb-6">
                Schedule multiple SMS messages for future delivery.
              </p>
            </div>

            <EndpointSection
              method="POST"
              endpoint="/sms/schedule-bulk"
              description="Schedule multiple SMS messages for future delivery"
              curlExample={`curl -X POST https://notifyapi.possitech.net/api/v1/sms/schedule-bulk \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bulk_scheduled_sms": {
      "sender_id": "MyBrand",
      "message": "Scheduled bulk reminder from PossiNote!",
      "scheduled_at": "2025-08-10T10:00:00Z",
      "recipients": ["+233541348180", "+233277119919"]
    }
  }'`}
              requestBody={`{
  "bulk_scheduled_sms": {
    "sender_id": "MyBrand",
    "message": "Scheduled bulk reminder from PossiNote!",
    "scheduled_at": "2025-08-10T10:00:00Z",
    "recipients": ["+233541348180", "+233277119919"]
  }
}`}
              response={`{
  "success": true,
  "data": {
    "batch_id": "batch_abc123def456",
    "total_scheduled": 2,
    "total_cost": 2.0,
    "scheduled_sms": [
      {
        "id": "sched_abc123_0",
        "to": "+233541348180",
        "status": "pending"
      },
      {
        "id": "sched_def456_1",
        "to": "+233277119919",
        "status": "pending"
      }
    ]
  }
}`}
              notes={[
                "All SMS use the same message and sender_id",
                "sender_id is required and must be pre-approved in your dashboard",
                "scheduled_at must be in ISO 8601 format",
                "scheduled_at must be in the future",
                "Phone numbers must be in E.164 format (+233...)",
                "Credits are deducted immediately",
                "All SMS will be sent at the scheduled time"
              ]}
            />
          </div>
        );

      case 'schedule-email':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Schedule Single Email</h2>
              <p className="text-gray-400 mb-6">
                Schedule a single email for future delivery.
              </p>
            </div>

            <EndpointSection
              method="POST"
              endpoint="/emails/schedule"
              description="Schedule a single email for future delivery"
              curlExample={`curl -X POST https://notifyapi.possitech.net/api/v1/emails/schedule \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "scheduled_email": {
      "recipient": "user@example.com",
      "subject": "Scheduled Welcome Email",
      "content": "<h1>Welcome!</h1><p>This email was scheduled.</p>",
      "sender_name": "PossiNote Team",
      "scheduled_at": "2025-08-10T10:00:00Z"
    }
  }'`}
              requestBody={`{
  "scheduled_email": {
    "recipient": "user@example.com",
    "subject": "Scheduled Welcome Email",
    "content": "<h1>Welcome!</h1><p>This email was scheduled.</p>",
    "sender_name": "PossiNote Team",
    "scheduled_at": "2025-08-10T10:00:00Z"
  }
}`}
              response={`{
  "success": true,
  "data": {
    "id": "sched_abc123def456",
    "recipient": "user@example.com",
    "subject": "Scheduled Welcome Email",
    "scheduled_at": "2025-08-10T10:00:00Z",
    "status": "pending",
    "cost": 1.0
  }
}`}
              notes={[
                "scheduled_at must be in ISO 8601 format",
                "scheduled_at must be in the future",
                "Credits are deducted immediately",
                "Email will be sent at the scheduled time",
                "You can cancel scheduled emails before they're sent"
              ]}
            />
          </div>
        );

      case 'schedule-bulk-email':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Schedule Bulk Email</h2>
              <p className="text-gray-400 mb-6">
                Schedule multiple emails with the same content for future delivery.
              </p>
            </div>

            <EndpointSection
              method="POST"
              endpoint="/emails/schedule-bulk"
              description="Schedule multiple emails with the same content for future delivery"
              curlExample={`curl -X POST https://notifyapi.possitech.net/api/v1/emails/schedule-bulk \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bulk_scheduled_email": {
      "subject": "Scheduled Newsletter",
      "content": "<h1>Newsletter</h1><p>This newsletter was scheduled.</p>",
      "sender_name": "Newsletter Team",
      "scheduled_at": "2025-08-10T10:00:00Z",
      "recipients": ["user1@example.com", "user2@example.com"]
    }
  }'`}
              requestBody={`{
  "bulk_scheduled_email": {
    "subject": "Scheduled Newsletter",
    "content": "<h1>Newsletter</h1><p>This newsletter was scheduled.</p>",
    "sender_name": "Newsletter Team",
    "scheduled_at": "2025-08-10T10:00:00Z",
    "recipients": ["user1@example.com", "user2@example.com"]
  }
}`}
              response={`{
  "success": true,
  "data": {
    "batch_id": "batch_abc123def456",
    "total_scheduled": 2,
    "total_cost": 2.0,
    "scheduled_emails": [
      {
        "id": "sched_abc123_0",
        "recipient": "user1@example.com",
        "status": "pending"
      },
      {
        "id": "sched_def456_1",
        "recipient": "user2@example.com",
        "status": "pending"
      }
    ]
  }
}`}
              notes={[
                "All emails use the same subject, content, and sender_name",
                "scheduled_at must be in ISO 8601 format",
                "scheduled_at must be in the future",
                "Credits are deducted immediately",
                "All emails will be sent at the scheduled time",
                "You can cancel individual scheduled emails before they're sent"
              ]}
            />
          </div>
        );

      case 'schedule-bulk-individual':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Schedule Bulk Individual Email</h2>
              <p className="text-gray-400 mb-6">
                Schedule multiple individual emails with personalized content for future delivery.
              </p>
            </div>

            <EndpointSection
              method="POST"
              endpoint="/emails/schedule-bulk-individual"
              description="Schedule multiple individual emails with personalized content for future delivery"
              curlExample={`curl -X POST https://notifyapi.possitech.net/api/v1/emails/schedule-bulk-individual \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "emails": [
      {
        "recipient": "john@example.com",
        "subject": "Welcome John!",
        "content": "<h1>Welcome John!</h1><p>We're excited to have you on board.</p>",
        "sender_name": "Welcome Team",
        "scheduled_at": "2025-08-10T10:00:00Z"
      },
      {
        "recipient": "jane@example.com",
        "subject": "Welcome Jane!",
        "content": "<h1>Welcome Jane!</h1><p>We're excited to have you on board.</p>",
        "sender_name": "Welcome Team",
        "scheduled_at": "2025-08-10T10:00:00Z"
      }
    ]
  }'`}
              requestBody={`{
  "emails": [
    {
      "recipient": "john@example.com",
      "subject": "Welcome John!",
      "content": "<h1>Welcome John!</h1><p>We're excited to have you on board.</p>",
      "sender_name": "Welcome Team",
      "scheduled_at": "2025-08-10T10:00:00Z"
    },
    {
      "recipient": "jane@example.com",
      "subject": "Welcome Jane!",
      "content": "<h1>Welcome Jane!</h1><p>We're excited to have you on board.</p>",
      "sender_name": "Welcome Team",
      "scheduled_at": "2025-08-10T10:00:00Z"
    }
  ]
}`}
              response={`{
  "success": true,
  "data": {
    "batch_id": "batch_abc123def456",
    "total_scheduled": 2,
    "total_cost": 2.0,
    "scheduled_emails": [
      {
        "id": "sched_abc123_0",
        "recipient": "john@example.com",
        "subject": "Welcome John!",
        "scheduled_at": "2025-08-10T10:00:00Z",
        "status": "pending"
      },
      {
        "id": "sched_def456_1",
        "recipient": "jane@example.com",
        "subject": "Welcome Jane!",
        "scheduled_at": "2025-08-10T10:00:00Z",
        "status": "pending"
      }
    ]
  }
}`}
              notes={[
                "Each email can have different subject, content, and sender_name",
                "Perfect for personalized campaigns",
                "scheduled_at must be in ISO 8601 format",
                "scheduled_at must be in the future",
                "Credits are deducted immediately",
                "Each email will be sent at its scheduled time",
                "You can cancel individual scheduled emails before they're sent"
              ]}
            />
          </div>
        );

      case 'sdks':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">SDKs & Libraries</h2>
              <p className="text-gray-400 mb-6">
                Official SDKs and libraries to help you integrate PossiNote API into your applications quickly and easily.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Ruby Gem */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">R</span>
                    </div>
                    Ruby Gem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Official Ruby gem for PossiNote API integration.
                  </p>
                                     <div className="bg-slate-900 rounded-lg p-4">
                     <CodeBlock identifier="ruby-install">gem install possinote</CodeBlock>
                   </div>
                   <div className="bg-slate-900 rounded-lg p-4">
                     <CodeBlock identifier="ruby-usage" language="ruby">{`require 'possinote'

client = Possinote::Client.new(api_key: 'YOUR_API_KEY')

# Send SMS
client.sms.send(
  to: '+233541348180',
  message: 'Hello from Ruby!',
  sender_id: 'MyBrand'
)

# Send Email
client.email.send(
  recipient: 'user@example.com',
  subject: 'Welcome!',
  content: '<h1>Hello!</h1>',
  sender_name: 'Ruby App'
)`}</CodeBlock>
                  </div>
                </CardContent>
              </Card>

              {/* Python Package */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                    Python Package
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Official Python package for PossiNote API integration.
                  </p>
                                     <div className="bg-slate-900 rounded-lg p-4">
                     <CodeBlock identifier="python-install">pip install possinote</CodeBlock>
                   </div>
                   <div className="bg-slate-900 rounded-lg p-4">
                     <CodeBlock identifier="python-usage" language="python">{`from possinote import Possinote

client = Possinote(api_key='YOUR_API_KEY')

# Send SMS
client.sms.send(
    to='+233541348180',
    message='Hello from Python!',
    sender_id='MyBrand'
)

# Send Email
client.email.send(
    recipient='user@example.com',
    subject='Welcome!',
    content='<h1>Hello!</h1>',
    sender_name='Python App'
)`}</CodeBlock>
                  </div>
                </CardContent>
              </Card>

              {/* Node.js Package */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">N</span>
                    </div>
                    Node.js Package
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Official Node.js package for PossiNote API integration.
                  </p>
                                     <div className="bg-slate-900 rounded-lg p-4">
                     <CodeBlock identifier="node-install">npm install possinote</CodeBlock>
                   </div>
                   <div className="bg-slate-900 rounded-lg p-4">
                     <CodeBlock identifier="node-usage" language="javascript">{`const { Possinote } = require('possinote');

const client = new Possinote('YOUR_API_KEY');

// Send SMS
await client.sms.send({
  to: '+233541348180',
  message: 'Hello from Node.js!',
  sender_id: 'MyBrand'
});

// Send Email
await client.email.send({
  recipient: 'user@example.com',
  subject: 'Welcome!',
  content: '<h1>Hello!</h1>',
  sender_name: 'Node.js App'
});`}</CodeBlock>
                  </div>
                </CardContent>
              </Card>

              {/* TypeScript Package */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">TS</span>
                    </div>
                    TypeScript Package
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Official TypeScript package with full type definitions.
                  </p>
                                     <div className="bg-slate-900 rounded-lg p-4">
                     <CodeBlock identifier="ts-install">npm install possinote</CodeBlock>
                   </div>
                   <div className="bg-slate-900 rounded-lg p-4">
                     <CodeBlock identifier="ts-usage" language="typescript">{`import { Possinote } from 'possinote';

const client = new Possinote('YOUR_API_KEY');

// Send SMS
await client.sms.send({
  to: '+233541348180',
  message: 'Hello from TypeScript!',
  sender_id: 'MyBrand'
});

// Send Email
await client.email.send({
  recipient: 'user@example.com',
  subject: 'Welcome!',
  content: '<h1>Hello!</h1>',
  sender_name: 'TypeScript App'
});`}</CodeBlock>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coming Soon Section */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/50 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Package className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-300 mb-2">
                    🚀 More SDKs Coming Soon!
                  </h3>
                  <p className="text-purple-200 mb-3">
                    We&apos;re working on additional SDKs to make integration even easier.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold text-xs">PHP</span>
                        </div>
                        <span className="text-xs text-gray-300">PHP SDK</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold text-xs">GO</span>
                        </div>
                        <span className="text-xs text-gray-300">Go SDK</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold text-xs">C#</span>
                        </div>
                        <span className="text-xs text-gray-300">C# SDK</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold text-xs">J</span>
                        </div>
                        <span className="text-xs text-gray-300">Java SDK</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'errors':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Error Handling</h2>
              <p className="text-gray-400 mb-6">
                Common error responses and their meanings.
              </p>
            </div>

            <div className="grid gap-6">
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-3">400 Bad Request</h3>
                <CodeBlock identifier="error-400">{`{
  "error": "Missing required parameters: recipients, subject, content"
}`}</CodeBlock>
                <p className="text-sm text-gray-400 mt-2">Missing or invalid parameters in the request body.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-3">401 Unauthorized</h3>
                <CodeBlock identifier="error-401">{`{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}`}</CodeBlock>
                <p className="text-sm text-gray-400 mt-2">Invalid or missing API key in the Authorization header.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-3">402 Payment Required</h3>
                <CodeBlock identifier="error-402">{`{
  "error": "Insufficient credits. Need 10.0 credits for 10 SMS messages."
}`}</CodeBlock>
                <p className="text-sm text-gray-400 mt-2">Insufficient credits to complete the operation.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-3">429 Too Many Requests</h3>
                <CodeBlock identifier="error-429">{`{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please try again later.",
  "reset_time": "2025-08-09T19:00:00Z"
}`}</CodeBlock>
                <p className="text-sm text-gray-400 mt-2">Rate limit exceeded. Wait until reset_time before making more requests.</p>
              </div>
            </div>
          </div>
        );

      case 'best-practices':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Best Practices</h2>
              <p className="text-gray-400 mb-6">
                Follow these guidelines for optimal API usage.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-green-400">Do&apos;s</h3>
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
                <h3 className="font-semibold text-red-400">Don&apos;ts</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Don&apos;t send without checking credit balance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Don&apos;t ignore rate limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Don&apos;t send to invalid phone numbers or emails</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Don&apos;t send large batches without testing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Don&apos;t forget to handle error responses</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex flex-col">
      {/* Fixed Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  PossiNote API
                </h1>
                <p className="text-sm text-gray-400">Documentation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/pricing">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Fixed Sidebar */}
        <div className="w-64 bg-slate-800/50 border-r border-slate-700 flex-shrink-0">
          <nav className="p-6 h-full overflow-y-auto">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const hasSubItems = 'subItems' in item;
                const isExpanded = expandedMenus.includes(item.id);
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        if (hasSubItems) {
                          setExpandedMenus(prev => 
                            isExpanded 
                              ? prev.filter(id => id !== item.id)
                              : [...prev, item.id]
                          );
                        } else {
                          setActiveSection(item.id);
                        }
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeSection === item.id
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white'
                          : 'text-gray-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {hasSubItems && (
                        <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      )}
                      {!hasSubItems && activeSection === item.id && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                    
                    {/* Sub-menu items */}
                    {hasSubItems && isExpanded && item.subItems && (
                      <ul className="ml-6 mt-2 space-y-1">
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <li key={subItem.id}>
                              <button
                                onClick={() => setActiveSection(subItem.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-colors text-sm ${
                                  activeSection === subItem.id
                                    ? 'bg-gradient-to-r from-teal-500/80 to-emerald-600/80 text-white'
                                    : 'text-gray-400 hover:bg-slate-700/30'
                                }`}
                              >
                                <SubIcon className="h-3 w-3" />
                                <span className="font-medium">{subItem.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="max-w-4xl">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

