import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  // Clock,
  DollarSign,
  Users,
  Settings,
  Zap,
  BarChart3,
  Target,
  Brain,
  ArrowUpRight,
  // ArrowDownRight,
  RefreshCw,
  Play,
  Pause,
  // Filter,
  // Download,
  // Upload,
  Bell,
  // Eye,
  AlertTriangle,
  Info,
  // Calendar,
  // Map,
  Sprout,
  Package,
  Truck,
  // Wrench,
  // Lightbulb,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface SystemDashboard {
  farm: {
    id?: string;
    name?: string;
    location?: string;
    animal_count?: number;
    crop_count?: number;
    field_count?: number;
    task_count?: number;
    total_revenue?: number;
    total_expenses?: number;
  } | null;
  animals: Array<{
    species: string;
    count: number;
    healthy_count: number;
    avg_weight: number;
  }>;
  crops: Array<{
    crop_type: string;
    count: number;
    avg_yield: number;
    mature_count: number;
  }>;
  fields: {
    total_fields: number;
    avg_area: number;
    cultivated_fields: number;
  } | null;
  inventory: {
    total_items: number;
    low_stock_items: number;
    total_value: number;
  } | null;
  tasks: {
    total_tasks: number;
    completed_tasks: number;
    active_tasks: number;
    overdue_tasks: number;
  } | null;
  finance: {
    revenue: number;
    expenses: number;
    net_profit: number;
  } | null;
  alerts: Alert[];
  insights: Insight[];
}

interface Alert {
  type: 'error' | 'warning' | 'info' | 'success';
  category: string;
  message: string;
  count: number;
  timestamp?: number;
}

interface Insight {
  type: 'improvement' | 'efficiency' | 'optimization' | 'warning';
  category: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
  timestamp?: number;
}

interface IntegrationData {
  relationships: Array<{
    module: string;
    related_module: string;
    relationship_count: number;
  }>;
  data_flows: unknown[];
  integration_points: Array<{
    from: string;
    to: string;
    type: string;
  }>;
}

interface WorkflowData {
  workflows: Array<{
    workflow_name: string;
    trigger_type: string;
    status: string;
    execution_count: number;
    last_execution: string | null;
  }>;
  process_automation: unknown;
  efficiency_metrics: unknown;
}

type ViewMode = 'dashboard' | 'integrations' | 'workflows' | 'optimization' | 'insights';

