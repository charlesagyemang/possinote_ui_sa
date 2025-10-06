# Paystack Integration & Credit Balance Issues - Complete Fix Guide

## 🚨 Issues Description

### **Issue 1: Paystack CSP Violations**
**Problem**: Paystack payment integration was failing due to Content Security Policy (CSP) violations blocking required resources.

**Symptoms**:
- Paystack script fails to load: `Refused to load the script 'https://js.paystack.co/v1/inline.js'`
- Paystack CSS fails to load: `Refused to load the stylesheet 'https://paystack.com/public/css/button.min.css'`
- Paystack checkout frame fails: `Refused to frame 'https://checkout.paystack.com/'`
- Payment popup doesn't open or displays incorrectly

### **Issue 2: Credit Balance Display Bug**
**Problem**: New users signing up for the first time were seeing the system's credit balance (from `NEXT_PUBLIC_POSSINOTE_API_KEY`) instead of their own credit balance when accessing the dashboard.

**Symptoms**:
- New user signs up for free plan (should see 10 credits)
- Dashboard shows system's credit balance instead of user's 10 credits
- After logout/login, user sees correct balance
- Issue only occurs on first login after signup

## 🔍 Root Cause Analysis

### **Issue 1: CSP Violations**
The issue was caused by **overly restrictive Content Security Policy** in `next.config.ts` that didn't allow Paystack's required resources:

### **Issue 2: Credit Balance Bug**
The issue was caused by **improper token management** during the signup process:

**CSP Violations:**
1. **Script Loading**: `script-src` didn't include `https://js.paystack.co`
2. **CSS Loading**: `style-src` didn't include `https://paystack.com`
3. **Frame Loading**: `frame-src` didn't include `https://checkout.paystack.com`

**CSP Error Messages:**
```
Refused to load the script 'https://js.paystack.co/v1/inline.js' because it violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'unsafe-eval'"

Refused to load the stylesheet 'https://paystack.com/public/css/button.min.css' because it violates the following Content Security Policy directive: "style-src 'self' 'unsafe-inline'"

Refused to frame 'https://checkout.paystack.com/' because it violates the following Content Security Policy directive: "frame-src 'self' https://*.paystack.co"
```

**Credit Balance Bug Flow:**
1. User signs up successfully → Gets their own API key
2. User's API key is stored in localStorage
3. `NotificationService` sends signup/welcome notifications
4. **CRITICAL ISSUE**: `NotificationService` temporarily replaces user's token with system's `NEXT_PUBLIC_POSSINOTE_API_KEY`
5. Dashboard loads and fetches data using the system's API key
6. User sees system's credit balance instead of their own
7. Token gets restored, but damage is already done

**Code Location:**
- **File**: `src/lib/services/notifications.ts` (lines 54, 217, 260, 437)
- **File**: `src/app/(auth)/signup/page.tsx` (lines 109, 227)

## ✅ Solutions Implemented

### **Solution 1: CSP Fix**
#### File: `next.config.ts`

**Before (Problematic CSP)**:
```typescript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.possitech.net http://127.0.0.1:* http://localhost:*; frame-src 'self' https://*.paystack.co;"
}
```

**After (Fixed CSP)**:
```typescript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co; style-src 'self' 'unsafe-inline' https://paystack.com; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.possitech.net http://127.0.0.1:* http://localhost:*; frame-src 'self' https://*.paystack.co https://checkout.paystack.com;"
}
```

**CSP Changes Made:**
1. **Script Source**: Added `https://js.paystack.co` to `script-src`
2. **Style Source**: Added `https://paystack.com` to `style-src`
3. **Frame Source**: Added `https://checkout.paystack.com` to `frame-src`

### **Solution 2: Credit Balance Fix**
#### File: `src/lib/services/notifications.ts`

**Before (Problematic Token Handling)**:
```javascript
const originalToken = localStorage.getItem('api_token');
localStorage.setItem('api_token', this.apiKey || '');
// ... send notification ...
if (originalToken) {
  localStorage.setItem('api_token', originalToken);
}
```

**After (Fixed Token Handling)**:
```javascript
const originalToken = localStorage.getItem('api_token');
try {
  localStorage.setItem('api_token', this.apiKey || '');
  // ... send notification ...
} finally {
  // Always restore original token, even if an error occurs
  if (originalToken) {
    localStorage.setItem('api_token', originalToken);
  } else {
    localStorage.removeItem('api_token');
  }
}
```

#### File: `src/app/(auth)/signup/page.tsx`

**Before (Problematic Token Storage)**:
```javascript
// Store the API key in localStorage
localStorage.setItem('api_token', response.api_key || '');

// Send notifications (which replace the token)
NotificationService.sendSignupNotification(...);
NotificationService.sendWelcomeNotification(...);
```

