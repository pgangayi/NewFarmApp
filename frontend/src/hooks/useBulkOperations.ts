import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface BulkOperation {
  id: string;
  type: 'delete' | 'update' | 'export' | 'import' | 'assign' | 'archive' | 'restore';
  label: string;
  description: string;
  icon: string;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'gray';
  requiresConfirmation: boolean;
  fields?: BulkField[];
  apiEndpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
}

interface BulkField {
  name: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date';
  label: string;
  required: boolean;
  options?: { value: unknown; label: string }[];
  validation?: (value: unknown) => string | null;
}

interface BulkOperationProgress {
  operationId: string;
  total: number;
  completed: number;
  failed: number;
  currentItem?: unknown;
  errors: Array<{ item: unknown; error: string }>;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

interface SelectedItem {
  id: string;
  type: string;
  data: unknown;
  selected: boolean;
}

const BULK_OPERATIONS: BulkOperation[] = [
  {
    id: 'delete',
    type: 'delete',
    label: 'Delete Items',
    description: 'Permanently delete selected items',
    icon: 'trash',
    color: 'red',
    requiresConfirmation: true,
    apiEndpoint: '/api/bulk-delete',
    method: 'DELETE',
  },
  {
    id: 'update-status',
    type: 'update',
    label: 'Update Status',
    description: 'Change status of selected items',
    icon: 'edit',
    color: 'blue',
    requiresConfirmation: false,
    fields: [
      {
        name: 'status',
        type: 'select',
        label: 'New Status',
        required: true,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' },
          { value: 'completed', label: 'Completed' },
        ],
      },
    ],
    apiEndpoint: '/api/bulk-update',
    method: 'PUT',
  },
  {
    id: 'export-csv',
    type: 'export',
    label: 'Export to CSV',
    description: 'Export selected items to CSV file',
    icon: 'download',
    color: 'green',
    requiresConfirmation: false,
    apiEndpoint: '/api/bulk-export',
    method: 'POST',
  },
  {
    id: 'archive',
    type: 'archive',
    label: 'Archive Items',
    description: 'Archive selected items (can be restored later)',
    icon: 'archive',
    color: 'yellow',
    requiresConfirmation: true,
    apiEndpoint: '/api/bulk-archive',
    method: 'PUT',
  },
  {
    id: 'restore',
    type: 'restore',
    label: 'Restore Items',
    description: 'Restore archived items',
    icon: 'refresh',
    color: 'purple',
    requiresConfirmation: true,
    apiEndpoint: '/api/bulk-restore',
    method: 'PUT',
  },
  {
    id: 'assign-category',
    type: 'assign',
    label: 'Assign Category',
    description: 'Assign category to selected items',
    icon: 'tag',
    color: 'blue',
    requiresConfirmation: false,
    fields: [
      {
        name: 'category',
        type: 'select',
        label: 'Category',
        required: true,
        options: [
          { value: 'livestock', label: 'Livestock' },
          { value: 'crops', label: 'Crops' },
          { value: 'equipment', label: 'Equipment' },
          { value: 'supplies', label: 'Supplies' },
        ],
      },
    ],
    apiEndpoint: '/api/bulk-assign',
    method: 'PUT',
  },
];

