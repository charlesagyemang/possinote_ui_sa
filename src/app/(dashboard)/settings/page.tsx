'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your account settings</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Account Settings</h3>
            <p className="text-gray-400">
              Account settings and preferences will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 