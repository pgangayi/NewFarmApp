import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search,
  Filter,
  Calendar,
  PieChart,
  BarChart3,
  FileText,
  CreditCard,
  Banknote,
  Receipt,
  Target,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  Download,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface FinanceEntry {
  id: number;
  farm_id: number;
  entry_date: string;
  type: 'income' | 'expense' | 'investment';
  amount: number;
  currency: string;
  account?: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  project_id?: string;
  department?: string;
  tax_category?: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'paid';
  receipt_number?: string;
  recurring_pattern?: string;
  budget_category?: string;
  tax_deductible: boolean;
  bank_account?: string;
  farm_name?: string;
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
}

interface BudgetCategory {
  id: number;
  farm_id: number;
  category_name: string;
  budgeted_amount: number;
  spent_amount: number;
  remaining_budget: number;
  fiscal_year: number;
  description?: string;
  parent_category_id?: number;
  farm_name?: string;
  parent_category_name?: string;
  created_at: string;
  updated_at?: string;
}

interface FinancialReport {
  id: number;
  farm_id: number;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  report_period: string;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  gross_margin: number;
  operating_margin: number;
  cash_flow: number;
  report_data?: string;
  generated_at: string;
}

interface FinanceFormData {
  farm_id: number;
  entry_date: string;
  type: 'income' | 'expense' | 'investment';
  amount: number;
  currency?: string;
  account?: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  project_id?: string;
  department?: string;
  tax_category?: string;
  approval_status?: string;
  receipt_number?: string;
  recurring_pattern?: string;
  budget_category?: string;
  tax_deductible?: boolean;
  bank_account?: string;
}

