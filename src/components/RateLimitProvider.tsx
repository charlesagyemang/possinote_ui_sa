'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import RateLimitModal from './RateLimitModal';

interface RateLimitInfo {
  retryAfter: number;
  timestamp: number;
  message: string;
}

interface RateLimitContextType {
  showRateLimit: (info: RateLimitInfo) => void;
  hideRateLimit: () => void;
  isRateLimited: boolean;
  rateLimitInfo: RateLimitInfo | null;
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

export function useRateLimit() {
  const context = useContext(RateLimitContext);
  if (context === undefined) {
    throw new Error('useRateLimit must be used within a RateLimitProvider');
  }
  return context;
}

interface RateLimitProviderProps {
  children: ReactNode;
}

export function RateLimitProvider({ children }: RateLimitProviderProps) {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

  useEffect(() => {
    // Check for existing rate limit info on mount
    const storedRateLimit = localStorage.getItem('rate_limit_info');
    if (storedRateLimit) {
      try {
        const info = JSON.parse(storedRateLimit);
        const elapsed = Math.floor((Date.now() - info.timestamp) / 1000);
        
        if (elapsed < info.retryAfter) {
          // Still rate limited
          setRateLimitInfo(info);
          setIsRateLimited(true);
        } else {
          // Rate limit expired, clear storage
          localStorage.removeItem('rate_limit_info');
        }
      } catch (error) {
        console.error('Failed to parse stored rate limit info:', error);
        localStorage.removeItem('rate_limit_info');
      }
    }

    // Listen for rate limit events
    const handleRateLimit = (event: CustomEvent) => {
      const info = event.detail;
      setRateLimitInfo(info);
      setIsRateLimited(true);
    };

    window.addEventListener('rate-limit-exceeded', handleRateLimit as EventListener);

    return () => {
      window.removeEventListener('rate-limit-exceeded', handleRateLimit as EventListener);
    };
  }, []);

  const showRateLimit = (info: RateLimitInfo) => {
    setRateLimitInfo(info);
    setIsRateLimited(true);
  };

  const hideRateLimit = () => {
    setIsRateLimited(false);
    setRateLimitInfo(null);
    localStorage.removeItem('rate_limit_info');
  };

  const handleRetry = () => {
    // This will be called when the user clicks retry after the timer expires
    hideRateLimit();
    // Optionally, you could trigger a page refresh or specific action here
    window.location.reload();
  };

  return (
    <RateLimitContext.Provider value={{ showRateLimit, hideRateLimit, isRateLimited, rateLimitInfo }}>
      {children}
      <RateLimitModal
        isOpen={isRateLimited}
        onClose={hideRateLimit}
        rateLimitInfo={rateLimitInfo}
        onRetry={handleRetry}
      />
    </RateLimitContext.Provider>
  );
}
