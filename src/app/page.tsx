'use client';

import { useEffect, useState } from 'react';


export default function HomePage() {

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('api_token');
    
    if (token) {
      // If we have a token, redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      // If no token, redirect to pricing page
      window.location.href = '/pricing';
    }
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Redirecting...</div>
      </div>
    );
  }

  return null;
}
