const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:2025/api/v1';
const API_TOKEN = process.env.API_TOKEN || localStorage.getItem('api_token') || localStorage.getItem('api_key');

// SMS payload
const smsPayload = {
  "bulk_sms": {
    "recipients": ["+233277119919", "+541348180"],
    "message": "Jesus",
    "sender_id": "Possitech"
  }
};

async function sendSMS() {
  try {
    console.log('Sending SMS...');
    console.log('Payload:', JSON.stringify(smsPayload, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/sms/bulk`, smsPayload, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ SMS sent successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Failed to send SMS:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the function
sendSMS();
