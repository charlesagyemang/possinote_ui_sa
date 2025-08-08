'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import PaymentRequiredModal from './PaymentRequiredModal';

interface PaymentRequiredContextType {
  showPaymentRequired: (message?: string, redirectUrl?: string) => void;
  hidePaymentRequired: () => void;
  isPaymentRequired: boolean;
}

const PaymentRequiredContext = createContext<PaymentRequiredContextType | undefined>(undefined);

export function usePaymentRequired() {
  const context = useContext(PaymentRequiredContext);
  if (context === undefined) {
    throw new Error('usePaymentRequired must be used within a PaymentRequiredProvider');
  }
  return context;
}

interface PaymentRequiredProviderProps {
  children: ReactNode;
}

export function PaymentRequiredProvider({ children }: PaymentRequiredProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('Insufficient credits. Please reload your account to continue.');
  const [redirectUrl, setRedirectUrl] = useState('/billing');

  const showPaymentRequired = (msg?: string, url?: string) => {
    if (msg) setMessage(msg);
    if (url) setRedirectUrl(url);
    setIsOpen(true);
  };

  const hidePaymentRequired = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    // Check if there's a stored payment required state on mount
    const paymentRequired = localStorage.getItem('payment_required');
    const timestamp = localStorage.getItem('payment_required_timestamp');
    
    if (paymentRequired && timestamp) {
      const timeDiff = Date.now() - parseInt(timestamp);
      // Only show if the error was recent (within last 5 minutes)
      if (timeDiff < 5 * 60 * 1000) {
        showPaymentRequired();
      } else {
        // Clear old state
        localStorage.removeItem('payment_required');
        localStorage.removeItem('payment_required_timestamp');
      }
    }

    // Listen for payment-required events
    const handlePaymentRequired = (event: CustomEvent) => {
      const { message: msg, redirectUrl: url } = event.detail;
      showPaymentRequired(msg, url);
    };

    window.addEventListener('payment-required', handlePaymentRequired as EventListener);

    return () => {
      window.removeEventListener('payment-required', handlePaymentRequired as EventListener);
    };
  }, []);

  const value = {
    showPaymentRequired,
    hidePaymentRequired,
    isPaymentRequired: isOpen,
  };

  return (
    <PaymentRequiredContext.Provider value={value}>
      {children}
      <PaymentRequiredModal
        isOpen={isOpen}
        onClose={hidePaymentRequired}
        message={message}
        redirectUrl={redirectUrl}
      />
    </PaymentRequiredContext.Provider>
  );
}
