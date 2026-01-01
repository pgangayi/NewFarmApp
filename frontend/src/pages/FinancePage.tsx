import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Receipt, Target, FileText, BarChart3, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useAuth } from '../hooks/AuthContext';
import {
  useFinance,
  useCreateFinanceRecord,
  useUpdateFinanceRecord,
  useDeleteFinanceRecord,
  useBudgets,
  useFarmWithSelection,
  apiClient,
} from '../api';
import { FinanceEntry, BudgetCategory, FinanceFormData } from '../components/finance/types';
import { FinanceOverview } from '../components/finance/FinanceOverview';
import { FinanceEntryList } from '../components/finance/FinanceEntryList';
import { BudgetProgress } from '../components/finance/BudgetProgress';
import { FinanceReports } from '../components/finance/FinanceReports';
import { FinanceAnalytics } from '../components/finance/FinanceAnalytics';
import { FinanceEntryModal } from '../components/finance/FinanceEntryModal';
import type { Farm } from '../api';

export function FinancePage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { currentFarm } = useFarmWithSelection();
  const [viewMode, setViewMode] = useState<
    'overview' | 'entries' | 'budgets' | 'reports' | 'analytics'
  >('overview');

  // State for modals and forms
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [showCreateBudget, setShowCreateBudget] = useState(false);

  // Use unified hooks
  const {
    data: entries = [],
    isLoading,
    error,
  } = useFinance(currentFarm?.id ? { farm_id: currentFarm.id } : undefined);
  const createMutation = useCreateFinanceRecord();
  const updateMutation = useUpdateFinanceRecord();
  const deleteMutation = useDeleteFinanceRecord();

  // Get budget categories
  const { data: budgets = [] } = useBudgets(currentFarm?.id);

  // Get financial analytics
  const { data: analytics } = useQuery({
    queryKey: ['finance', 'analytics', currentFarm?.id],
    queryFn: async () => {
      if (!currentFarm?.id) return null;
      const response = await apiClient.get<any>(
        `/api/finance/analytics?farm_id=${currentFarm.id}&period=12months`
      );
      return response;
    },
    enabled: !!currentFarm?.id && isAuthenticated(),
  });

  const handleCreateEntry = async (entryData: FinanceFormData) => {
    try {
      await createMutation.mutateAsync({
        ...entryData,
        farm_id: currentFarm?.id || '',
      } as any);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create entry', error);
    }
  };

  const handleUpdateEntry = async (entryData: FinanceFormData) => {
    if (editingEntry) {
      try {
        await updateMutation.mutateAsync({
          id: editingEntry.id,
          data: entryData as any,
        });
        setEditingEntry(null);
      } catch (error) {
        console.error('Failed to update entry', error);
      }
    }
  };

  const handleGenerateReport = async () => {
    if (currentFarm) {
      try {
        await apiClient.post('/api/finance/reports', {
          farm_id: currentFarm.id,
          report_type: 'monthly',
          report_period: new Date().toISOString().substring(0, 7),
        });
        // Maybe show a toast or download the report
      } catch (error) {
        console.error('Failed to generate report', error);
      }
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
            isGenerating={false} // TODO: Add loading state for report generation
          />
        )}

        {/* Analytics Tab */}
        {viewMode === 'analytics' && <FinanceAnalytics analytics={analytics} />}

        {/* Create/Edit Entry Modal */}
        {(showCreateForm || editingEntry) && (
          <FinanceEntryModal
            entry={editingEntry}
            farms={currentFarm ? [currentFarm as unknown as Farm] : []}
            onSave={editingEntry ? handleUpdateEntry : handleCreateEntry}
            onClose={() => {
              setShowCreateForm(false);
              setEditingEntry(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

export default FinancePage;