export function AdvancedManagementDashboard() {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // WebSocket integration for real-time updates
  const {
    isConnected: isWebSocketConnected,
    connectionStatus: wsStatus,
    lastMessage: wsMessage,
    connect: connectWebSocket,
    subscribeToFarm,
    // requestDashboardData,
    // isAuthenticated: isWsAuthenticated,
  } = useWebSocket();

  const [selectedFarm, setSelectedFarm] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [realtimeData, setRealtimeData] = useState<SystemDashboard | null>(null);
  const [connectionIndicator, setConnectionIndicator] = useState<
    'online' | 'offline' | 'connecting'
  >('connecting');

  // Get system dashboard data
  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['system', 'dashboard', selectedFarm],
    queryFn: async () => {
      const response = await fetch(
        `/api/system-integration?farm_id=${selectedFarm}&type=dashboard`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      return response.json() as Promise<SystemDashboard>;
    },
    enabled: isAuthenticated(),
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  // Get integration data
  const { data: integrations } = useQuery({
    queryKey: ['system', 'integrations', selectedFarm],
    queryFn: async () => {
      const response = await fetch(
        `/api/system-integration?farm_id=${selectedFarm}&type=integration`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch integration data');
      }

      return response.json() as Promise<IntegrationData>;
    },
    enabled: isAuthenticated() && viewMode === 'integrations',
  });

  // Get workflow data
  const { data: workflows } = useQuery({
    queryKey: ['system', 'workflows', selectedFarm],
    queryFn: async () => {
      const response = await fetch(
        `/api/system-integration?farm_id=${selectedFarm}&type=workflow`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch workflow data');
      }

      return response.json() as Promise<WorkflowData>;
    },
    enabled: isAuthenticated() && viewMode === 'workflows',
  });

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && dashboard) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
        queryClient.invalidateQueries({ queryKey: ['system', 'dashboard'] });
      }, 30000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, queryClient, dashboard, setLastUpdated]);

  // WebSocket connection and farm subscription
  useEffect(() => {
    if (isAuthenticated() && !isWebSocketConnected) {
      connectWebSocket();
    }
  }, [isAuthenticated, isWebSocketConnected, connectWebSocket]);

  useEffect(() => {
    if (isWebSocketConnected && selectedFarm) {
      subscribeToFarm(selectedFarm.toString());
    }
  }, [isWebSocketConnected, selectedFarm, subscribeToFarm]);

  const handleFarmBroadcast = useCallback(
    (broadcastData: { type: string }) => {
      const REFRESH_TYPES = ['new_task', 'task_update', 'inventory_alert', 'animal_health_alert'];

      if (REFRESH_TYPES.includes(broadcastData.type)) {
        setRealtimeData(prev => (prev ? { ...prev } : null));
        setLastUpdated(new Date());
      } else {
        queryClient.invalidateQueries({ queryKey: ['system', 'dashboard'] });
      }
    },
    [queryClient]
  );

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!wsMessage) return;

    if (wsMessage.type === 'initial_data' || wsMessage.type === 'heartbeat') {
      setConnectionIndicator('online');
      return;
    }

    if (wsMessage.type === 'error') {
      setConnectionIndicator('offline');
      return;
    }

    if (wsMessage.farm_id !== selectedFarm.toString()) return;

    if (wsMessage.type === 'dashboard_update' && wsMessage.data) {
      setRealtimeData(wsMessage.data as SystemDashboard);
      setLastUpdated(new Date());
    } else if (wsMessage.type === 'farm_broadcast' && wsMessage.data) {
      handleFarmBroadcast(wsMessage.data as { type: string });
    }
  }, [wsMessage, selectedFarm, queryClient, handleFarmBroadcast]);

  // Connection status indicator
  useEffect(() => {
    if (isWebSocketConnected) {
      setConnectionIndicator('online');
    } else if (wsStatus === 'connecting') {
      setConnectionIndicator('connecting');
    } else {
      setConnectionIndicator('offline');
    }
  }, [isWebSocketConnected, wsStatus]);

  const triggerWorkflowMutation = useMutation({
    mutationFn: async (action: string) => {
      const response = await fetch('/api/system-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          action,
          farm_id: selectedFarm,
          data: {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system'] });
    },
  });

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">
            You need to be logged in to access the management dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading management dashboard...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error loading dashboard</h2>
          <p className="text-gray-600">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement':
        return <Target className="h-4 w-4 text-purple-500" />;
      case 'efficiency':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'optimization':
        return <Brain className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionIcon = () => {
    switch (connectionIndicator) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-yellow-500 animate-pulse" />;
    }
  };

  // Use real-time data if available, otherwise fall back to cached data
  const currentData = realtimeData || dashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Management Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive farm management with real-time updates and AI-powered insights
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                {getConnectionIcon()}
                <span className="text-sm text-gray-600">
                  {connectionIndicator === 'online'
                    ? 'Live updates'
                    : connectionIndicator === 'connecting'
                      ? 'Connecting...'
                      : 'Offline mode'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
                >
                  {autoRefresh ? (
                    <Pause className="h-3 w-3 mr-1" />
                  ) : (
                    <Play className="h-3 w-3 mr-1" />
                  )}
                  {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedFarm}
              onChange={e => setSelectedFarm(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Main Farm</option>
              {/* Add more farms as needed */}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { key: 'integrations', label: 'Integrations', icon: Settings },
              { key: 'workflows', label: 'Workflows', icon: Zap },
              { key: 'optimization', label: 'Optimization', icon: Brain },
              { key: 'insights', label: 'Insights', icon: Lightbulb },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as ViewMode)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  viewMode === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {key === 'dashboard' && currentData?.alerts && currentData.alerts.length > 0 && (
                  <Badge className="bg-red-100 text-red-800">{currentData.alerts.length}</Badge>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {viewMode === 'dashboard' && currentData && (
          <div className="space-y-8">
            {/* System Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Farm Performance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {currentData.farm?.animal_count || 0} Animals
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentData.fields?.total_fields || 0} fields managed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Task Efficiency</CardTitle>
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(
                      ((currentData.tasks?.completed_tasks || 0) /
                        (currentData.tasks?.total_tasks || 1)) *
                        100
                    )}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">Completion rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      (currentData.finance?.net_profit || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    ${(currentData.finance?.net_profit || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">30-day net profit</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Status</CardTitle>
                  <Package className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {currentData.inventory?.low_stock_items || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Low stock alerts</p>
                </CardContent>
              </Card>
            </div>

            {/* Cross-Module Integration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-green-500" />
                    Crop Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Crops:</span>
                      <span className="text-sm font-medium">{currentData.crops?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Mature Plants:</span>
                      <span className="text-sm font-medium">
                        {currentData.crops?.reduce(
                          (sum, crop) => sum + (crop.mature_count || 0),
                          0
                        ) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Yield:</span>
                      <span className="text-sm font-medium">
                        {Math.round(
                          currentData.crops?.reduce((sum, crop) => sum + (crop.avg_yield || 0), 0) /
                            (currentData.crops?.length || 1) || 0
                        )}{' '}
                        units
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Animal Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Animals:</span>
                      <span className="text-sm font-medium">
                        {currentData.animals?.reduce((sum, animal) => sum + animal.count, 0) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Healthy:</span>
                      <span className="text-sm font-medium">
                        {currentData.animals?.reduce(
                          (sum, animal) => sum + animal.healthy_count,
                          0
                        ) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Weight:</span>
                      <span className="text-sm font-medium">
                        {Math.round(
                          currentData.animals?.reduce(
                            (sum, animal) => sum + (animal.avg_weight || 0),
                            0
                          ) / (currentData.animals?.length || 1) || 0
                        )}{' '}
                        kg
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-purple-500" />
                    Logistics & Supply
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Items:</span>
                      <span className="text-sm font-medium">
                        {currentData.inventory?.total_items || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Stock Value:</span>
                      <span className="text-sm font-medium">
                        ${(currentData.inventory?.total_value || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Utilization:</span>
                      <span className="text-sm font-medium">
                        {Math.round(
                          (1 -
                            (currentData.inventory?.low_stock_items || 0) /
                              (currentData.inventory?.total_items || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts and Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-red-500" />
                    System Alerts
                    {realtimeData && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        LIVE
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentData.alerts && currentData.alerts.length > 0 ? (
                      currentData.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs text-gray-600 capitalize">{alert.category}</p>
                          </div>
                          <Badge variant={alert.type === 'error' ? 'destructive' : 'secondary'}>
                            {alert.count}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">All systems running smoothly</p>
                        {realtimeData && (
                          <p className="text-xs text-green-600 mt-1">Real-time monitoring active</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    AI Insights & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentData.insights && currentData.insights.length > 0 ? (
                      currentData.insights.map((insight, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
                        >
                          <div className="flex items-start gap-3">
                            {getInsightIcon(insight.type)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium">{insight.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {insight.impact} impact
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                              <p className="text-xs text-blue-600 font-medium">
                                💡 {insight.suggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No insights available yet</p>
                        <p className="text-xs text-gray-500">System is analyzing your data...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions & Automation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => triggerWorkflowMutation.mutate('sync_inventory')}
                    disabled={triggerWorkflowMutation.isPending}
                    className="h-auto p-4 flex flex-col gap-2"
                  >
                    <Package className="h-6 w-6 text-blue-500" />
                    <span className="text-sm font-medium">Sync Inventory</span>
                    <span className="text-xs text-gray-500">Update stock levels</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => triggerWorkflowMutation.mutate('auto_task_creation')}
                    disabled={triggerWorkflowMutation.isPending}
                    className="h-auto p-4 flex flex-col gap-2"
                  >
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="text-sm font-medium">Auto Tasks</span>
                    <span className="text-xs text-gray-500">Generate routine tasks</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => triggerWorkflowMutation.mutate('financial_insights')}
                    disabled={triggerWorkflowMutation.isPending}
                    className="h-auto p-4 flex flex-col gap-2"
                  >
                    <DollarSign className="h-6 w-6 text-purple-500" />
                    <span className="text-sm font-medium">Financial AI</span>
                    <span className="text-xs text-gray-500">Analyze finances</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => triggerWorkflowMutation.mutate('resource_optimization')}
                    disabled={triggerWorkflowMutation.isPending}
                    className="h-auto p-4 flex flex-col gap-2"
                  >
                    <Brain className="h-6 w-6 text-orange-500" />
                    <span className="text-sm font-medium">Optimize</span>
                    <span className="text-xs text-gray-500">Resource allocation</span>
                  </Button>
                </div>
                {triggerWorkflowMutation.isPending && (
                  <div className="flex items-center justify-center mt-4 p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Processing automation...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other tabs would be implemented similarly... */}
        {viewMode === 'integrations' && integrations && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Module Integrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Relationships</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {integrations.relationships?.map((rel, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">
                          {rel.module} → {rel.related_module}
                        </span>
                        <Badge>{rel.relationship_count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Integration Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {integrations.integration_points?.map((point, index) => (
                      <div key={index} className="p-2 bg-blue-50 rounded">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">
                            {point.from} → {point.to}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{point.type}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Additional tabs would be implemented here */}
        {viewMode === 'workflows' && workflows && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Workflow Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.workflows?.map((workflow, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{workflow.workflow_name}</CardTitle>
                    <CardDescription>{workflow.trigger_type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Status:</span>
                        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                          {workflow.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Executions:</span>
                        <span className="text-sm font-medium">{workflow.execution_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Last run:</span>
                        <span className="text-sm font-medium">
                          {workflow.last_execution
                            ? new Date(workflow.last_execution).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvancedManagementDashboard;
