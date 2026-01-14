import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { FinanceEntry, BudgetCategory } from './types';

const TREND_LABEL = 'vs last month';

interface FinanceMetric {
  label: string;
  amount: number;
  trend: number;
  trendLabel: string;
  icon: React.ElementType;
  color: string;
}

interface FinanceOverviewProps {
  entries: FinanceEntry[];
  budgets: BudgetCategory[];
}

export function FinanceOverview({ entries = [], budgets = [] }: FinanceOverviewProps) {
  const totalRevenue = entries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = entries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalRevenue - totalExpenses;

  const metrics: FinanceMetric[] = [
    {
      label: 'Total Revenue',
      amount: totalRevenue,
      trend: 20.1,
      trendLabel: TREND_LABEL,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: 'Total Expenses',
      amount: totalExpenses,
      trend: -5.4,
      trendLabel: TREND_LABEL,
      icon: Wallet,
      color: 'text-red-600',
    },
    {
      label: 'Net Profit',
      amount: netProfit,
      trend: 12.5,
      trendLabel: TREND_LABEL,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      label: 'Budget Usage',
      amount: budgets.reduce((sum, b) => sum + b.spent, 0),
      trend: 2.3,
      trendLabel: TREND_LABEL,
      icon: TrendingDown,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.trend > 0;

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{metric.label}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metric.amount.toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <span
                    className={`${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    } flex items-center mr-1`}
                  >
                    {isPositive ? '+' : ''}
                    {metric.trend}%
                  </span>
                  {metric.trendLabel}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              Transaction list placeholder (Graph/Chart coming soon)
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              Expense breakdown placeholder (Pie chart coming soon)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
