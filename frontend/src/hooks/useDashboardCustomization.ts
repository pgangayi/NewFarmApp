import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

export interface DashboardWidget {
  id: string;
  type: 'metric-card' | 'chart' | 'table' | 'map' | 'alert' | 'quick-action' | 'weather' | 'calendar';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  data?: any;
  config?: Record<string, any>;
  isMinimized?: boolean;
  isVisible?: boolean;
  refreshInterval?: number;
  lastUpdated?: Date;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  columns: number;
  rowHeight: number;
  isDefault: boolean;
  isPublic: boolean;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'farm' | 'livestock' | 'crops' | 'finance' | 'operations' | 'analytics';
  role: 'owner' | 'manager' | 'worker' | 'accounting' | 'admin';
  widgets: Omit<DashboardWidget, 'id' | 'position'>[];
  layout: {
    columns: number;
    rowHeight: number;
    defaultPositions: Array<{ type: string; x: number; y: number; w: number; h: number }>;
  };
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'farm-overview',
    type: 'metric-card',
    title: 'Farm Overview',
    size: 'medium',
    position: { x: 0, y: 0 },
    config: { metrics: ['animals', 'crops', 'fields', 'tasks'] },
    refreshInterval: 30000
  },
  {
    id: 'financial-summary',
    type: 'metric-card',
    title: 'Financial Summary',
    size: 'medium',
    position: { x: 1, y: 0 },
    config: { metrics: ['revenue', 'expenses', 'profit'] },
    refreshInterval: 60000
  },
  {
    id: 'weather-widget',
    type: 'weather',
    title: 'Weather',
    size: 'small',
    position: { x: 2, y: 0 },
    refreshInterval: 300000
  },
  {
    id: 'recent-alerts',
    type: 'alert',
    title: 'Recent Alerts',
    size: 'medium',
    position: { x: 0, y: 1 },
    config: { maxItems: 5, severity: ['error', 'warning'] },
    refreshInterval: 15000
  },
  {
    id: 'quick-actions',
    type: 'quick-action',
    title: 'Quick Actions',
    size: 'medium',
    position: { x: 1, y: 1 },
    config: { actions: ['add-task', 'log-expense', 'update-inventory'] }
  },
  {
    id: 'task-progress',
    type: 'chart',
    title: 'Task Progress',
    size: 'large',
    position: { x: 0, y: 2 },
    config: { chartType: 'pie', timeRange: '7d' },
    refreshInterval: 30000
  }
];

const dashboardTemplates: DashboardTemplate[] = [
  {
    id: 'farm-owner',
    name: 'Farm Owner Dashboard',
    description: 'Comprehensive overview for farm owners',
    category: 'farm',
    role: 'owner',
    widgets: [
      { type: 'metric-card', title: 'Farm Performance', size: 'large', config: { metrics: ['overview'] } },
      { type: 'metric-card', title: 'Financial Health', size: 'medium', config: { metrics: ['financial'] } },
      { type: 'chart', title: 'Revenue Trends', size: 'large', config: { chartType: 'line' } },
      { type: 'alert', title: 'Critical Alerts', size: 'medium', config: { severity: ['error'] } },
      { type: 'quick-action', title: 'Management Actions', size: 'medium' }
    ],
    layout: {
      columns: 3,
      rowHeight: 100,
      defaultPositions: [
        { type: 'metric-card', x: 0, y: 0, w: 2, h: 2 },
        { type: 'metric-card', x: 2, y: 0, w: 1, h: 1 },
        { type: 'chart', x: 0, y: 2, w: 2, h: 2 },
        { type: 'alert', x: 2, y: 1, w: 1, h: 1 },
        { type: 'quick-action', x: 2, y: 2, w: 1, h: 1 }
      ]
    }
  },
  {
    id: 'livestock-manager',
    name: 'Livestock Manager',
    description: 'Focused on animal health and production',
    category: 'livestock',
    role: 'manager',
    widgets: [
      { type: 'metric-card', title: 'Animal Health', size: 'medium', config: { metrics: ['health'] } },
      { type: 'metric-card', title: 'Production Metrics', size: 'medium', config: { metrics: ['production'] } },
      { type: 'chart', title: 'Weight Trends', size: 'large', config: { chartType: 'line' } },
      { type: 'alert', title: 'Health Alerts', size: 'small', config: { severity: ['warning', 'error'] } },
      { type: 'table', title: 'Recent Treatments', size: 'medium', config: { limit: 10 } }
    ],
    layout: {
      columns: 3,
      rowHeight: 100,
      defaultPositions: [
        { type: 'metric-card', x: 0, y: 0, w: 1, h: 1 },
        { type: 'metric-card', x: 1, y: 0, w: 1, h: 1 },
        { type: 'chart', x: 0, y: 1, w: 2, h: 2 },
        { type: 'alert', x: 2, y: 0, w: 1, h: 1 },
        { type: 'table', x: 2, y: 1, w: 1, h: 2 }
      ]
    }
  },
  {
    id: 'crop-specialist',
    name: 'Crop Management',
    description: 'Crop monitoring and planning',
    category: 'crops',
    role: 'manager',
    widgets: [
      { type: 'metric-card', title: 'Crop Status', size: 'medium', config: { metrics: ['crops'] } },
      { type: 'chart', title: 'Yield Analysis', size: 'large', config: { chartType: 'bar' } },
      { type: 'weather', title: 'Weather Forecast', size: 'small' },
      { type: 'alert', title: 'Pest & Disease Alerts', size: 'medium' },
      { type: 'calendar', title: 'Planting Schedule', size: 'medium' }
    ],
    layout: {
      columns: 3,
      rowHeight: 100,
      defaultPositions: [
        { type: 'metric-card', x: 0, y: 0, w: 1, h: 1 },
        { type: 'chart', x: 0, y: 1, w: 2, h: 2 },
        { type: 'weather', x: 1, y: 0, w: 1, h: 1 },
        { type: 'alert', x: 2, y: 0, w: 1, h: 1 },
        { type: 'calendar', x: 2, y: 1, w: 1, h: 2 }
      ]
    }
  }
];

