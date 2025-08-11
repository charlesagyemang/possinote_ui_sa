'use client';

import { useAuthStore } from '@/stores/authStore';
import Sidebar from './Sidebar';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToastProvider } from '@/components/ui/toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        
        <div className="lg:pl-72">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1"></div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <div className="flex items-center gap-x-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          <main className="py-10">
            <div className="px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
} 