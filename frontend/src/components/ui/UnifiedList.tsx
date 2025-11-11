// Unified List Component
// Eliminates 6+ identical list implementations

import _React from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';

export interface UnifiedListItem {
  id: string | number;
  [key: string]: unknown;
}

export interface ColumnConfig {
  key: string;
  label: string;
  render?: (item: UnifiedListItem) => React.ReactNode;
  className?: string;
}

export interface ActionConfig {
  key: string;
  label: string;
  icon: React.ComponentType<unknown>;
  color?: 'default' | 'blue' | 'green' | 'red' | 'yellow';
  onClick: (item: UnifiedListItem) => void;
  show?: (item: UnifiedListItem) => boolean;
  disabled?: (item: UnifiedListItem) => boolean;
}

export interface UnifiedListProps {
  title: string;
  items: UnifiedListItem[];
  columns: ColumnConfig[];
  actions?: ActionConfig[];
  loading?: boolean;
  error?: string;
  emptyState?: {
    icon?: React.ComponentType<unknown>;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  onAdd?: () => void;
  addButtonLabel?: string;
  addButtonColor?: 'default' | 'blue' | 'green' | 'purple' | 'pink';
  className?: string;
  showHeader?: boolean;
}

const colorClasses = {
  default: 'text-gray-600 hover:text-gray-900',
  blue: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
  green: 'text-green-600 hover:text-green-800 hover:bg-green-50',
  red: 'text-red-600 hover:text-red-800 hover:bg-red-50',
  yellow: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50',
};

const addButtonColorClasses = {
  default: 'bg-gray-600 hover:bg-gray-700',
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
  pink: 'bg-pink-600 hover:bg-pink-700',
};

export function UnifiedList({
  title,
  items,
  columns,
  actions = [],
  loading = false,
  error,
  emptyState,
  onAdd,
  addButtonLabel = 'Add',
  addButtonColor = 'blue',
  className = '',
  showHeader = true,
}: UnifiedListProps) {
  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        {showHeader && (
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="w-20 bg-gray-200 rounded animate-pulse h-8"></div>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        {showHeader && (
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading data</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    const Icon = emptyState?.icon || FileText;
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        {showHeader && (
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {onAdd && (
              <button
                onClick={onAdd}
                className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors ${addButtonColorClasses[addButtonColor]}`}
              >
                <Plus className="h-4 w-4" />
                {addButtonLabel}
              </button>
            )}
          </div>
        )}

        <div className="text-center py-8">
          <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyState?.title || `No ${title.toLowerCase()} found`}
          </h3>
          <p className="text-gray-600 mb-4">
            {emptyState?.description || `Get started by adding your first ${title.toLowerCase()}.`}
          </p>
          {emptyState?.onAction && emptyState.actionLabel ? (
            <button
              onClick={emptyState.onAction}
              className={`px-4 py-2 text-white rounded-lg inline-flex items-center gap-2 transition-colors ${addButtonColorClasses[addButtonColor]}`}
            >
              <Plus className="h-4 w-4" />
              {emptyState.actionLabel}
            </button>
          ) : onAdd ? (
            <button
              onClick={onAdd}
              className={`px-4 py-2 text-white rounded-lg inline-flex items-center gap-2 transition-colors ${addButtonColorClasses[addButtonColor]}`}
            >
              <Plus className="h-4 w-4" />
              {addButtonLabel}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {onAdd && (
              <button
                onClick={onAdd}
                className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors ${addButtonColorClasses[addButtonColor]}`}
              >
                <Plus className="h-4 w-4" />
                {addButtonLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-gray-200">
        {items.map((item, index) => (
          <div key={item.id || index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {columns.map(column => {
                    const value = column.render ? column.render(item) : item[column.key];

                    return (
                      <div key={column.key} className={column.className}>
                        <span className="text-sm font-medium text-gray-700 block">
                          {column.label}:
                        </span>
                        <span className="text-sm text-gray-900 mt-1 block">{value || '—'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              {actions.length > 0 && (
                <div className="flex gap-1 ml-4">
                  {actions
                    .filter(action => action.show?.(item) !== false)
                    .map(action => {
                      const Icon = action.icon;
                      const isDisabled = action.disabled?.(item) || false;

                      return (
                        <button
                          key={action.key}
                          onClick={() => !isDisabled && action.onClick(item)}
                          disabled={isDisabled}
                          className={`p-2 rounded-lg transition-colors ${colorClasses[action.color || 'default']} ${
                            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={action.label}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UnifiedList;
