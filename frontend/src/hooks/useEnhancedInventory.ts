import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'seed' | 'fertilizer' | 'pesticide' | 'equipment' | 'feed' | 'medicine' | 'tool' | 'other';
  sku: string;
  description?: string;
  quantity: number;
  unit: string;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  costPerUnit: number;
  supplier?: string;
  location?: string;
  expiryDate?: Date;
  batchNumber?: string;
  status: 'active' | 'inactive' | 'discontinued' | 'backordered';
  lastUpdated: Date;
  createdAt: Date;
  tags: string[];
  images: string[];
  specifications: Record<string, any>;
  usageHistory: Array<{
    date: Date;
    quantity: number;
    purpose: string;
    userId: string;
  }>;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'purchase' | 'usage' | 'adjustment' | 'transfer' | 'return' | 'waste';
  quantity: number;
  unit: string;
  reason: string;
  reference?: string;
  userId: string;
  timestamp: Date;
  location?: string;
  cost?: number;
  approvedBy?: string;
  notes?: string;
}

export interface StockAlert {
  id: string;
  itemId: string;
  itemName: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'expired';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  quantity: number;
  threshold: number;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface InventoryReport {
  id: string;
  name: string;
  type: 'stock_level' | 'usage' | 'valuation' | 'expiry' | 'movement';
  generatedAt: Date;
  generatedBy: string;
  filters: {
    categories?: string[];
    locations?: string[];
    dateRange?: { start: Date; end: Date };
  };
  data: any;
  summary: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    expiringItems: number;
  };
}

