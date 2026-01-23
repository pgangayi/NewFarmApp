import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  category: 'financial' | 'operational' | 'production' | 'inventory' | 'livestock' | 'crops';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastUpdated: Date;
  target?: number;
  benchmark?: number;
}

export interface AnalyticsInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  category: string;
  metrics: string[];
  suggestedActions: string[];
  potentialImpact: {
    financial?: number;
    efficiency?: number;
    risk?: number;
  };
  confidence: number;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'yield_prediction' | 'market_forecast' | 'resource_optimization' | 'risk_assessment';
  accuracy: number;
  predictions: Array<{
    date: Date;
    value: number;
    confidence: number;
    factors: Array<{
      name: string;
      impact: number;
      weight: number;
    }>;
  }>;
  lastTrained: Date;
  nextTraining: Date;
}

export interface PerformanceScore {
  overall: number;
  categories: {
    financial: number;
    operational: number;
    production: number;
    sustainability: number;
    growth: number;
  };
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  trend: 'improving' | 'declining' | 'stable';
  period: string;
}

export interface BenchmarkComparison {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topQuartile: number;
  percentile: number;
  ranking: 'below_average' | 'average' | 'above_average' | 'top_performer';
}

export function useAdvancedAnalytics(farmId: number) {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  >('monthly');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'financial',
    'operational',
    'production',
  ]);
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);

  // Get analytics metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['analytics-metrics', farmId, selectedTimeframe, selectedCategories, customDateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        farm_id: farmId.toString(),
        timeframe: selectedTimeframe,
        categories: selectedCategories.join(','),
      });

      if (customDateRange) {
        params.append('start_date', customDateRange.start.toISOString());
        params.append('end_date', customDateRange.end.toISOString());
      }

      const response = await fetch(`/api/analytics/metrics?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics metrics');
      }

      return response.json() as Promise<AnalyticsMetric[]>;
    },
    enabled: isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  // Get AI insights
  const {
    data: insights,
    isLoading: insightsLoading,
    refetch: refetchInsights,
  } = useQuery({
    queryKey: ['analytics-insights', farmId, selectedCategories],
    queryFn: async () => {
      const params = new URLSearchParams({
        farm_id: farmId.toString(),
        categories: selectedCategories.join(','),
      });

      const response = await fetch(`/api/analytics/insights?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics insights');
      }

      return response.json() as Promise<AnalyticsInsight[]>;
    },
    enabled: isAuthenticated(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });

  // Get predictive models
  const { data: predictiveModels, isLoading: predictiveLoading } = useQuery({
    queryKey: ['predictive-models', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/predictive-models?farm_id=${farmId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch predictive models');
      }

      return response.json() as Promise<PredictiveModel[]>;
    },
    enabled: isAuthenticated(),
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: 6 * 60 * 60 * 1000, // 6 hours
  });

  // Get performance scores
  const { data: performanceScore, isLoading: performanceLoading } = useQuery({
    queryKey: ['performance-score', farmId, selectedTimeframe],
    queryFn: async () => {
      const params = new URLSearchParams({
        farm_id: farmId.toString(),
        timeframe: selectedTimeframe,
      });

      const response = await fetch(`/api/analytics/performance-score?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch performance score');
      }

      return response.json() as Promise<PerformanceScore>;
    },
    enabled: isAuthenticated(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });

  // Get benchmark comparisons
  const { data: benchmarks, isLoading: benchmarksLoading } = useQuery({
    queryKey: ['benchmarks', farmId, selectedCategories],
    queryFn: async () => {
      const params = new URLSearchParams({
        farm_id: farmId.toString(),
        categories: selectedCategories.join(','),
      });

      const response = await fetch(`/api/analytics/benchmarks?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch benchmarks');
      }

      return response.json() as Promise<BenchmarkComparison[]>;
    },
    enabled: isAuthenticated(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Generate custom report
  const generateReport = useCallback(
    async (reportConfig: {
      title: string;
      metrics: string[];
      timeframe: string;
      includeInsights: boolean;
      includePredictions: boolean;
      format: 'pdf' | 'excel' | 'json';
    }) => {
      const response = await fetch('/api/analytics/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          farm_id: farmId,
          ...reportConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      return response.json();
    },
    [farmId, getAuthHeaders]
  );

  // Calculate key performance indicators
  const kpis = useMemo(() => {
    if (!metrics) return {};

    return metrics.reduce(
      (acc, metric) => {
        const key = `${metric.category}_${metric.name}`;
        acc[key] = {
          value: metric.value,
          trend: metric.trend,
          trendPercentage: metric.trendPercentage,
          target: metric.target,
          performance: metric.target ? (metric.value / metric.target) * 100 : null,
        };
        return acc;
      },
      {} as Record<string, any>
    );
  }, [metrics]);

  // Get top insights by priority
  const prioritizedInsights = useMemo(() => {
    if (!insights) return [];

    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    return insights
      .filter(insight => !insight.expiresAt || insight.expiresAt > new Date())
      .sort((a, b) => {
        const priorityDiff = priorityOrder[b.severity] - priorityOrder[a.severity];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      });
  }, [insights]);

  // Calculate trend analysis
  const trendAnalysis = useMemo(() => {
    if (!metrics) return {};

    return metrics.reduce(
      (acc, metric) => {
        const trend = {
          direction: metric.trend,
          magnitude: Math.abs(metric.trendPercentage),
          significance:
            metric.trendPercentage > 10 ? 'high' : metric.trendPercentage > 5 ? 'medium' : 'low',
        };
        acc[metric.id] = trend;
        return acc;
      },
      {} as Record<string, any>
    );
  }, [metrics]);

  // Get performance summary
  const performanceSummary = useMemo(() => {
    if (!performanceScore) return null;

    const { overall, categories, trend } = performanceScore;

    return {
      overall,
      categories,
      trend,
      grade:
        overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F',
      status:
        overall >= 80 ? 'excellent' : overall >= 60 ? 'good' : overall >= 40 ? 'fair' : 'poor',
    };
  }, [performanceScore]);

  // Benchmark analysis
  const benchmarkAnalysis = useMemo(() => {
    if (!benchmarks) return {};

    return benchmarks.reduce(
      (acc, benchmark) => {
        acc[benchmark.metric] = {
          performance: benchmark.percentile,
          ranking: benchmark.ranking,
          gap: benchmark.industryAverage - benchmark.yourValue,
          opportunity: benchmark.topQuartile - benchmark.yourValue,
        };
        return acc;
      },
      {} as Record<string, any>
    );
  }, [benchmarks]);

  // Refresh all analytics data
  const refreshAllData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['analytics-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-insights'] });
    queryClient.invalidateQueries({ queryKey: ['predictive-models'] });
    queryClient.invalidateQueries({ queryKey: ['performance-score'] });
    queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
  }, [queryClient]);

  // Export analytics data
  const exportData = useCallback(
    async (format: 'json' | 'csv' | 'excel') => {
      const response = await fetch(`/api/analytics/export?format=${format}&farm_id=${farmId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      return response.blob();
    },
    [farmId, getAuthHeaders]
  );

  return {
    // Data
    metrics: metrics || [],
    insights: insights || [],
    predictiveModels: predictiveModels || [],
    performanceScore,
    benchmarks: benchmarks || [],

    // Loading states
    isLoading:
      metricsLoading ||
      insightsLoading ||
      predictiveLoading ||
      performanceLoading ||
      benchmarksLoading,
    error: metricsError,

    // Computed values
    kpis,
    prioritizedInsights,
    trendAnalysis,
    performanceSummary,
    benchmarkAnalysis,

    // State management
    selectedTimeframe,
    setSelectedTimeframe,
    selectedCategories,
    setSelectedCategories,
    customDateRange,
    setCustomDateRange,

    // Actions
    generateReport,
    refreshAllData,
    exportData,
    refetchMetrics,
    refetchInsights,
  };
}

// Helper hook for real-time analytics updates
export function useRealTimeAnalytics(farmId: number) {
  const [realTimeMetrics, setRealTimeMetrics] = useState<AnalyticsMetric[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    if (!farmId) return;

    // WebSocket connection for real-time updates
    const ws = new WebSocket(
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/analytics/realtime?farm_id=${farmId}`
    );

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Real-time analytics connected');
    };

    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      setRealTimeMetrics(prev => {
        const existingIndex = prev.findIndex(m => m.id === data.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...data };
          return updated;
        }
        return [...prev, data];
      });
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Real-time analytics disconnected');
    };

    ws.onerror = error => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [farmId]);

  return {
    realTimeMetrics,
    isConnected,
  };
}