export function useDashboardCustomization(farmId: number) {
  const { getAuthHeaders } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  // Get user's dashboard layouts
  const {
    data: layouts,
    isLoading: layoutsLoading,
    error: layoutsError
  } = useQuery({
    queryKey: ['dashboard-layouts', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard-layouts?farm_id=${farmId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard layouts');
      }
      
      return response.json() as Promise<DashboardLayout[]>;
    },
    enabled: !!farmId
  });

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: Partial<DashboardLayout>) => {
      const response = await fetch('/api/dashboard-layouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...layout,
          farm_id: farmId,
          widgets: layout.widgets || currentLayout?.widgets || []
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save layout');
      }
      
      return response.json() as Promise<DashboardLayout>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-layouts', farmId] });
    }
  });

  // Update widget mutation
  const updateWidgetMutation = useMutation({
    mutationFn: async ({ widgetId, updates }: { widgetId: string; updates: Partial<DashboardWidget> }) => {
      const response = await fetch(`/api/dashboard-layouts/widgets/${widgetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update widget');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-layouts', farmId] });
    }
  });

  const createLayoutFromTemplate = useCallback((template: DashboardTemplate, name: string) => {
    const widgets: DashboardWidget[] = template.widgets.map((widget, index) => ({
      ...widget,
      id: `${template.id}-${index}-${Date.now()}`,
      position: template.layout.defaultPositions[index] || { x: 0, y: index },
      isVisible: true,
      isMinimized: false
    }));

    const newLayout: DashboardLayout = {
      id: `layout-${Date.now()}`,
      name,
      description: template.description,
      widgets,
      columns: template.layout.columns,
      rowHeight: template.layout.rowHeight,
      isDefault: false,
      isPublic: false,
      role: template.role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return newLayout;
  }, []);

  const addWidget = useCallback((widget: Omit<DashboardWidget, 'id'>) => {
    if (!currentLayout) return;

    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}`,
      isVisible: true,
      isMinimized: false
    };

    const updatedLayout = {
      ...currentLayout,
      widgets: [...currentLayout.widgets, newWidget],
      updatedAt: new Date()
    };

    setCurrentLayout(updatedLayout);
    saveLayoutMutation.mutate(updatedLayout);
  }, [currentLayout, saveLayoutMutation]);

  const removeWidget = useCallback((widgetId: string) => {
    if (!currentLayout) return;

    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date()
    };

    setCurrentLayout(updatedLayout);
    saveLayoutMutation.mutate(updatedLayout);
  }, [currentLayout, saveLayoutMutation]);

  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    if (!currentLayout) return;

    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates, lastUpdated: new Date() } : w
      ),
      updatedAt: new Date()
    };

    setCurrentLayout(updatedLayout);
    updateWidgetMutation.mutate({ widgetId, updates });
  }, [currentLayout, updateWidgetMutation]);

  const moveWidget = useCallback((widgetId: string, newPosition: { x: number; y: number }) => {
    updateWidget(widgetId, { position: newPosition });
  }, [updateWidget]);

  const resizeWidget = useCallback((widgetId: string, newSize: 'small' | 'medium' | 'large' | 'full') => {
    updateWidget(widgetId, { size: newSize });
  }, [updateWidget]);

  const toggleWidgetMinimized = useCallback((widgetId: string) => {
    if (!currentLayout) return;
    
    const widget = currentLayout.widgets.find(w => w.id === widgetId);
    if (widget) {
      updateWidget(widgetId, { isMinimized: !widget.isMinimized });
    }
  }, [currentLayout, updateWidget]);

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    if (!currentLayout) return;
    
    const widget = currentLayout.widgets.find(w => w.id === widgetId);
    if (widget) {
      updateWidget(widgetId, { isVisible: !widget.isVisible });
    }
  }, [currentLayout, updateWidget]);

  const duplicateWidget = useCallback((widgetId: string) => {
    if (!currentLayout) return;
    
    const widget = currentLayout.widgets.find(w => w.id === widgetId);
    if (widget) {
      const duplicatedWidget: DashboardWidget = {
        ...widget,
        id: `widget-${Date.now()}`,
        title: `${widget.title} (Copy)`,
        position: { x: widget.position.x + 1, y: widget.position.y }
      };
      
      addWidget(duplicatedWidget);
    }
  }, [currentLayout, addWidget]);

  const resetToDefault = useCallback(() => {
    const defaultLayout: DashboardLayout = {
      id: 'default-layout',
      name: 'Default Dashboard',
      widgets: defaultWidgets,
      columns: 3,
      rowHeight: 100,
      isDefault: true,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setCurrentLayout(defaultLayout);
    saveLayoutMutation.mutate(defaultLayout);
  }, [saveLayoutMutation]);

  const exportLayout = useCallback(() => {
    if (!currentLayout) return;
    
    const exportData = {
      layout: currentLayout,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-layout-${currentLayout.name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentLayout]);

  const importLayout = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        const layout = importData.layout as DashboardLayout;
        
        // Generate new IDs for imported widgets
        const widgets = layout.widgets.map(w => ({
          ...w,
          id: `widget-${Date.now()}-${Math.random()}`
        }));
        
        const importedLayout = {
          ...layout,
          id: `layout-${Date.now()}`,
          name: `${layout.name} (Imported)`,
          widgets,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setCurrentLayout(importedLayout);
        saveLayoutMutation.mutate(importedLayout);
      } catch (error) {
        console.error('Failed to import layout:', error);
      }
    };
    reader.readAsText(file);
  }, [saveLayoutMutation]);

  // Load default layout if none exists
  useEffect(() => {
    if (!layoutsLoading && layouts && layouts.length === 0 && !currentLayout) {
      resetToDefault();
    } else if (layouts && layouts.length > 0 && !currentLayout) {
      const defaultLayout = layouts.find(l => l.isDefault) || layouts[0];
      setCurrentLayout(defaultLayout);
    }
  }, [layouts, layoutsLoading, currentLayout, resetToDefault]);

  return {
    // Data
    layouts,
    currentLayout,
    templates: dashboardTemplates,
    isLoading: layoutsLoading,
    error: layoutsError,
    
    // State
    isEditing,
    selectedWidget,
    draggedWidget,
    
    // Actions
    setIsEditing,
    setSelectedWidget,
    setDraggedWidget,
    
    // Layout operations
    saveLayout: saveLayoutMutation.mutate,
    createFromTemplate: createLayoutFromTemplate,
    resetToDefault,
    exportLayout,
    importLayout,
    
    // Widget operations
    addWidget,
    removeWidget,
    updateWidget,
    moveWidget,
    resizeWidget,
    toggleWidgetMinimized,
    toggleWidgetVisibility,
    duplicateWidget,
    
    // Mutations status
    isSaving: saveLayoutMutation.isPending,
    isUpdating: updateWidgetMutation.isPending
  };
}
