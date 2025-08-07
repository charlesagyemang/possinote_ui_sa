'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, DollarSign, Calendar } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing</h1>
        <p className="text-gray-400 mt-2">Manage your billing and subscription</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Billing Management</h3>
            <p className="text-gray-400">
              Billing and subscription management features will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 