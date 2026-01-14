import { Card, CardContent } from '../ui/card';
import { BarChart3 } from 'lucide-react';

export function FinanceAnalytics({ analytics: _analytics }: { analytics: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 text-center">
          <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium">Financial Analytics</h3>
          <p className="text-gray-500">Cash flow analysis and profitability trends coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
