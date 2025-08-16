// Pricing configuration from environment variables
export const PRICING_CONFIG = {
  // Credit rates per credit (in Ghanaian Cedi)
  SMS_CREDIT_RATE: parseFloat(process.env.NEXT_PUBLIC_SMS_CREDIT_RATE || '0.07'),
  EMAIL_CREDIT_RATE: parseFloat(process.env.NEXT_PUBLIC_EMAIL_CREDIT_RATE || '0.02'),
  
  // Plan prices (in Ghanaian Cedi)
  STARTER_PLAN_PRICE: parseFloat(process.env.NEXT_PUBLIC_STARTER_PLAN_PRICE || '99'),
  BUSINESS_PLAN_PRICE: parseFloat(process.env.NEXT_PUBLIC_BUSINESS_PLAN_PRICE || '399'),
  ENTERPRISE_PLAN_PRICE: parseFloat(process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_PRICE || '799'),
} as const;

// Helper functions for pricing calculations
export const calculateSmsCost = (credits: number): number => {
  return credits * PRICING_CONFIG.SMS_CREDIT_RATE;
};

export const calculateEmailCost = (credits: number): number => {
  return credits * PRICING_CONFIG.EMAIL_CREDIT_RATE;
};

export const calculateGeneralCost = (credits: number): number => {
  return credits * PRICING_CONFIG.GENERAL_CREDIT_RATE;
};

export const calculateBulkCost = (smsCredits: number, emailCredits: number): number => {
  return calculateSmsCost(smsCredits) + calculateEmailCost(emailCredits);
};

// Format pricing for display
export const formatPricingHint = (creditType: 'sms' | 'email' | 'general'): string => {
  const rates = {
    sms: PRICING_CONFIG.SMS_CREDIT_RATE * 100,
    email: PRICING_CONFIG.EMAIL_CREDIT_RATE * 100,
    general: PRICING_CONFIG.GENERAL_CREDIT_RATE * 100,
  };
  
  return `₵${rates[creditType].toFixed(0)} = 100 ${creditType.toUpperCase()} credits`;
};

// Get all pricing hints
export const getPricingHints = () => ({
  sms: formatPricingHint('sms'),
  email: formatPricingHint('email'),
  general: formatPricingHint('general'),
});
