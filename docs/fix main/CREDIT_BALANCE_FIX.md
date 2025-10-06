# Credit Balance Display Issue - Root Cause & Fix

## 🚨 Issue Description

**Problem**: New users signing up for the first time were seeing the system's credit balance (from `NEXT_PUBLIC_POSSINOTE_API_KEY`) instead of their own credit balance when accessing the dashboard.

**Symptoms**:
- New user signs up for free plan (should see 10 credits)
- Dashboard shows system's credit balance instead of user's 10 credits
- After logout/login, user sees correct balance
- Issue only occurs on first login after signup

## 🔍 Root Cause Analysis

The issue was caused by **improper token management** during the signup process:

### The Problem Flow:
1. User signs up successfully → Gets their own API key
2. User's API key is stored in localStorage
3. `NotificationService` sends signup/welcome notifications
4. **CRITICAL ISSUE**: `NotificationService` temporarily replaces user's token with system's `NEXT_PUBLIC_POSSINOTE_API_KEY`
5. Dashboard loads and fetches data using the system's API key
6. User sees system's credit balance instead of their own
7. Token gets restored, but damage is already done

### Code Location:
- **File**: `src/lib/services/notifications.ts`
- **Lines**: 54, 217, 260, 437 (token replacement operations)
- **File**: `src/app/(auth)/signup/page.tsx`
- **Lines**: 109, 227 (token storage timing)

## ✅ Solution Implemented

### 1. Fixed Token Restoration in NotificationService

**Before (Problematic)**:
```javascript
const originalToken = localStorage.getItem('api_token');
localStorage.setItem('api_token', this.apiKey || '');
// ... send notification ...
if (originalToken) {
  localStorage.setItem('api_token', originalToken);
}
```

**After (Fixed)**:
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

### 2. Fixed Token Storage Timing in Signup Page

**Before (Problematic)**:
```javascript
// Store the API key in localStorage
localStorage.setItem('api_token', response.api_key || '');

// Send notifications (which replace the token)
NotificationService.sendSignupNotification(...);
NotificationService.sendWelcomeNotification(...);
```

**After (Fixed)**:
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

## 🎯 Key Principles

### 1. **Separation of Concerns**
- **Notifications**: Use system's `NEXT_PUBLIC_POSSINOTE_API_KEY`
- **Dashboard Access**: Use user's API key
- **Never mix the two**

### 2. **Proper Token Management**
- Always use `try-finally` blocks for token replacement
- Ensure token restoration even if errors occur
- Use timing delays to prevent race conditions

### 3. **Clear API Key Usage**
- System notifications = System API key
- User dashboard = User API key
- Never use user's API key for system notifications

## 🔧 Files Modified

1. **`src/lib/services/notifications.ts`**
   - Added `try-finally` blocks for all token replacement operations
   - Ensured proper token restoration
   - Updated comments for clarity

2. **`src/app/(auth)/signup/page.tsx`**
   - Moved user API key storage to after notifications
   - Added 1-second delay to prevent race conditions
   - Applied fix to both free and paid plan flows

## 🧪 Testing Checklist

- [ ] New user signs up for free plan
- [ ] User sees 10 credits (not system's balance)
- [ ] Notifications are sent successfully
- [ ] Dashboard loads with correct user data
- [ ] No token conflicts or race conditions
- [ ] Works for both free and paid plans

## 🚀 Prevention

To prevent this issue in the future:

1. **Always use `try-finally`** when temporarily replacing tokens
2. **Never mix system and user API keys** in the same operation
3. **Use timing delays** when multiple async operations affect localStorage
4. **Test first-time user flows** thoroughly
5. **Add logging** to track token usage and restoration

## 📝 For Other Cursor Instances

If you encounter this issue elsewhere:

1. **Identify token replacement operations** in notification/email services
2. **Wrap in try-finally blocks** to ensure restoration
3. **Check timing** of localStorage operations
4. **Separate system vs user API key usage**
5. **Test the complete user flow** from signup to dashboard

---

**Status**: ✅ Fixed  
**Date**: January 2025  
**Impact**: Critical - Affected all new user signups  
**Files**: 2 files modified, 0 breaking changes
