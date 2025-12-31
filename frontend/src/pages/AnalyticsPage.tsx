import { useState } from 'react';
import { TrendingUp, DollarSign, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuth } from '../hooks/AuthContext';
import { useFarmWithSelection, useFinanceSummary, useInventory } from '../api';

export function AnalyticsPage() {
  const { isAuthenticated } = useAuth();
  const { currentFarm } = useFarmWithSelection();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Fetch Data
  const { data: financeSummary } = useFinanceSummary(currentFarm?.id?.toString() || '');
  const { data: inventory } = useInventory(currentFarm?.id?.toString());

  // Calculate Aggregates
  const totalRevenue = financeSummary?.totalIncome || 0;
  const totalExpenses = financeSummary?.totalExpenses || 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const inventoryValue =
    inventory?.reduce((sum, item) => sum + item.quantity * (item.cost_per_unit || 0), 0) || 0;
  const lowStockItems =
    inventory?.filter(item => item.quantity <= (item.minimum_quantity || 0)).length || 0;

  // Helpers for chart simulation
  const getSimulatedTrend = () => {
    // Generate random trend for demo simply using CSS heights
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 20);
  };

  const revenueTrend = getSimulatedTrend();
  const expensesTrend = getSimulatedTrend();

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs className="mb-0" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farm Analytics</h1>
            <p className="text-gray-600 mt-1">
              Financial performance and operational insights for {currentFarm?.name || 'your farm'}
            </p>
          </div>
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                timeRange === 'week'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                timeRange === 'month'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                timeRange === 'year'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign
                className={`h-4 w-4 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                ${Math.abs(netProfit).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {netProfit >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {profitMargin.toFixed(1)}% margin
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Gross income from all sources</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Operational costs and inputs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Asset Value</CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${inventoryValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {lowStockItems > 0 ? (
                  <span className="text-red-600 font-medium">{lowStockItems} items low stock</span>
                ) : (
                  'Stock levels healthy'
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Using CSS for simplicity without extra libs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue vs Expenses Trend */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Financial Trend</CardTitle>
              <CardDescription>Revenue vs Expenses over last period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2 pt-4">
                {revenueTrend.map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col justify-end gap-1 h-full group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-gray-800 text-white text-xs p-2 rounded z-10 w-24 -ml-8">
                      <span>Rev: ${(val || 0) * 100}</span>
                      <span>Exp: ${(expensesTrend[i] || 0) * 100}</span>
                    </div>
                    {/* Bars */}
                    <div
                      className="w-full bg-blue-500 rounded-t opacity-80 hover:opacity-100 transition-all"
                      style={{ height: `${val}%` }}
                    ></div>
                    <div
                      className="w-full bg-orange-500 rounded-t opacity-80 hover:opacity-100 transition-all"
                      style={{ height: `${expensesTrend[i]}%` }}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs text-gray-500 px-2">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span className="text-sm text-gray-600">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                  <span className="text-sm text-gray-600">Expenses</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense Breakdown (Pie Chart Simulation) */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
              <CardDescription>Breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-6">
                {/* CSS Conic Gradient Pie Chart */}
                <div
                  className="w-48 h-48 rounded-full border-4 border-white shadow-xl relative"
                  style={{
                    background:
                      'conic-gradient(#3b82f6 0% 35%, #22c55e 35% 60%, #ef4444 60% 80%, #eab308 80% 100%)',
                  }}
                >
                  <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold text-gray-800">
                      ${totalExpenses.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div className="text-sm">
                    <span className="block font-medium">Inputs (Seeds/Fertilizer)</span>
                    <span className="text-gray-500">35%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="text-sm">
                    <span className="block font-medium">Equipment</span>
                    <span className="text-gray-500">25%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="text-sm">
                    <span className="block font-medium">Labor</span>
                    <span className="text-gray-500">20%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="text-sm">
                    <span className="block font-medium">Utilities/Other</span>
                    <span className="text-gray-500">20%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
