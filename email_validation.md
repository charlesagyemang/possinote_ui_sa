# Public Email Validation API

This API allows validating email addresses without authentication before sending them through the messaging system. This is useful for validating emails before charging users on the frontend.

## Endpoint

`POST /public/validate-emails`

## Request Format

The endpoint accepts emails in multiple formats:

### JSON Array Format
```json
{
  "emails": ["user1@example.com", "user2@example.com", "invalid-email"]
}
```

### Comma-separated String Format
```json
{
  "emails": "user1@example.com,user2@example.com,invalid-email"
}
```

### Single String in Array Format
```json
{
  "emails": ["user1@example.com,user2@example.com,invalid-email"]
}
```

## Response Format

```json
{
  "success": true,
  "valid_emails": ["user1@example.com", "user2@example.com"],
  "invalid_emails": ["invalid-email"],
  "total_count": 3,
  "valid_count": 2,
  "invalid_count": 1
}
```

## Error Responses

### No Emails Provided
```json
{
  "success": false,
  "error": "No emails provided for validation"
}
```

### Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

## Rate Limiting

This endpoint is rate-limited to prevent abuse. If you exceed the rate limit, you'll receive a 429 Too Many Requests response.

## Example Usage

### cURL
```bash
curl -X POST https://api.possinotify.com/public/validate-emails \
  -H "Content-Type: application/json" \
  -d '{"emails": ["user1@example.com", "user2@example.com", "invalid-email"]}'
```

### JavaScript
```javascript
fetch('https://api.possinotify.com/public/validate-emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    emails: ['user1@example.com', 'user2@example.com', 'invalid-email']
  }),
})
.then(response => response.json())
.then(data => console.log(data));
```

### Python
```python
import requests

response = requests.post(
    'https://api.possinotify.com/public/validate-emails',
    json={'emails': ['user1@example.com', 'user2@example.com', 'invalid-email']}
)
print(response.json())
```
