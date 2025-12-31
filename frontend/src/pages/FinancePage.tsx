import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Receipt, Target, FileText, BarChart3, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useAuth } from '../hooks/AuthContext';
import { Farm } from '../types/entities';
import {
  FinanceEntry,
  BudgetCategory,
  FinanceFormData,
  FinancialReport,
} from '../components/finance/types';
import { FinanceOverview } from '../components/finance/FinanceOverview';
import { FinanceEntryList } from '../components/finance/FinanceEntryList';
import { BudgetProgress } from '../components/finance/BudgetProgress';
import { FinanceReports } from '../components/finance/FinanceReports';
import { FinanceAnalytics } from '../components/finance/FinanceAnalytics';
import { FinanceEntryModal } from '../components/finance/FinanceEntryModal';

export function FinancePage() {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<
    'overview' | 'entries' | 'budgets' | 'reports' | 'analytics'
  >('overview');

  // State for modals and forms
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [showCreateBudget, setShowCreateBudget] = useState(false);

  // Get farms for dropdown
  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const response = await fetch('/api/farms', {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch farms');
      return response.json();
    },
    enabled: isAuthenticated(),
  });

  // Get enhanced finance entries
  const {
    data: entries,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['finance', 'entries'],
    queryFn: async () => {
      const params = new URLSearchParams({
        analytics: 'true',
      });

      const response = await fetch(`/api/finance?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch finance entries: ${response.statusText}`);
      }

      return response.json() as Promise<FinanceEntry[]>;
    },
    enabled: isAuthenticated(),
  });

  // Get budget categories
  const { data: budgets } = useQuery({
    queryKey: ['finance', 'budgets'],
    queryFn: async () => {
      const fiscalYear = new Date().getFullYear();
      const response = await fetch(`/api/finance/budgets?fiscal_year=${fiscalYear}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch budgets: ${response.statusText}`);
      }

      return response.json() as Promise<BudgetCategory[]>;
    },
    enabled: isAuthenticated(),
  });

  // Get financial analytics
  const { data: analytics } = useQuery({
    queryKey: ['finance', 'analytics'],
    queryFn: async () => {
      if (!farms || farms.length === 0) return null;

      const response = await fetch(
        `/api/finance/analytics?farm_id=${farms[0].id}&period=12months`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: isAuthenticated() && farms && farms.length > 0,
  });

  const createEntryMutation = useMutation({
    mutationFn: async (entryData: FinanceFormData) => {
      const response = await fetch('/api/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        throw new Error('Failed to create finance entry');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      setShowCreateForm(false);
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, ...entryData }: FinanceFormData & { id: number }) => {
      const response = await fetch('/api/finance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ id, ...entryData }),
      });

      if (!response.ok) {
        throw new Error('Failed to update finance entry');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      setEditingEntry(null);
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async ({
      farm_id,
      report_type,
      report_period,
    }: {
      farm_id: number;
      report_type: string;
      report_period: string;
    }) => {
      const response = await fetch('/api/finance/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ farm_id, report_type, report_period }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
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
        farm_id: typeof farms[0].id === 'string' ? parseInt(farms[0].id) : farms[0].id,
        report_type: 'monthly',
        report_period: new Date().toISOString().substring(0, 7),
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

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading finance data...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error loading finance data</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs className="mb-6" />

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
              { key: 'reports', label: 'Reports', icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() =>
                  setViewMode(key as 'entries' | 'analytics' | 'overview' | 'budgets' | 'reports')
                }
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
          <FinanceOverview entries={entries || []} budgets={budgets || []} />
        )}

        {/* Entries Tab */}
        {viewMode === 'entries' && (
          <FinanceEntryList
            entries={entries || []}
            onEdit={setEditingEntry}
            onView={entry => console.log('View entry', entry)} // Placeholder for view
            onCreate={() => setShowCreateForm(true)}
            onGenerateReport={handleGenerateReport}
          />
        )}

        {/* Budgets Tab */}
        {viewMode === 'budgets' && (
          <BudgetProgress
            budgets={budgets || []}
            onCreateBudget={() => setShowCreateBudget(true)}
          />
        )}

        {/* Reports Tab */}
        {viewMode === 'reports' && (
          <FinanceReports
            onGenerateReport={handleGenerateReport}
            isGenerating={generateReportMutation.isPending}
          />
        )}

        {/* Analytics Tab */}
        {viewMode === 'analytics' && <FinanceAnalytics analytics={analytics} />}

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

export default FinancePage;
