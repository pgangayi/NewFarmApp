import { useState } from 'react';
import { Search, Download, Plus, Receipt, Edit, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FinanceEntry } from './types';

interface FinanceEntryListProps {
  entries: FinanceEntry[];
  onEdit: (entry: FinanceEntry) => void;
  onView: (entry: FinanceEntry) => void;
  onCreate: () => void;
  onGenerateReport: () => void;
}

export function FinanceEntryList({
  entries,
  onEdit,
  onView,
  onCreate,
  onGenerateReport,
}: FinanceEntryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFarm, setSelectedFarm] = useState<string>('');

  // Filter entries
  const filteredEntries =
    entries?.filter(entry => {
      const matchesSearch =
        entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reference_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !selectedType || entry.type === selectedType;
      const matchesCategory = !selectedCategory || entry.budget_category === selectedCategory;
      const matchesFarm = !selectedFarm || entry.farm_id.toString() === selectedFarm;
      return matchesSearch && matchesType && matchesCategory && matchesFarm;
    }) || [];

  // Get unique categories for filter dropdown
  const categories = [
    ...new Set(entries?.map(entry => entry.budget_category).filter(Boolean) || []),
  ];

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="investment">Investment</option>
        </select>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <Button onClick={onGenerateReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      entry.type === 'income'
                        ? 'bg-green-500'
                        : entry.type === 'expense'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {entry.description || 'No description'}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-500">
                        📅 {new Date(entry.entry_date).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">🏢 {entry.farm_name}</span>
                      {entry.budget_category && (
                        <span className="text-sm text-gray-500">🏷️ {entry.budget_category}</span>
                      )}
                      {entry.receipt_number && (
                        <span className="text-sm text-gray-500">📄 {entry.receipt_number}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      entry.type === 'income'
                        ? 'default'
                        : entry.type === 'expense'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {entry.type}
                  </Badge>
                  <Badge
                    variant={
                      entry.approval_status === 'approved'
                        ? 'default'
                        : entry.approval_status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {entry.approval_status}
                  </Badge>
                  {entry.tax_deductible && (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Tax Deductible
                    </Badge>
                  )}
                  <span
                    className={`text-lg font-bold ${
                      entry.type === 'income'
                        ? 'text-green-600'
                        : entry.type === 'expense'
                          ? 'text-red-600'
                          : 'text-blue-600'
                    }`}
                  >
                    {entry.type === 'income' ? '+' : entry.type === 'expense' ? '-' : ''}$
                    {entry.amount.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => onEdit(entry)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onView(entry)}>
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
                : 'Start by creating your first financial entry'}
            </p>
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
