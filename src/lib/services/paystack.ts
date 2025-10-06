declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}

export interface PaystackResponse {
  reference: string;
  trans: string;
  status: string;
  message: string;
  transaction: string;
  trxref: string;
}

export interface PaystackConfig {
  key: string;
  email: string;
  amount: number; // Amount in cents (smallest currency unit)
  currency: string;
  ref: string;
  callback: (response: PaystackResponse) => void;
  onClose: () => void;
}

export class PaystackService {
  private static loadPaystackScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Paystack script'));
      document.head.appendChild(script);
    });
  }

  static async initializePayment(config: PaystackConfig): Promise<void> {
    try {
      await this.loadPaystackScript();
      
      const handler = window.PaystackPop.setup({
        key: config.key,
        email: config.email,
        amount: config.amount,
        currency: config.currency,
        ref: config.ref,
        callback: config.callback,
        onClose: config.onClose,
      });
      
      handler.openIframe();
    } catch (error) {
      console.error('Failed to initialize Paystack payment:', error);
      throw error;
    }
  }

  static generateReference(): string {
    return `POSSI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static convertToCents(amount: number): number {
    // Convert amount to cents (smallest currency unit for ZAR)
    return Math.round(amount * 100);
  }
}