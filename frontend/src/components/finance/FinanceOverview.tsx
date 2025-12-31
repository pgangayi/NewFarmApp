import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { FinanceEntry, BudgetCategory } from './types';

interface FinanceOverviewProps {
  entries: FinanceEntry[];
  budgets: BudgetCategory[];
}

export function FinanceOverview({ entries, budgets }: FinanceOverviewProps) {
  // Calculate summary statistics
  const totalRevenue =
    entries
      ?.filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0) || 0;
  const totalExpenses =
    entries
      ?.filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0) || 0;
  const totalInvestments =
    entries
      ?.filter(entry => entry.type === 'investment')
      .reduce((sum, entry) => sum + entry.amount, 0) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const grossMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From all farms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Operating costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              ${netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">After expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
            <PieChart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {grossMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Profit margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Trends</CardTitle>
          <CardDescription>Monthly income vs expenses over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Cash flow chart would go here</p>
              <p className="text-sm text-gray-500">Integration with charting library needed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgets?.slice(0, 5).map(budget => {
                const spentPercentage = (budget.spent_amount / budget.budgeted_amount) * 100;
                return (
                  <div key={budget.id}>
                    <div className="flex justify-between text-sm">
                      <span>{budget.category_name}</span>
                      <span>
                        ${budget.spent_amount.toLocaleString()} / $
                        {budget.budgeted_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          spentPercentage > 100
                            ? 'bg-red-500'
                            : spentPercentage > 80
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Profitability</span>
                <span
                  className={`text-sm font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {grossMargin.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Budget Utilization</span>
                <span className="text-sm font-medium">
                  {budgets && budgets.length > 0
                    ? Math.round(
                        (budgets.reduce((sum, b) => sum + b.spent_amount / b.budgeted_amount, 0) /
                          budgets.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tax Deductible</span>
                <span className="text-sm font-medium">
                  $
                  {entries?.filter(e => e.tax_deductible).reduce((sum, e) => sum + e.amount, 0) ||
                    0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