export function FinancePage() {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'overview' | 'entries' | 'budgets' | 'reports' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<FinanceEntry | null>(null);

  // Get farms for dropdown
  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const response = await fetch('/api/farms', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch farms');
      return response.json();
    },
    enabled: isAuthenticated()
  });

  // Get enhanced finance entries
  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['finance', 'entries'],
    queryFn: async () => {
      const params = new URLSearchParams({
        analytics: 'true',
        ...(selectedType && { type: selectedType }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedFarm && { farm_id: selectedFarm })
      });
      
      const response = await fetch(`/api/finance?${params}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch finance entries: ${response.statusText}`);
      }

      return response.json() as Promise<FinanceEntry[]>;
    },
    enabled: isAuthenticated()
  });

  // Get budget categories
  const { data: budgets } = useQuery({
    queryKey: ['finance', 'budgets'],
    queryFn: async () => {
      const fiscalYear = new Date().getFullYear();
      const response = await fetch(`/api/finance/budgets?fiscal_year=${fiscalYear}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch budgets: ${response.statusText}`);
      }

      return response.json() as Promise<BudgetCategory[]>;
    },
    enabled: isAuthenticated()
  });

  // Get financial analytics
  const { data: analytics } = useQuery({
    queryKey: ['finance', 'analytics'],
    queryFn: async () => {
      if (!farms || farms.length === 0) return null;
      
      const response = await fetch(`/api/finance/analytics?farm_id=${farms[0].id}&period=12months`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: isAuthenticated() && farms && farms.length > 0
  });

  const createEntryMutation = useMutation({
    mutationFn: async (entryData: FinanceFormData) => {
      const response = await fetch('/api/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(entryData)
      });

      if (!response.ok) {
        throw new Error('Failed to create finance entry');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      setShowCreateForm(false);
    }
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, ...entryData }: FinanceFormData & { id: number }) => {
      const response = await fetch('/api/finance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ id, ...entryData })
      });

      if (!response.ok) {
        throw new Error('Failed to update finance entry');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      setEditingEntry(null);
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async ({ farm_id, report_type, report_period }: { farm_id: number; report_type: string; report_period: string }) => {
      const response = await fetch('/api/finance/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ farm_id, report_type, report_period })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    }
  });

  const handleCreateEntry = (entryData: FinanceFormData) => {
    createEntryMutation.mutate(entryData);
  };

  const handleUpdateEntry = (entryData: FinanceFormData) => {
    if (editingEntry) {
      updateEntryMutation.mutate({ id: editingEntry.id, ...entryData });
    }
  };

  const handleGenerateReport = () => {
    if (farms && farms.length > 0) {
      generateReportMutation.mutate({
        farm_id: farms[0].id,
        report_type: 'monthly',
        report_period: new Date().toISOString().substring(0, 7)
      });
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view finance data.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p>Loading finance data...</p>
    </div>
  </div>;

  if (error) return <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Error loading finance data</h2>
      <p className="text-gray-600">{error.message}</p>
    </div>
  </div>;

  // Calculate summary statistics
  const totalRevenue = entries?.filter(entry => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0) || 0;
  const totalExpenses = entries?.filter(entry => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0) || 0;
  const totalInvestments = entries?.filter(entry => entry.type === 'investment').reduce((sum, entry) => sum + entry.amount, 0) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const grossMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Filter entries
  const filteredEntries = entries?.filter(entry => {
    const matchesSearch = entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reference_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || entry.type === selectedType;
    const matchesCategory = !selectedCategory || entry.budget_category === selectedCategory;
    const matchesFarm = !selectedFarm || entry.farm_id.toString() === selectedFarm;
    return matchesSearch && matchesType && matchesCategory && matchesFarm;
  }) || [];

  // Get unique categories for filter dropdown
  const categories = [...new Set(entries?.map(entry => entry.budget_category).filter(Boolean) || [])];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
            <p className="text-gray-600 mt-1">Track revenue, expenses, and financial performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setViewMode('analytics')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: DollarSign },
              { key: 'entries', label: 'Entries', icon: Receipt },
              { key: 'budgets', label: 'Budgets', icon: Target },
              { key: 'reports', label: 'Reports', icon: FileText }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  viewMode === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {viewMode === 'overview' && (
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
                  <p className="text-xs text-muted-foreground">
                    From all farms
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${totalExpenses.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Operating costs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${netProfit.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    After expenses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
                  <PieChart className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {grossMargin.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Profit margin
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Cash Flow Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Trends</CardTitle>
                <CardDescription>
                  Monthly income vs expenses over time
                </CardDescription>
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

            {/* Recent Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Financial Entries</CardTitle>
                <CardDescription>
                  Latest transactions and financial activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entries?.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          entry.type === 'income' ? 'bg-green-500' :
                          entry.type === 'expense' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{entry.description || 'No description'}</p>
                          <p className="text-xs text-gray-600">
                            {entry.farm_name} • {entry.type.toUpperCase()} • {new Date(entry.entry_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          entry.type === 'income' ? 'default' :
                          entry.type === 'expense' ? 'secondary' : 'outline'
                        }>
                          {entry.type}
                        </Badge>
                        <span className={`text-sm font-medium ${
                          entry.type === 'income' ? 'text-green-600' : 
                          entry.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {entry.type === 'income' ? '+' : entry.type === 'expense' ? '-' : ''}${entry.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Budget Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgets?.slice(0, 5).map((budget) => {
                      const spentPercentage = (budget.spent_amount / budget.budgeted_amount) * 100;
                      return (
                        <div key={budget.id}>
                          <div className="flex justify-between text-sm">
                            <span>{budget.category_name}</span>
                            <span>${budget.spent_amount.toLocaleString()} / ${budget.budgeted_amount.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                spentPercentage > 100 ? 'bg-red-500' : 
                                spentPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{width: `${Math.min(spentPercentage, 100)}%`}}
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
                      <span className={`text-sm font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {grossMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Budget Utilization</span>
                      <span className="text-sm font-medium">
                        {budgets && budgets.length > 0 ? 
                          Math.round((budgets.reduce((sum, b) => sum + (b.spent_amount / b.budgeted_amount), 0) / budgets.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax Deductible</span>
                      <span className="text-sm font-medium">
                        ${entries?.filter(e => e.tax_deductible).reduce((sum, e) => sum + e.amount, 0) || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Entries Tab */}
        {viewMode === 'entries' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="investment">Investment</option>
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <Button onClick={handleGenerateReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Entries List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          entry.type === 'income' ? 'bg-green-500' :
                          entry.type === 'expense' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{entry.description || 'No description'}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-500">
                              📅 {new Date(entry.entry_date).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-gray-500">
                              🏢 {entry.farm_name}
                            </span>
                            {entry.budget_category && (
                              <span className="text-sm text-gray-500">
                                🏷️ {entry.budget_category}
                              </span>
                            )}
                            {entry.receipt_number && (
                              <span className="text-sm text-gray-500">
                                📄 {entry.receipt_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          entry.type === 'income' ? 'default' :
                          entry.type === 'expense' ? 'secondary' : 'outline'
                        }>
                          {entry.type}
                        </Badge>
                        <Badge variant={
                          entry.approval_status === 'approved' ? 'default' :
                          entry.approval_status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {entry.approval_status}
                        </Badge>
                        {entry.tax_deductible && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            Tax Deductible
                          </Badge>
                        )}
                        <span className={`text-lg font-bold ${
                          entry.type === 'income' ? 'text-green-600' : 
                          entry.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {entry.type === 'income' ? '+' : entry.type === 'expense' ? '-' : ''}${entry.amount.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingEntry(entry)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEntry(entry)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredEntries.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No entries found</h4>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedType || selectedCategory || selectedFarm 
                      ? 'Try adjusting your search or filter criteria' 
                      : 'Start by creating your first financial entry'
                    }
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Entry
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Budgets Tab */}
        {viewMode === 'budgets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Budget Categories</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets?.map((budget) => (
                <Card key={budget.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{budget.category_name}</CardTitle>
                    <CardDescription>
                      Fiscal Year {budget.fiscal_year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Budgeted:</span>
                        <span className="text-sm font-medium">${budget.budgeted_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Spent:</span>
                        <span className="text-sm font-medium">${budget.spent_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Remaining:</span>
                        <span className={`text-sm font-medium ${
                          budget.remaining_budget >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${budget.remaining_budget.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Utilization</span>
                          <span>{Math.round((budget.spent_amount / budget.budgeted_amount) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              budget.spent_amount / budget.budgeted_amount > 1 ? 'bg-red-500' : 
                              budget.spent_amount / budget.budgeted_amount > 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{width: `${Math.min((budget.spent_amount / budget.budgeted_amount) * 100, 100)}%`}}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="default">
                          {budget.farm_name}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!budgets || budgets.length === 0) && (
                <div className="col-span-full text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No budgets</h4>
                  <p className="text-gray-600 mb-4">Create budget categories to track spending</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Budget
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {viewMode === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Financial Reports</h2>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleGenerateReport}
                disabled={generateReportMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {generateReportMutation.isPending ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Comprehensive monthly financial summary including revenue, expenses, and profit analysis.
                  </p>
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Monthly
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quarterly Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Detailed quarterly analysis with trends, comparisons, and performance metrics.
                  </p>
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Quarterly
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tax Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Tax-deductible expenses and income summary for tax preparation.
                  </p>
                  <Button className="w-full" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Export for Tax
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {viewMode === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Financial Analytics</h2>
            
            {analytics && (
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
                        <span className={`text-lg font-bold ${
                          (analytics.cash_flow?.net_flow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
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
            )}
          </div>
        )}

        {/* Create/Edit Entry Modal */}
        {(showCreateForm || editingEntry) && (
          <FinanceEntryModal
            entry={editingEntry}
            farms={farms || []}
            onSave={editingEntry ? handleUpdateEntry : handleCreateEntry}
            onClose={() => {
              setShowCreateForm(false);
              setEditingEntry(null);
            }}
            isLoading={createEntryMutation.isPending || updateEntryMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

interface FinanceEntryModalProps {
  entry?: FinanceEntry | null;
  farms: any[];
  onSave: (data: FinanceFormData) => void;
  onClose: () => void;
  isLoading: boolean;
}

function FinanceEntryModal({ entry, farms, onSave, onClose, isLoading }: FinanceEntryModalProps) {
  const [formData, setFormData] = useState<FinanceFormData>({
    farm_id: entry?.farm_id || farms[0]?.id || 1,
    entry_date: entry?.entry_date || new Date().toISOString().split('T')[0],
    type: entry?.type || 'expense',
    amount: entry?.amount || 0,
    currency: entry?.currency || 'USD',
    account: entry?.account || '',
    description: entry?.description || '',
    reference_type: entry?.reference_type || '',
    reference_id: entry?.reference_id || '',
    project_id: entry?.project_id || '',
    department: entry?.department || '',
    tax_category: entry?.tax_category || '',
    approval_status: entry?.approval_status || 'pending',
    receipt_number: entry?.receipt_number || '',
    recurring_pattern: entry?.recurring_pattern || '',
    budget_category: entry?.budget_category || '',
    tax_deductible: entry?.tax_deductible || false,
    bank_account: entry?.bank_account || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {entry ? 'Edit Finance Entry' : 'Create New Finance Entry'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farm *
                </label>
                <select
                  value={formData.farm_id}
                  onChange={(e) => setFormData({ ...formData, farm_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>{farm.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Date *
                </label>
                <input
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="ZAR">ZAR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account
                </label>
                <input
                  type="text"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Bank account or cash"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approval Status
                </label>
                <select
                  value={formData.approval_status}
                  onChange={(e) => setFormData({ ...formData, approval_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Category
                </label>
                <input
                  type="text"
                  value={formData.budget_category}
                  onChange={(e) => setFormData({ ...formData, budget_category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Feed, Labor, Equipment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Category
                </label>
                <input
                  type="text"
                  value={formData.tax_category}
                  onChange={(e) => setFormData({ ...formData, tax_category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Operating, Capital, Deduction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Livestock, Crops, Admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed description of the transaction..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_id}
                  onChange={(e) => setFormData({ ...formData, reference_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Invoice, receipt, or check number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Number
                </label>
                <input
                  type="text"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Receipt or document number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Associated project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Account
                </label>
                <input
                  type="text"
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Specific bank account"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.tax_deductible}
                  onChange={(e) => setFormData({ ...formData, tax_deductible: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Tax Deductible</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Check if this expense is tax deductible
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Saving...' : (entry ? 'Update Entry' : 'Create Entry')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FinancePage;