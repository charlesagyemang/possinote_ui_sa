# Bulk Individual Emails API

## Overview

The Bulk Individual Emails API allows you to send multiple emails with **different content for each recipient** in a single request. This is perfect for personalized campaigns, order confirmations, or any scenario where each email needs unique content.

**Key Features:**
- ✅ Send up to 9000+ emails in one request
- ✅ Each email can have different recipient, subject, and content
- ✅ Returns immediately (doesn't wait for sending)
- ✅ Background processing handles actual email delivery
- ✅ Automatic credit validation and deduction
- ✅ Batch tracking and job monitoring

---

## Endpoint

**POST** `/api/v1/emails/send-bulk-individual`

**Description:** Send multiple emails with individual content for each recipient immediately.

---

## Request Format

### Headers
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Request Body
```json
{
  "emails": [
    {
      "recipient": "john@example.com",
      "subject": "Welcome John",
      "content": "<h1>Hello John!</h1><p>Welcome to our platform.</p>",
      "sender_name": "Support Team"
    },
    {
      "recipient": "jane@example.com",
      "subject": "Welcome Jane", 
      "content": "<h1>Hello Jane!</h1><p>Welcome to our platform.</p>",
      "sender_name": "Support Team"
    },
    {
      "recipient": "bob@example.com",
      "subject": "Order Confirmation #12345",
      "content": "<h1>Order Confirmed!</h1><p>Your order #12345 has been confirmed.</p>",
      "sender_name": "Order Team"
    }
  ]
}
```

### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `emails` | array | ✅ | Array of email objects | `[{...}]` |
| `emails[].recipient` | string | ✅ | Email address | `"john@example.com"` |
| `emails[].subject` | string | ✅ | Email subject (max 255 chars) | `"Welcome!"` |
| `emails[].content` | string | ✅ | Email content (HTML supported) | `"<h1>Hello</h1>"` |
| `emails[].sender_name` | string | ❌ | Custom sender name | `"Support Team"` |

---

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Bulk individual emails queued for delivery",
  "queued_count": 3,
  "total_count": 3,
  "batch_id": "batch_abc123def456",
  "emails": [
    {
      "message_id": "msg_abc123_0",
      "recipient": "john@example.com",
      "subject": "Welcome John",
      "status": "queued"
    },
    {
      "message_id": "msg_def456_1",
      "recipient": "jane@example.com",
      "subject": "Welcome Jane",
      "status": "queued"
    },
    {
      "message_id": "msg_ghi789_2",
      "recipient": "bob@example.com",
      "subject": "Order Confirmation #12345",
      "status": "queued"
    }
  ],
  "job_id": "550c4620-76bb-4bbb-8015-ff9ab94358f8"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful requests |
| `message` | string | Success message |
| `queued_count` | integer | Number of emails successfully queued |
| `total_count` | integer | Total number of emails in request |
| `batch_id` | string | Unique identifier for this batch |
| `emails` | array | Array of email objects with status |
| `emails[].message_id` | string | Unique message identifier |
| `emails[].recipient` | string | Email address |
| `emails[].subject` | string | Email subject |
| `emails[].status` | string | Always `"queued"` for successful requests |
| `job_id` | string | Background job identifier for tracking |

---

## Error Responses

### Insufficient Credits (402 Payment Required)
```json
{
  "success": false,
  "error": "Insufficient Email credits. Need 5.0 Email credits for 5 emails."
}
```

### Invalid Email Addresses (400 Bad Request)
```json
{
  "success": false,
  "error": "Validation errors found",
  "errors": [
    {
      "index": 0,
      "recipient": "invalid-email",
      "error": "Invalid email format"
    },
    {
      "index": 2,
      "recipient": "bob@example.com",
      "error": "Subject is required and must be 255 characters or less"
    }
  ]
}
```

### No Emails Provided (400 Bad Request)
```json
{
  "success": false,
  "error": "No valid emails provided"
}
```

### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Failed to queue bulk individual emails"
}
```

---

## Example Usage

### cURL Example
```bash
curl -X POST https://your-api-domain.com/api/v1/emails/send-bulk-individual \
  -H "Authorization: Bearer pk_bvxib5z6xxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      {
        "recipient": "john@example.com",
        "subject": "Welcome John",
        "content": "<h1>Hello John!</h1><p>Welcome to our platform.</p>",
        "sender_name": "Support Team"
      },
      {
        "recipient": "jane@example.com",
        "subject": "Welcome Jane",
        "content": "<h1>Hello Jane!</h1><p>Welcome to our platform.</p>",
        "sender_name": "Support Team"
      }
    ]
  }'