export function useBulkOperations() {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [activeOperation, setActiveOperation] = useState<BulkOperation | null>(null);
  const [operationForm, setOperationForm] = useState<Record<string, unknown>>({});
  const [operationProgress, setOperationProgress] = useState<BulkOperationProgress | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const getAvailableOperations = useCallback((itemType: string) => {
    return BULK_OPERATIONS.filter(operation => {
      return true;
    });
  }, []);

  const selectAll = useCallback((items: unknown[], type: string, select: boolean = true) => {
    setSelectedItems(prev => {
      const newSelected = [...prev];
      items.forEach(item => {
        const existingIndex = newSelected.findIndex(s => s.id === item.id);
        if (select) {
          if (existingIndex === -1) {
            newSelected.push({
              id: item.id,
              type,
              data: item,
              selected: true,
            });
          } else {
            newSelected[existingIndex].selected = true;
          }
        } else {
          if (existingIndex !== -1) {
            newSelected.splice(existingIndex, 1);
          }
        }
      });
      return newSelected;
    });
  }, []);

  const toggleItemSelection = useCallback((item: unknown, type: string) => {
    setSelectedItems(prev => {
      const existingIndex = prev.findIndex(s => s.id === item.id);
      if (existingIndex !== -1) {
        return prev.filter(s => s.id !== item.id);
      } else {
        return [
          ...prev,
          {
            id: item.id,
            type,
            data: item,
            selected: true,
          },
        ];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setActiveOperation(null);
    setOperationForm({});
    setOperationProgress(null);
  }, []);

  const startOperation = useCallback(
    (operation: BulkOperation) => {
      if (selectedItems.length === 0) {
        throw new Error('No items selected');
      }

      setActiveOperation(operation);
      if (operation.fields && operation.fields.length > 0) {
        const defaultForm: Record<string, unknown> = {};
        operation.fields!.forEach(field => {
          defaultForm[field.name] = field.type === 'checkbox' ? false : '';
        });
        setOperationForm(defaultForm);
      }
    },
    [selectedItems]
  );

  const executeOperation = useCallback(async () => {
    if (!activeOperation || selectedItems.length === 0) {
      throw new Error('No active operation or selected items');
    }

    const progress: BulkOperationProgress = {
      operationId: activeOperation.id,
      total: selectedItems.length,
      completed: 0,
      failed: 0,
      errors: [],
      startTime: new Date(),
      status: 'running',
    };
    setOperationProgress(progress);

    abortControllerRef.current = new AbortController();

    try {
      const items = selectedItems.map(s => s.data);
      const payload = {
        items,
        operation: activeOperation.type,
        formData: operationForm,
      };

      if (activeOperation.type === 'delete' || activeOperation.type === 'update') {
        const results = await processItemsIndividually(
          activeOperation,
          items,
          operationForm,
          (completed, failed, currentItem, error) => {
            setOperationProgress(prev =>
              prev
                ? {
                    ...prev,
                    completed,
                    failed,
                    currentItem,
                    errors: error ? [...prev.errors, { item: currentItem, error }] : prev.errors,
                  }
                : null
            );
          },
          abortControllerRef.current!.signal
        );

        if (results.failed > 0) {
          throw new Error(`Operation completed with ${results.failed} failures`);
        }
      } else {
        const response = await fetch(activeOperation.apiEndpoint, {
          method: activeOperation.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Operation failed: ${response.statusText}`);
        }
      }

      setOperationProgress(prev =>
        prev
          ? {
              ...prev,
              status: 'completed',
              endTime: new Date(),
            }
          : null
      );

      queryClient.invalidateQueries();

      setActiveOperation(null);
      setOperationForm({});

      setTimeout(() => {
        clearSelection();
      }, 2000);
    } catch (error) {
      console.error('Bulk operation failed:', error);
      setOperationProgress(prev =>
        prev
          ? {
              ...prev,
              status: 'failed',
              endTime: new Date(),
            }
          : null
      );
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  }, [activeOperation, selectedItems, operationForm, queryClient, clearSelection]);

  const processItemsIndividually = async (
    operation: BulkOperation,
    items: unknown[],
    formData: Record<string, unknown>,
    onProgress: (
      completed: number,
      failed: number,
      currentItem: unknown,
      error: string | null
    ) => void,
    signal: AbortSignal
  ) => {
    let completed = 0;
    let failed = 0;

    for (const item of items) {
      if (signal.aborted) {
        throw new Error('Operation cancelled');
      }

      try {
        const payload = {
          item,
          operation: operation.type,
          formData,
        };

        const response = await fetch(operation.apiEndpoint, {
          method: operation.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to process item: ${response.statusText}`);
        }

        completed++;
        onProgress(completed, failed, item, null);
      } catch (error) {
        failed++;
        onProgress(
          completed,
          failed,
          item,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    return { completed, failed };
  };

  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setOperationProgress(prev =>
      prev
        ? {
            ...prev,
            status: 'cancelled',
            endTime: new Date(),
          }
        : null
    );
  }, []);

  const validateOperationForm = useCallback(() => {
    if (!activeOperation || !activeOperation.fields) return { isValid: true, errors: [] };

    const errors: string[] = [];
    activeOperation.fields!.forEach(field => {
      const value = operationForm[field.name];

      if (field.required && (!value || value === '')) {
        errors.push(`${field.label} is required`);
      }

      if (field.validation && value) {
        const validationError = field.validation(value);
        if (validationError) {
          errors.push(validationError);
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  }, [activeOperation, operationForm]);

  const updateOperationForm = useCallback((field: string, value: unknown) => {
    setOperationForm(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const getSelectionStats = useCallback(() => {
    const total = selectedItems.length;
    const byType = selectedItems.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return { total, byType };
  }, [selectedItems]);

  const exportSelectionToCSV = useCallback(() => {
    if (selectedItems.length === 0) return;

    const headers = Object.keys(selectedItems[0].data);
    const csvContent = [
      headers.join(','),
      ...selectedItems.map(item =>
        headers
          .map(header => {
            const value = item.data[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bulk-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [selectedItems]);

  return {
    selectedItems,
    activeOperation,
    operationForm,
    operationProgress,
    isSelectionMode,
    setIsSelectionMode,
    selectAll,
    toggleItemSelection,
    clearSelection,
    startOperation,
    executeOperation,
    cancelOperation,
    updateOperationForm,
    exportSelectionToCSV,
    validateOperationForm,
    getAvailableOperations,
    getSelectionStats,
    BULK_OPERATIONS,
  };
}

export default useBulkOperations;
export type { BulkOperation, BulkField, BulkOperationProgress, SelectedItem };
