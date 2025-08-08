'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard, RefreshCw, X } from 'lucide-react';

interface PaymentRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  redirectUrl?: string;
}

export default function PaymentRequiredModal({ 
  isOpen, 
  onClose, 
  message = 'Insufficient credits. Please reload your account to continue.',
  redirectUrl = '/billing'
}: PaymentRequiredModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleReload = () => {
    setIsRedirecting(true);
    // Clear the payment required state
    localStorage.removeItem('payment_required');
    localStorage.removeItem('payment_required_timestamp');
    
    // Redirect to billing page
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 500);
  };

  const handleDismiss = () => {
    onClose();
    // Clear the payment required state
    localStorage.removeItem('payment_required');
    localStorage.removeItem('payment_required_timestamp');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-gradient-to-br from-red-900/90 to-red-800/90 border-red-500/30 backdrop-blur-xl rounded-3xl max-w-md w-full shadow-2xl shadow-red-500/20">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-red-500/20 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            
            <CardTitle className="text-white text-xl font-bold">
              Payment Required
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-gray-300 text-sm leading-relaxed">
              {message}
            </p>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <div className="flex items-center space-x-2 text-red-300 text-sm">
                <CreditCard className="h-4 w-4" />
                <span>Your account needs to be reloaded to continue</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleReload}
              disabled={isRedirecting}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl h-12 font-medium shadow-lg shadow-red-500/25 transition-all duration-300"
            >
              {isRedirecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Reload Account
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="w-full border-gray-600 text-gray-300 hover:bg-white/10 rounded-xl h-10"
            >
              Dismiss
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              You can also reload your account from the billing page
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