export function useEnhancedInventory(farmId: number) {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'cost' | 'expiry' | 'lastUpdated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Get inventory items
  const {
    data: inventoryItems,
    isLoading: itemsLoading,
    error: itemsError,
    refetch: refetchItems
  } = useQuery({
    queryKey: ['inventory-items', farmId, selectedCategory, searchQuery, sortBy, sortOrder, showOnlyLowStock, selectedLocation],
    queryFn: async () => {
      const params = new URLSearchParams({
        farm_id: farmId.toString(),
        category: selectedCategory,
        search: searchQuery,
        sort_by: sortBy,
        sort_order: sortOrder,
        low_stock_only: showOnlyLowStock.toString(),
        location: selectedLocation
      });

      const response = await fetch(`/api/inventory/items?${params}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory items');
      }
      
      return response.json() as Promise<InventoryItem[]>;
    },
    enabled: isAuthenticated(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000 // 5 minutes
  });

  // Get inventory transactions
  const {
    data: transactions,
    isLoading: transactionsLoading
  } = useQuery({
    queryKey: ['inventory-transactions', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/transactions?farm_id=${farmId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory transactions');
      }
      
      return response.json() as Promise<InventoryTransaction[]>;
    },
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Get stock alerts
  const {
    data: stockAlerts,
    isLoading: alertsLoading,
    refetch: refetchAlerts
  } = useQuery({
    queryKey: ['stock-alerts', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/alerts?farm_id=${farmId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock alerts');
      }
      
      return response.json() as Promise<StockAlert[]>;
    },
    enabled: isAuthenticated(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000 // 2 minutes
  });

  // Get inventory reports
  const {
    data: reports,
    isLoading: reportsLoading
  } = useQuery({
    queryKey: ['inventory-reports', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/reports?farm_id=${farmId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory reports');
      }
      
      return response.json() as Promise<InventoryReport[]>;
    },
    enabled: isAuthenticated(),
    staleTime: 30 * 60 * 1000 // 30 minutes
  });

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'lastUpdated' | 'usageHistory'>) => {
      const response = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...item,
          farm_id: farmId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create inventory item');
      }
      
      return response.json() as Promise<InventoryItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryItem> }) => {
      const response = await fetch(`/api/inventory/items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update inventory item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/inventory/items/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete inventory item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    }
  });

  const recordTransactionMutation = useMutation({
    mutationFn: async (transaction: Omit<InventoryTransaction, 'id' | 'timestamp'>) => {
      const response = await fetch('/api/inventory/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...transaction,
          farm_id: farmId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to record inventory transaction');
      }
      
      return response.json() as Promise<InventoryTransaction>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    }
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/inventory/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportConfig: {
      type: InventoryReport['type'];
      name: string;
      filters: any;
    }) => {
      const response = await fetch('/api/inventory/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...reportConfig,
          farm_id: farmId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      return response.json() as Promise<InventoryReport>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-reports'] });
    }
  });

  // Computed values
  const filteredItems = useMemo(() => {
    if (!inventoryItems) return [];
    
    let filtered = [...inventoryItems];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (showOnlyLowStock) {
      filtered = filtered.filter(item => item.quantity <= item.reorderPoint);
    }
    
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'cost':
          aValue = a.costPerUnit;
          bValue = b.costPerUnit;
          break;
        case 'expiry':
          aValue = a.expiryDate?.getTime() || 0;
          bValue = b.expiryDate?.getTime() || 0;
          break;
        case 'lastUpdated':
          aValue = a.lastUpdated.getTime();
          bValue = b.lastUpdated.getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    return filtered;
  }, [inventoryItems, selectedCategory, searchQuery, sortBy, sortOrder, showOnlyLowStock, selectedLocation]);

  const inventoryStats = useMemo(() => {
    if (!inventoryItems) return {
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      expiringItems: 0,
      expiredItems: 0,
      categories: {} as Record<string, number>
    };

    const stats = {
      totalItems: inventoryItems.length,
      totalValue: inventoryItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0),
      lowStockItems: inventoryItems.filter(item => item.quantity <= item.reorderPoint && item.quantity > 0).length,
      outOfStockItems: inventoryItems.filter(item => item.quantity === 0).length,
      expiringItems: inventoryItems.filter(item => 
        item.expiryDate && 
        item.expiryDate > new Date() && 
        item.expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).length,
      expiredItems: inventoryItems.filter(item => 
        item.expiryDate && 
        item.expiryDate <= new Date()
      ).length,
      categories: {} as Record<string, number>
    };

    inventoryItems.forEach(item => {
      stats.categories[item.category] = (stats.categories[item.category] || 0) + 1;
    });

    return stats;
  }, [inventoryItems]);

  const criticalAlerts = useMemo(() => {
    if (!stockAlerts) return [];
    
    return stockAlerts
      .filter(alert => !alert.acknowledged && alert.severity === 'critical')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [stockAlerts]);

  const recentTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }, [transactions]);

  // Actions
  const createItem = useCallback((item: Omit<InventoryItem, 'id' | 'createdAt' | 'lastUpdated' | 'usageHistory'>) => {
    createItemMutation.mutate(item);
  }, [createItemMutation]);

  const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    updateItemMutation.mutate({ id, updates });
  }, [updateItemMutation]);

  const deleteItem = useCallback((id: string) => {
    deleteItemMutation.mutate(id);
  }, [deleteItemMutation]);

  const recordTransaction = useCallback((transaction: Omit<InventoryTransaction, 'id' | 'timestamp'>) => {
    recordTransactionMutation.mutate(transaction);
  }, [recordTransactionMutation]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    acknowledgeAlertMutation.mutate(alertId);
  }, [acknowledgeAlertMutation]);

  const generateReport = useCallback((reportConfig: {
    type: InventoryReport['type'];
    name: string;
    filters: any;
  }) => {
    generateReportMutation.mutate(reportConfig);
  }, [generateReportMutation]);

  const bulkUpdateItems = useCallback((updates: Array<{ id: string; changes: Partial<InventoryItem> }>) => {
    const promises = updates.map(({ id, changes }) => updateItem(id, changes));
    return Promise.all(promises);
  }, [updateItem]);

  const exportInventory = useCallback(async (format: 'csv' | 'excel' | 'json') => {
    const response = await fetch(`/api/inventory/export?format=${format}&farm_id=${farmId}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to export inventory');
    }
    
    return response.blob();
  }, [farmId, getAuthHeaders]);

  const importInventory = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('farm_id', farmId.toString());

    const response = await fetch('/api/inventory/import', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to import inventory');
    }
    
    const result = await response.json();
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    
    return result;
  }, [farmId, getAuthHeaders, queryClient]);

  return {
    // Data
    inventoryItems: filteredItems,
    allItems: inventoryItems || [],
    transactions: transactions || [],
    stockAlerts: stockAlerts || [],
    reports: reports || [],
    
    // Loading states
    isLoading: itemsLoading || transactionsLoading || alertsLoading || reportsLoading,
    error: itemsError,
    
    // Computed values
    inventoryStats,
    criticalAlerts,
    recentTransactions,
    
    // State management
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortOrder,
    showOnlyLowStock,
    setShowOnlyLowStock,
    selectedLocation,
    setSelectedLocation,
    
    // Actions
    createItem,
    updateItem,
    deleteItem,
    recordTransaction,
    acknowledgeAlert,
    generateReport,
    bulkUpdateItems,
    exportInventory,
    importInventory,
    refetchItems,
    refetchAlerts,
    
    // Mutation states
    isCreating: createItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
    isRecording: recordTransactionMutation.isPending,
    isGenerating: generateReportMutation.isPending
  };
}
