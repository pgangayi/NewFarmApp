import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Sprout,
  Package,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Zap,
  Database,
  Server,
  HardDrive,
  User,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface PerformanceMetrics {
  overall_score: number;
  time_range: string;
  last_updated: string;
  metrics: {
    task_completion_rate: number;
    inventory_turnover: number;
    profit_margin: number;
    animal_health_score: number;
    crop_yield_performance: number;
  };
  trends: {
    performance_trend: {
      direction: 'improving' | 'declining' | 'stable';
      change_percent: number;
      period: string;
    };
    improvement_areas: Array<{
      area: string;
      priority: 'high' | 'medium' | 'low';
      current_score: number;
      recommendation: string;
    }>;
  };
}

interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error';
    response_time: number | null;
    message: string;
  };
  api_performance: {
    status: 'healthy' | 'warning' | 'error';
    avg_response_time: number;
    endpoints_checked: string[];
    message: string;
  };
  storage: {
    status: 'healthy' | 'warning' | 'error';
    usage_percent: number;
    available_gb: number;
    message: string;
  };
  user_activity: {
    status: 'healthy' | 'warning' | 'error';
    recent_actions: number;
    message: string;
  };
  timestamp: string;
  status: 'healthy' | 'minor_warning' | 'warning' | 'critical';
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'minor_warning':
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'minor_warning':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'error':
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getMetricIcon = (metricName: string) => {
  switch (metricName.toLowerCase()) {
    case 'task_completion_rate':
      return <CheckCircle className="h-5 w-5 text-blue-500" />;
    case 'inventory_turnover':
      return <Package className="h-5 w-5 text-orange-500" />;
    case 'profit_margin':
      return <DollarSign className="h-5 w-5 text-green-500" />;
    case 'animal_health_score':
      return <Users className="h-5 w-5 text-purple-500" />;
    case 'crop_yield_performance':
      return <Sprout className="h-5 w-5 text-green-600" />;
    default:
      return <BarChart3 className="h-5 w-5 text-gray-500" />;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getTrendIcon = (direction: string) => {
  switch (direction) {
    case 'improving':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'declining':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-500" />;
  }
};

interface PerformanceMonitoringDashboardProps {
  currentFarmId?: number;
}

export function PerformanceMonitoringDashboard({
  currentFarmId,
}: PerformanceMonitoringDashboardProps) {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const { isConnected: isWebSocketConnected, lastMessage: wsMessage } = useWebSocket();

  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch performance overview
  const {
    data: performanceData,
    isLoading: performanceLoading,
    error: performanceError,
    refetch: refetchPerformance,
  } = useQuery({
    queryKey: ['performance', 'overview', currentFarmId, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'overview',
        ...(currentFarmId ? { farm_id: currentFarmId.toString() } : {}),
        time_range: timeRange,
      });

      const response = await fetch(`/api/performance?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }

      return response.json() as Promise<{ data: PerformanceMetrics }>;
    },
    enabled: isAuthenticated(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch system health
  const {
    data: systemHealthData,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['performance', 'system-health', currentFarmId],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'system_health',
        ...(currentFarmId ? { farm_id: currentFarmId.toString() } : {}),
      });

      const response = await fetch(`/api/performance?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system health data');
      }

      return response.json() as Promise<{ data: SystemHealth }>;
    },
    enabled: isAuthenticated(),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Handle WebSocket updates for real-time performance data
  useEffect(() => {
    if (wsMessage?.type === 'performance_update') {
      setLastUpdated(new Date());
      // Refetch performance data when update is received
      refetchPerformance();
      refetchHealth();
    }
  }, [wsMessage, refetchPerformance, refetchHealth]);

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLastUpdated(new Date());
    refetchPerformance();
    refetchHealth();
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">
            You need to be logged in to access the performance monitoring dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (performanceLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (performanceError || healthError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error loading performance data</h2>
          <p className="text-gray-600 mb-4">{performanceError?.message || healthError?.message}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const performance = performanceData?.data;
  const systemHealth = systemHealthData?.data;

  if (!performance || !systemHealth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No performance data available</h2>
          <p className="text-gray-600">Performance data could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Monitoring Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Real-time system performance tracking and business intelligence insights
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
                {isWebSocketConnected && (
                  <Badge variant="outline" className="text-xs">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                    Live
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              {['1d', '7d', '30d', '90d'].map(range => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimeRangeChange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Performance Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(performance.overall_score)}`}>
                {performance.overall_score}/100
              </div>
              <div className="flex items-center gap-2 mt-2">
                {getTrendIcon(performance.trends.performance_trend.direction)}
                <span className="text-sm text-muted-foreground">
                  {performance.trends.performance_trend.change_percent > 0 ? '+' : ''}
                  {performance.trends.performance_trend.change_percent}% vs last{' '}
                  {performance.trends.performance_trend.period}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              {getStatusIcon(systemHealth.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {systemHealth.status.replace('_', ' ')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Database: {systemHealth.database.response_time}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Metric</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...Object.values(performance.metrics)).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Best performing area</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Improvement Areas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {performance.trends.improvement_areas.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Areas needing attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(performance.metrics).map(([key, value]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getMetricIcon(key)}
                  <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(value)}`}>
                  {value.toFixed(1)}%
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, value)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Health and Improvement Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Health Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Database</p>
                      <p className="text-xs text-gray-600">{systemHealth.database.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusIcon(systemHealth.database.status)}
                    <p className="text-xs text-gray-600">{systemHealth.database.response_time}ms</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">API Performance</p>
                      <p className="text-xs text-gray-600">
                        {systemHealth.api_performance.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusIcon(systemHealth.api_performance.status)}
                    <p className="text-xs text-gray-600">
                      {systemHealth.api_performance.avg_response_time}ms avg
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Storage</p>
                      <p className="text-xs text-gray-600">{systemHealth.storage.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusIcon(systemHealth.storage.status)}
                    <p className="text-xs text-gray-600">
                      {systemHealth.storage.usage_percent}% used
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">User Activity</p>
                      <p className="text-xs text-gray-600">{systemHealth.user_activity.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusIcon(systemHealth.user_activity.status)}
                    <p className="text-xs text-gray-600">
                      {systemHealth.user_activity.recent_actions} actions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Improvement Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Optimization Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performance.trends.improvement_areas.length > 0 ? (
                  performance.trends.improvement_areas.map((area, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-l-4 border-l-orange-500 bg-orange-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize text-sm">
                          {area.area.replace(/_/g, ' ')} Optimization
                        </h4>
                        <Badge
                          variant={area.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {area.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Current Score: <span className="font-medium">{area.current_score}%</span>
                      </p>
                      <p className="text-sm text-gray-700">💡 {area.recommendation}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">All areas performing well</p>
                    <p className="text-xs text-gray-500">No immediate optimization needed</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PerformanceMonitoringDashboard;
