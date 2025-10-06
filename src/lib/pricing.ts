// Pricing configuration from environment variables
export const PRICING_CONFIG = {
  // Credit rates per credit (in South African Rand)
  EMAIL_CREDIT_RATE: parseFloat(process.env.NEXT_PUBLIC_EMAIL_CREDIT_RATE || '0.02'),
  GENERAL_CREDIT_RATE: parseFloat(process.env.NEXT_PUBLIC_GENERAL_CREDIT_RATE || '0.10'),
  
  // Plan prices (in South African Rand)
  STARTER_PLAN_PRICE: parseFloat(process.env.NEXT_PUBLIC_STARTER_PLAN_PRICE || '99'),
  BUSINESS_PLAN_PRICE: parseFloat(process.env.NEXT_PUBLIC_BUSINESS_PLAN_PRICE || '399'),
  ENTERPRISE_PLAN_PRICE: parseFloat(process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_PRICE || '799'),
} as const;

// Helper functions for pricing calculations
export const calculateEmailCost = (credits: number): number => {
  return credits * PRICING_CONFIG.EMAIL_CREDIT_RATE;
};

export const calculateGeneralCost = (credits: number): number => {
  return credits * PRICING_CONFIG.GENERAL_CREDIT_RATE;
};

// Format pricing for display
export const formatPricingHint = (creditType: 'email' | 'general'): string => {
  const rates = {
    email: PRICING_CONFIG.EMAIL_CREDIT_RATE * 100,
    general: PRICING_CONFIG.GENERAL_CREDIT_RATE * 100,
  };
  
  return `R${rates[creditType].toFixed(0)} = 100 ${creditType.toUpperCase()} credits`;
};

// Get all pricing hints
export const getPricingHints = () => ({
  email: formatPricingHint('email'),
  general: formatPricingHint('general'),
});
