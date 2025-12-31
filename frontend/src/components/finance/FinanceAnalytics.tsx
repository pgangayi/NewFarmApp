import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

// Define the shape of the analytics data
interface AnalyticsData {
  cash_flow?: {
    total_in: number;
    total_out: number;
    net_flow: number;
  };
  profitability?: {
    gross_profit: number;
    profit_margin: number;
  };
}

interface FinanceAnalyticsProps {
  analytics: AnalyticsData | null;
}

export function FinanceAnalytics({ analytics }: FinanceAnalyticsProps) {
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Financial Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Inflow</span>
                <span className="text-lg font-bold text-green-600">
                  ${analytics.cash_flow?.total_in?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Outflow</span>
                <span className="text-lg font-bold text-red-600">
                  ${analytics.cash_flow?.total_out?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm">Net Cash Flow</span>
                <span
                  className={`text-lg font-bold ${
                    (analytics.cash_flow?.net_flow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ${analytics.cash_flow?.net_flow?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profitability Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Gross Profit</span>
                <span className="text-lg font-bold">
                  ${analytics.profitability?.gross_profit?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Profit Margin</span>
                <span className="text-lg font-bold">
                  {(analytics.profitability?.profit_margin || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
