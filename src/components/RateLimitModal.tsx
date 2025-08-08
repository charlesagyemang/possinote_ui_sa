'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface RateLimitInfo {
  retryAfter: number;
  timestamp: number;
  message: string;
}

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateLimitInfo: RateLimitInfo | null;
  onRetry: () => void;
}

export default function RateLimitModal({ isOpen, onClose, rateLimitInfo, onRetry }: RateLimitModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!rateLimitInfo) return;

    const calculateTimeRemaining = () => {
      const elapsed = Math.floor((Date.now() - rateLimitInfo.timestamp) / 1000);
      const remaining = Math.max(0, rateLimitInfo.retryAfter - elapsed);
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [rateLimitInfo]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    if (timeRemaining === 0) {
      onRetry();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-xl">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <span>Rate Limit Exceeded</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="p-4 bg-red-500/10 rounded-2xl w-fit mx-auto">
              <Clock className="h-12 w-12 text-red-400" />
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-300">
                {rateLimitInfo?.message || 'Too many requests. Please wait before trying again.'}
              </p>
              
              {timeRemaining > 0 && (
                <div className="flex items-center justify-center space-x-2 text-lg">
                  <span className="text-gray-400">Retry in:</span>
                  <span className="text-white font-mono font-bold">{formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-gray-500/20 border-gray-500/30 text-gray-300 hover:bg-gray-500/30"
            >
              Dismiss
            </Button>
            
            <Button
              onClick={handleRetry}
              disabled={timeRemaining > 0}
              className={`flex-1 flex items-center space-x-2 ${
                timeRemaining > 0
                  ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