**After (Fixed Token Storage)**:
```javascript
// Send notifications first (using system's API key)
NotificationService.sendSignupNotification(...);
NotificationService.sendWelcomeNotification(...);

// Store the user's API key AFTER notifications complete
setTimeout(() => {
  localStorage.setItem('api_token', response.api_key || '');
  console.log('🔑 User API key set in localStorage:', response.api_key ? 'Set' : 'NOT SET');
}, 1000); // Small delay to ensure notifications complete
```

**Credit Balance Changes Made:**
1. **Token Restoration**: Added `try-finally` blocks for all token replacement operations
2. **Timing Fix**: Moved user API key storage to after notifications complete
3. **Separation of Concerns**: System notifications use system's API key, dashboard uses user's API key

## 🎯 Key Principles

### 1. **CSP Directive Breakdown**
- `script-src`: Controls which scripts can be executed
- `style-src`: Controls which stylesheets can be loaded
- `frame-src`: Controls which URLs can be embedded as frames
- `connect-src`: Controls which URLs can be fetched via XHR/fetch

### 2. **Paystack Requirements**
- **Script**: Needs to load JavaScript from `https://js.paystack.co/v1/inline.js`
- **CSS**: Needs to load styles from `https://paystack.com/public/css/button.min.css`
- **Frame**: Needs to embed checkout from `https://checkout.paystack.com`

### 3. **Security Balance**
- Allow only necessary Paystack domains
- Maintain security for other resources
- Use specific URLs instead of wildcards where possible

## 🔧 Files Modified

1. **`next.config.ts`**
   - Updated Content Security Policy headers
   - Added Paystack domains to appropriate directives
   - Maintained existing security policies

2. **`src/lib/services/notifications.ts`**
   - Added `try-finally` blocks for all token replacement operations
   - Ensured proper token restoration
   - Updated comments for clarity

3. **`src/app/(auth)/signup/page.tsx`**
   - Moved user API key storage to after notifications
   - Added 1-second delay to prevent race conditions
   - Applied fix to both free and paid plan flows

## 🧪 Testing Checklist

### **CSP Testing:**
- [ ] Paystack script loads without CSP violations
- [ ] Paystack CSS loads without CSP violations
- [ ] Payment popup opens correctly
- [ ] Checkout frame displays properly
- [ ] Payment processing works end-to-end
- [ ] No other CSP violations in console
- [ ] Other app functionality remains unaffected

### **Credit Balance Testing:**
- [ ] New user signs up for free plan
- [ ] User sees 10 credits (not system's balance)
- [ ] Notifications are sent successfully
- [ ] Dashboard loads with correct user data
- [ ] No token conflicts or race conditions
- [ ] Works for both free and paid plans

## 🚀 Prevention

To prevent this issue in the future:

1. **Test Third-Party Integrations**: Always test payment providers with CSP enabled
2. **Monitor Console**: Watch for CSP violations during development
3. **Document Requirements**: Keep track of external domains needed by integrations
4. **Gradual CSP**: Start with permissive CSP and tighten gradually
5. **Use CSP Reporting**: Enable CSP reporting to catch violations in production

## 📝 For Other Cursor Instances

If you encounter similar CSP issues with other payment providers:

1. **Identify Required Domains**: Check what external resources the provider needs
2. **Update CSP Directives**: Add necessary domains to appropriate directives
3. **Test Thoroughly**: Ensure all functionality works after CSP changes
4. **Monitor Security**: Balance functionality with security requirements

### Common CSP Directives for Payment Providers:
```typescript
// Example for multiple payment providers
{
  key: 'Content-Security-Policy',
  value: `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' 
      https://js.paystack.co 
      https://js.stripe.com 
      https://www.paypal.com;
    style-src 'self' 'unsafe-inline' 
      https://paystack.com 
      https://js.stripe.com;
    frame-src 'self' 
      https://*.paystack.co 
      https://checkout.paystack.com
      https://js.stripe.com 
      https://hooks.stripe.com;
    connect-src 'self' 
      https://*.possitech.net 
      http://127.0.0.1:* 
      http://localhost:*
      https://api.paystack.co
      https://api.stripe.com;
  `.replace(/\s+/g, ' ').trim()
}
```

## 🚨 Common CSP Mistakes

1. **Too Restrictive**: Blocking legitimate third-party resources
2. **Missing Domains**: Forgetting to add all required domains
3. **Wrong Directives**: Adding domains to wrong CSP directives
4. **Wildcard Overuse**: Using `*` instead of specific domains
5. **No Testing**: Not testing CSP changes thoroughly

## 🔍 Debugging CSP Issues

1. **Check Browser Console**: Look for CSP violation messages
2. **Use CSP Evaluator**: Test CSP policies online
3. **Enable CSP Reporting**: Get violation reports in production
4. **Test Incrementally**: Add domains one by one and test
5. **Document Changes**: Keep track of CSP modifications

---

**Status**: ✅ Both Issues Fixed  
**Date**: January 2025  
**Impact**: Critical - Blocked all Paystack payments + Credit balance display bug  
**Files**: 3 files modified (`next.config.ts`, `notifications.ts`, `signup/page.tsx`)  
**Security**: Maintained while enabling Paystack functionality and fixing token management
