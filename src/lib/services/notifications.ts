import { SmsService } from './sms';
import { EmailService } from './email';

interface SignupNotificationData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  planType: string;
  initialCredits: number;
  apiKey?: string;
}

export class NotificationService {
  private static salesPhone = process.env.NEXT_PUBLIC_SALES_PHONE_NUMBER || '+233244123456';
  private static salesEmail = process.env.NEXT_PUBLIC_SALES_EMAIL || 'sales@possitech.com';
  private static smsSenderId = 'Possitech';
  private static apiKey = process.env.NEXT_PUBLIC_POSSINOTE_API_KEY;

  static setSalesContact(phone: string, email: string) {
    this.salesPhone = phone;
    this.salesEmail = email;
  }

  static async sendSignupNotification(data: SignupNotificationData) {
    const results: {
      smsSuccess: boolean;
      emailSuccess: boolean;
      smsError?: string;
      emailError?: string;
    } = {
      smsSuccess: false,
      emailSuccess: false,
      smsError: undefined,
      emailError: undefined
    };

    // Send SMS notification
    try {
      const fullMessage = `New PossiNote Signup! ${data.customerName} from ${data.companyName} signed up for ${data.planType} plan with ${data.initialCredits.toLocaleString()} credits. Email: ${data.customerEmail}`;
      const smsMessage = fullMessage.length > 159 ? fullMessage.substring(0, 159) : fullMessage;
      
      // Use the API key from environment variable
      const originalToken = localStorage.getItem('api_token');
      localStorage.setItem('api_token', this.apiKey || '');
      
      // Try without sender ID first, then with sender ID if that fails
      try {
        await SmsService.sendSms(this.salesPhone, smsMessage);
        results.smsSuccess = true;
        console.log('✅ SMS notification sent successfully (without sender ID)');
      } catch (_senderError) {
        console.log('⚠️ SMS without sender ID failed, trying with sender ID...');
        await SmsService.sendSms(this.salesPhone, smsMessage, this.smsSenderId);
        results.smsSuccess = true;
        console.log('✅ SMS notification sent successfully (with sender ID)');
      }
      
      // Restore original token
      if (originalToken) {
        localStorage.setItem('api_token', originalToken);
      }
    } catch (error) {
      results.smsError = error instanceof Error ? error.message : 'Failed to send SMS';
      console.error('❌ SMS notification failed:', results.smsError);
      
      // Log more details for debugging
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('❌ SMS Error Details:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data
        });
      }
    }

    // Send email notification
    try {
      const subject = `🎉 New PossiNote Signup - ${data.customerName} (${data.planType} Plan)`;
      const content = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New PossiNote Signup</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 10px; }
            .header p { font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .info-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
            .info-label { font-size: 12px; font-weight: 600; color: #667eea; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-value { font-size: 16px; font-weight: 500; margin-top: 8px; color: #333; }
            .plan-badge { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase; }
            .summary-box { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #90caf9; }
            .summary-box h3 { color: #1976d2; font-size: 18px; margin-bottom: 15px; font-weight: 600; }
            .summary-box p { color: #424242; line-height: 1.8; }
            .next-steps { background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #ce93d8; }
            .next-steps h3 { color: #7b1fa2; font-size: 18px; margin-bottom: 15px; font-weight: 600; }
            .next-steps ul { list-style: none; }
            .next-steps li { color: #424242; margin-bottom: 8px; padding-left: 20px; position: relative; }
            .next-steps li:before { content: "✓"; position: absolute; left: 0; color: #7b1fa2; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
            .footer p { color: #6c757d; font-size: 14px; margin-bottom: 5px; }
            .highlight { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffcc02; }
            .highlight h4 { color: #f57c00; font-size: 16px; margin-bottom: 10px; font-weight: 600; }
            @media (max-width: 600px) {
              .info-grid { grid-template-columns: 1fr; }
              .header, .content { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New PossiNote Signup!</h1>
              <p>A new customer has joined the PossiNote family</p>
            </div>
            
            <div class="content">
              <div class="info-grid">
                <div class="info-card">
                  <div class="info-label">Customer Name</div>
                  <div class="info-value">${data.customerName}</div>
                </div>
                
                <div class="info-card">
                  <div class="info-label">Company</div>
                  <div class="info-value">${data.companyName}</div>
                </div>
                
                <div class="info-card">
                  <div class="info-label">Email Address</div>
                  <div class="info-value">${data.customerEmail}</div>
                </div>
                
                <div class="info-card">
                  <div class="info-label">Phone Number</div>
                  <div class="info-value">${data.customerPhone}</div>
                </div>
                
                <div class="info-card">
                  <div class="info-label">Selected Plan</div>
                  <div class="info-value">
                    <span class="plan-badge">${data.planType.toUpperCase()}</span>
                  </div>
                </div>
                
                <div class="info-card">
                  <div class="info-label">Initial Credits</div>
                  <div class="info-value">${data.initialCredits.toLocaleString()} credits</div>
                </div>
              </div>
              
              <div class="summary-box">
                <h3>📊 Signup Summary</h3>
                <p>
                  <strong>${data.customerName}</strong> from <strong>${data.companyName}</strong> has successfully signed up for the 
                  <strong>${data.planType}</strong> plan with <strong>${data.initialCredits.toLocaleString()} initial credits</strong>.
                  This represents a great opportunity for potential growth and engagement.
                </p>
              </div>
              
              <div class="highlight">
                <h4>💰 Revenue Opportunity</h4>
                <p>
                  <strong>Plan Value:</strong> ${data.planType === 'free' ? 'Free Trial' : data.planType === 'starter' ? '₵80' : '₵800'} | 
                  <strong>Potential Monthly:</strong> ${data.planType === 'free' ? '₵0' : data.planType === 'starter' ? '₵80' : '₵800'}
                </p>
              </div>
              
              <div class="next-steps">
                <h3>🎯 Recommended Next Steps</h3>
                <ul>
                  <li>Send a personalized welcome email within 24 hours</li>
                  <li>Offer onboarding assistance and demo call</li>
                  <li>Monitor their usage patterns and engagement</li>
                  <li>Follow up after 7 days to ensure satisfaction</li>
                  <li>Consider upselling opportunities based on usage</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>PossiNote Sales Team</strong></p>
              <p>This notification was sent automatically by the PossiNote system</p>
              <p>Signup Time: ${new Date().toLocaleString('en-GH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                timeZoneName: 'short'
              })}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Use the API key from environment variable
      const originalToken = localStorage.getItem('api_token');
      localStorage.setItem('api_token', this.apiKey || '');
      
      await EmailService.sendEmail(this.salesEmail, subject, content, 'PossiNote System');
      results.emailSuccess = true;
      console.log('✅ Email notification sent successfully');
      
      // Restore original token
      if (originalToken) {
        localStorage.setItem('api_token', originalToken);
      }
    } catch (error) {
      results.emailError = error instanceof Error ? error.message : 'Failed to send email';
      console.error('❌ Email notification failed:', results.emailError);
    }

    return results;
  }

  static async sendWelcomeNotification(data: SignupNotificationData) {
    const results: {
      smsSuccess: boolean;
      emailSuccess: boolean;
      smsError?: string;
      emailError?: string;
    } = {
      smsSuccess: false,
      emailSuccess: false,
      smsError: undefined,
      emailError: undefined
    };

    // Send welcome SMS to customer
    try {
      const welcomeSms = `Welcome to PossiNote! Your account is ready with ${data.initialCredits.toLocaleString()} credits. Start sending SMS and emails instantly. Visit dashboard to get started.`;
      const smsMessage = welcomeSms.length > 159 ? welcomeSms.substring(0, 159) : welcomeSms;
      
      // Use the API key from environment variable
      const originalToken = localStorage.getItem('api_token');
      localStorage.setItem('api_token', this.apiKey || '');
      
      // Try without sender ID first, then with sender ID if that fails
      try {
        await SmsService.sendSms(data.customerPhone, smsMessage);
        results.smsSuccess = true;
        console.log('✅ Welcome SMS sent successfully (without sender ID)');
      } catch (_senderError) {
        console.log('⚠️ Welcome SMS without sender ID failed, trying with sender ID...');
        await SmsService.sendSms(data.customerPhone, smsMessage, this.smsSenderId);
        results.smsSuccess = true;
        console.log('✅ Welcome SMS sent successfully (with sender ID)');
      }
      
      // Restore original token
      if (originalToken) {
        localStorage.setItem('api_token', originalToken);
      }
    } catch (error) {
      results.smsError = error instanceof Error ? error.message : 'Failed to send welcome SMS';
      console.error('❌ Welcome SMS failed:', results.smsError);
    }

    // Send welcome email to customer
    try {
      const subject = `🎉 Welcome to PossiNote, ${data.customerName}!`;
      const content = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to PossiNote</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 10px; }
            .header p { font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .welcome-box { background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); padding: 30px; border-radius: 12px; margin: 30px 0; border: 1px solid #81c784; }
            .welcome-box h2 { color: #2e7d32; font-size: 24px; margin-bottom: 15px; font-weight: 600; }
            .welcome-box p { color: #1b5e20; line-height: 1.8; font-size: 16px; }
            .account-details { background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #667eea; }
            .account-details h3 { color: #667eea; font-size: 18px; margin-bottom: 20px; font-weight: 600; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef; }
            .detail-row:last-child { border-bottom: none; margin-bottom: 0; }
            .detail-label { font-weight: 600; color: #495057; }
            .detail-value { color: #333; }
            .plan-badge { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
            .cta-section { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 30px; border-radius: 12px; margin: 30px 0; border: 1px solid #ffcc02; text-align: center; }
            .cta-section h3 { color: #f57c00; font-size: 20px; margin-bottom: 15px; font-weight: 600; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-top: 15px; }
            .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .feature { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
            .feature-icon { font-size: 24px; margin-bottom: 10px; }
            .feature h4 { color: #495057; font-size: 16px; margin-bottom: 8px; font-weight: 600; }
            .feature p { color: #6c757d; font-size: 14px; }
            .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
            .footer p { color: #6c757d; font-size: 14px; margin-bottom: 5px; }
            @media (max-width: 600px) {
              .features { grid-template-columns: 1fr; }
              .header, .content { padding: 20px; }
              .detail-row { flex-direction: column; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to PossiNote!</h1>
              <p>Your account is ready to go</p>
            </div>
            
            <div class="content">
              <div class="welcome-box">
                <h2>Hello ${data.customerName}! 👋</h2>
                <p>
                  Welcome to PossiNote! We're excited to have you on board. Your account has been successfully created and you're ready to start sending SMS and email notifications to your customers.
                </p>
              </div>
              
              <div class="account-details">
                <h3>📋 Your Account Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Company:</span>
                  <span class="detail-value">${data.companyName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Plan:</span>
                  <span class="detail-value"><span class="plan-badge">${data.planType.toUpperCase()}</span></span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Initial Credits:</span>
                  <span class="detail-value">${data.initialCredits.toLocaleString()} credits</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Account Status:</span>
                  <span class="detail-value">✅ Active & Ready</span>
                </div>
              </div>
              
              ${data.apiKey ? `
              <div class="account-details" style="background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%); border-left: 4px solid #ff9800;">
                <h3 style="color: #f57c00;">🔑 Your API Key (Login Credential)</h3>
                <p style="color: #e65100; margin-bottom: 15px; font-size: 14px;">
                  <strong>Important:</strong> Use this API key to log into your PossiNote dashboard. Keep it safe and secure!
                </p>
                <div style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 12px; word-break: break-all; margin-bottom: 15px;">
                  ${data.apiKey}
                </div>
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                  <h4 style="color: #2e7d32; margin-bottom: 10px; font-size: 16px;">🔐 How to Login:</h4>
                  <ol style="color: #1b5e20; margin: 0; padding-left: 20px;">
                    <li>Go to <a href="https://possinote.com/login" style="color: #2e7d32; text-decoration: underline;">possinote.com/login</a></li>
                    <li>Click on "Login with API Key"</li>
                    <li>Paste your API key above</li>
                    <li>You'll be redirected to your dashboard</li>
                  </ol>
                </div>
              </div>
              ` : ''}
              
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">📱</div>
                  <h4>SMS Notifications</h4>
                  <p>Send instant SMS messages to your customers with delivery tracking</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">📧</div>
                  <h4>Email Campaigns</h4>
                  <p>Create beautiful email templates and send bulk campaigns</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">📊</div>
                  <h4>Analytics</h4>
                  <p>Track delivery rates, open rates, and engagement metrics</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">🔧</div>
                  <h4>API Integration</h4>
                  <p>Integrate with your existing systems via our powerful API</p>
                </div>
              </div>
              
              <div class="cta-section">
                <h3>🚀 Ready to Get Started?</h3>
                <p>Your dashboard is ready with all the tools you need to start sending notifications right away.</p>
                <a href="https://possinote.com/dashboard" class="cta-button">Go to Dashboard</a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>PossiNote Team</strong></p>
              <p>Thank you for choosing PossiNote for your notification needs</p>
              <p>Need help? Contact us at support@possinote.com</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Use the API key from environment variable
      const originalToken = localStorage.getItem('api_token');
      localStorage.setItem('api_token', this.apiKey || '');
      
      await EmailService.sendEmail(data.customerEmail, subject, content, 'PossiNote Team');
      results.emailSuccess = true;
      console.log('✅ Welcome email sent successfully');
      
      // Restore original token
      if (originalToken) {
        localStorage.setItem('api_token', originalToken);
      }
    } catch (error) {
      results.emailError = error instanceof Error ? error.message : 'Failed to send welcome email';
      console.error('❌ Welcome email failed:', results.emailError);
    }

    return results;
  }
}
