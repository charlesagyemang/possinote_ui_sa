'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // Check localStorage directly for token
    const token = localStorage.getItem('api_token');
    
    if (token) {
      window.location.href = '/dashboard';
      return;
    }
    
    setHasToken(false);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (hasToken) {
    return null;
  }

  return <>{children}</>;
} 