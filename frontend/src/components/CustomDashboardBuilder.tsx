import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Plus,
  Trash2,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Package,
  Save,
  Eye,
  Edit3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from '../hooks/use-toast';

interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: Record<string, any>;
}

interface WidgetTemplate {
  type: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  defaultSize: 'small' | 'medium' | 'large';
  defaultConfig: Record<string, any>;
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    type: 'kpi-card',
    name: 'KPI Card',
    description: 'Display key performance indicators',
    icon: BarChart3,
    defaultSize: 'small',
    defaultConfig: {
      metric: 'total_revenue',
      title: 'Total Revenue',
      format: 'currency',
    },
  },
  {
    type: 'line-chart',
    name: 'Line Chart',
    description: 'Show trends over time',
    icon: TrendingUp,
    defaultSize: 'medium',
    defaultConfig: {
      dataSource: 'crop_yields',
      xAxis: 'date',
      yAxis: 'yield',
      title: 'Yield Trends',
    },
  },
  {
    type: 'pie-chart',
    name: 'Pie Chart',
    description: 'Display proportional data',
    icon: PieChart,
    defaultSize: 'medium',
    defaultConfig: {
      dataSource: 'crop_distribution',
      title: 'Crop Distribution',
    },
  },
  {
    type: 'activity-feed',
    name: 'Activity Feed',
    description: 'Recent farm activities',
    icon: Activity,
    defaultSize: 'large',
    defaultConfig: {
      limit: 10,
      showIcons: true,
    },
  },
  {
    type: 'financial-summary',
    name: 'Financial Summary',
    description: 'Revenue, expenses, and profit overview',
    icon: DollarSign,
    defaultSize: 'medium',
    defaultConfig: {
      showTrends: true,
      period: 'month',
    },
  },
  {
    type: 'calendar-view',
    name: 'Calendar View',
    description: 'Upcoming tasks and events',
    icon: Calendar,
    defaultSize: 'large',
    defaultConfig: {
      view: 'month',
      showCompleted: false,
    },
  },
  {
    type: 'field-map',
    name: 'Field Map',
    description: 'Interactive field mapping',
    icon: MapPin,
    defaultSize: 'large',
    defaultConfig: {
      showBoundaries: true,
      showCropTypes: true,
    },
  },
  {
    type: 'team-overview',
    name: 'Team Overview',
    description: 'Team member activities and assignments',
    icon: Users,
    defaultSize: 'medium',
    defaultConfig: {
      showAvatars: true,
      showRoles: true,
    },
  },
  {
    type: 'inventory-status',
    name: 'Inventory Status',
    description: 'Current inventory levels and alerts',
    icon: Package,
    defaultSize: 'medium',
    defaultConfig: {
      showLowStock: true,
      showExpiring: true,
    },
  },
];

interface CustomDashboardBuilderProps {
  farmId: string;
  initialConfig?: {
    name: string;
    widgets: DashboardWidget[];
    layout: string;
  };
  onSave?: (config: any) => void;
  onPreview?: (config: any) => void;
}

export function CustomDashboardBuilder({
  farmId,
  initialConfig,
  onSave,
  onPreview: _onPreview,
}: CustomDashboardBuilderProps) {
  const { toast } = useToast();
  const [dashboardName, setDashboardName] = useState(initialConfig?.name || 'My Custom Dashboard');
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialConfig?.widgets || []);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const addWidget = (template: WidgetTemplate) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: template.type,
      title: template.name,
      size: template.defaultSize,
      position: { x: 0, y: 0 },
      config: { ...template.defaultConfig },
    };

    setWidgets(prev => [...prev, newWidget]);
    setSelectedWidget(newWidget);
    setIsWidgetDialogOpen(true);
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  const updateWidget = (widgetId: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(w => (w.id === widgetId ? { ...w, ...updates } : w)));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    if (reorderedItem) {
      items.splice(result.destination.index, 0, reorderedItem);
    }

    setWidgets(items);
  };

  const saveDashboard = () => {
    const config = {
      name: dashboardName,
      widgets,
      layout: 'grid',
      farmId,
      updatedAt: new Date().toISOString(),
    };

    if (onSave) {
      onSave(config);
    }

    toast({
      title: 'Dashboard Saved',
      description: 'Your custom dashboard has been saved successfully.',
    });
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const getWidgetSizeClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-2';
      case 'large':
        return 'col-span-3';
      default:
        return 'col-span-1';
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    const template = WIDGET_TEMPLATES.find(t => t.type === widget.type);
    const Icon = template?.icon || BarChart3;

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </div>
            {!isPreviewMode && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedWidget(widget);
                    setIsWidgetDialogOpen(true);
                  }}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => removeWidget(widget.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{widget.title} Widget</p>
            <p className="text-xs text-gray-400 mt-1">Preview not available</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Dashboard Builder</h2>
          <p className="text-gray-600 mt-1">
            Create personalized dashboards with custom widgets and layouts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={togglePreview}>
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button onClick={saveDashboard}>
            <Save className="h-4 w-4 mr-2" />
            Save Dashboard
          </Button>
        </div>
      </div>

      {/* Dashboard Name */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label htmlFor="dashboard-name" className="text-sm font-medium text-gray-700">
              Dashboard Name:
            </label>
            <Input
              id="dashboard-name"
              value={dashboardName}
              onChange={e => setDashboardName(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Widget Library */}
        {!isPreviewMode && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Widget Library</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {WIDGET_TEMPLATES.map(template => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.type}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        onClick={() => addWidget(template)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-sm">{template.name}</h4>
                            <p className="text-xs text-gray-600">{template.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {template.defaultSize}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dashboard Canvas */}
        <div className={isPreviewMode ? 'lg:col-span-4' : 'lg:col-span-3'}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dashboard Canvas
                {!isPreviewMode && (
                  <Badge variant="outline" className="ml-2">
                    {widgets.length} widgets
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {widgets.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets added yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start building your dashboard by adding widgets from the library.
                  </p>
                  {!isPreviewMode && WIDGET_TEMPLATES[0] && (
                    <Button onClick={() => addWidget(WIDGET_TEMPLATES[0]!)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Widget
                    </Button>
                  )}
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="dashboard-widgets">
                    {provided => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-3 gap-4 min-h-[400px]"
                      >
                        {widgets.map((widget, index) => (
                          <Draggable
                            key={widget.id}
                            draggableId={widget.id}
                            index={index}
                            isDragDisabled={isPreviewMode}
                          >
                            {provided => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${getWidgetSizeClass(widget.size)} ${
                                  !isPreviewMode ? 'cursor-move' : ''
                                }`}
                              >
                                {renderWidget(widget)}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Widget Configuration Dialog */}
      <Dialog open={isWidgetDialogOpen} onOpenChange={setIsWidgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Widget</DialogTitle>
          </DialogHeader>
          {selectedWidget && (
            <div className="space-y-4">
              <div>
                <label htmlFor="widget-title" className="text-sm font-medium text-gray-700">
                  Title
                </label>
                <Input
                  id="widget-title"
                  value={selectedWidget.title}
                  onChange={e => updateWidget(selectedWidget.id, { title: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="widget-size" className="text-sm font-medium text-gray-700">
                  Size
                </label>
                <Select
                  value={selectedWidget.size}
                  onValueChange={(value: string) =>
                    updateWidget(selectedWidget.id, { size: value as 'small' | 'medium' | 'large' })
                  }
                >
                  <SelectTrigger id="widget-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Additional configuration options would go here based on widget type */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsWidgetDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsWidgetDialogOpen(false)}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CustomDashboardBuilder;