```

### JavaScript Example
```javascript
const response = await fetch('/api/v1/emails/send-bulk-individual', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    emails: [
      {
        recipient: 'john@example.com',
        subject: 'Welcome John',
        content: '<h1>Hello John!</h1><p>Welcome to our platform.</p>',
        sender_name: 'Support Team'
      },
      {
        recipient: 'jane@example.com',
        subject: 'Welcome Jane',
        content: '<h1>Hello Jane!</h1><p>Welcome to our platform.</p>',
        sender_name: 'Support Team'
      }
    ]
  })
});

const result = await response.json();
console.log('Batch ID:', result.batch_id);
console.log('Job ID:', result.job_id);
```

### Python Example
```python
import requests

url = 'https://your-api-domain.com/api/v1/emails/send-bulk-individual'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

data = {
    'emails': [
        {
            'recipient': 'john@example.com',
            'subject': 'Welcome John',
            'content': '<h1>Hello John!</h1><p>Welcome to our platform.</p>',
            'sender_name': 'Support Team'
        },
        {
            'recipient': 'jane@example.com',
            'subject': 'Welcome Jane',
            'content': '<h1>Hello Jane!</h1><p>Welcome to our platform.</p>',
            'sender_name': 'Support Team'
        }
    ]
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

print(f"Batch ID: {result['batch_id']}")
print(f"Job ID: {result['job_id']}")
```

---

## How It Works

1. **Validation**: All email addresses and content are validated
2. **Credit Check**: System checks if you have enough credits for all emails
3. **Credit Deduction**: Credits are deducted upfront for the entire batch
4. **Immediate Response**: API returns immediately with batch and job IDs
5. **Background Processing**: Emails are queued for background processing
6. **Individual Sending**: Each email is sent individually by background workers

---

## Performance & Limits

- **Maximum Emails**: No hard limit (tested with 9000+ emails)
- **Response Time**: Typically under 1 second
- **Processing**: Emails are processed in chunks of 500 for optimal performance
- **Credit Cost**: 1 credit per email
- **Concurrent Processing**: Multiple background workers handle email sending

---

## Monitoring & Tracking

### Batch Tracking
Use the `batch_id` to track all emails in a batch:
```bash
GET /api/v1/emails?batch_id=batch_abc123def456
```

### Job Tracking
Use the `job_id` to monitor background job status (if your system supports it).

### Individual Email Status
Check individual email status using the `message_id`:
```bash
GET /api/v1/emails/{message_id}
```

---

## Best Practices

1. **Batch Size**: For optimal performance, send 100-1000 emails per request
2. **Content Validation**: Validate email content before sending
3. **Error Handling**: Always check the response for validation errors
4. **Credit Management**: Monitor your credit balance before large sends
5. **Rate Limiting**: Respect API rate limits for your account tier

---

## Use Cases

- **Order Confirmations**: Send personalized order confirmations with order details
- **Welcome Emails**: Send customized welcome messages to new users
- **Newsletter Campaigns**: Send personalized newsletters with user-specific content
- **Event Invitations**: Send customized event invitations
- **Account Updates**: Send personalized account status updates
- **Survey Requests**: Send customized survey invitations

---

## Support

For questions or issues with the Bulk Individual Emails API, please contact our support team or refer to the main API documentation.
