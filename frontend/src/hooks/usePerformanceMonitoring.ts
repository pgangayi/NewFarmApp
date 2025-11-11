import { useState, useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  databaseQueries: number;
  errorRate: number;
  memoryUsage?: number;
  cpuUsage?: number;
  networkLatency: number;
  renderTime: number;
  bundleSize: number;
}

interface UserInteractionMetrics {
  clicks: number;
  keypresses: number;
  scrolls: number;
  formSubmissions: number;
  navigationTime: number;
  inputLatency: number;
}

interface PerformanceAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
}

const DEFAULT_THRESHOLDS = {
  pageLoadTime: 3000,
  apiResponseTime: 1000,
  errorRate: 0.05,
  networkLatency: 500,
  renderTime: 100,
  memoryUsage: 100 * 1024 * 1024,
  bundleSize: 1024 * 1024,
};

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    databaseQueries: 0,
    errorRate: 0,
    networkLatency: 0,
    renderTime: 0,
    bundleSize: 0,
  });

  const [userMetrics, setUserMetrics] = useState<UserInteractionMetrics>({
    clicks: 0,
    keypresses: 0,
    scrolls: 0,
    formSubmissions: 0,
    navigationTime: 0,
    inputLatency: 0,
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);

  const originalFetch = useRef<typeof fetch>();
  const apiCalls = useRef<{ start: number; end?: number; url: string; method: string }[]>([]);
  const renderStart = useRef<number>();
  const navigationStart = useRef<number>(0);

  useEffect(() => {
    if (!isEnabled) return;

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }));

          if (loadTime > DEFAULT_THRESHOLDS.pageLoadTime) {
            addAlert(
              'warning',
              'pageLoadTime',
              loadTime,
              DEFAULT_THRESHOLDS.pageLoadTime,
              'Page load time exceeds threshold'
            );
          }
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    navigationStart.current = performance.now();

    return () => observer.disconnect();
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;

    originalFetch.current = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = args[1]?.method || 'GET';

      apiCalls.current.push({ start, url, method });

      try {
        const response = await originalFetch.current!(...args);
        const end = performance.now();
        const responseTime = end - start;

        setMetrics(prev => ({
          ...prev,
          apiResponseTime: (prev.apiResponseTime + responseTime) / 2,
        }));

        if (responseTime > DEFAULT_THRESHOLDS.apiResponseTime) {
          addAlert(
            'warning',
            'apiResponseTime',
            responseTime,
            DEFAULT_THRESHOLDS.apiResponseTime,
            'API response time exceeds threshold'
          );
        }

        return response;
      } catch (error) {
        setMetrics(prev => ({
          ...prev,
          errorRate: prev.errorRate + 0.01,
        }));
        throw error;
      }
    };

    return () => {
      if (originalFetch.current) {
        window.fetch = originalFetch.current;
      }
    };
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;

    renderStart.current = performance.now();
  });

  useEffect(() => {
    if (!isEnabled) return;

    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current;
      setMetrics(prev => ({
        ...prev,
        renderTime: (prev.renderTime + renderTime) / 2,
      }));

      if (renderTime > DEFAULT_THRESHOLDS.renderTime) {
        addAlert(
          'warning',
          'renderTime',
          renderTime,
          DEFAULT_THRESHOLDS.renderTime,
          'Component render time exceeds threshold'
        );
      }
    }
  });

  useEffect(() => {
    if (!isEnabled) return;

    const handleClick = () => {
      setUserMetrics(prev => ({ ...prev, clicks: prev.clicks + 1 }));
    };

    const handleKeyPress = () => {
      setUserMetrics(prev => ({ ...prev, keypresses: prev.keypresses + 1 }));
    };

    const handleScroll = () => {
      setUserMetrics(prev => ({ ...prev, scrolls: prev.scrolls + 1 }));
    };

    const handleBeforeUnload = () => {
      const navigationTime = performance.now() - navigationStart.current;
      setUserMetrics(prev => ({ ...prev, navigationTime }));
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;

    const checkNetworkLatency = async () => {
      const start = performance.now();
      try {
        await fetch('/api/health', { method: 'HEAD', cache: 'no-cache' });
        const latency = performance.now() - start;

        setMetrics(prev => ({
          ...prev,
          networkLatency: (prev.networkLatency + latency) / 2,
        }));

        if (latency > DEFAULT_THRESHOLDS.networkLatency) {
          addAlert(
            'warning',
            'networkLatency',
            latency,
            DEFAULT_THRESHOLDS.networkLatency,
            'Network latency exceeds threshold'
          );
        }
      } catch (error) {
        console.warn('Network latency check failed:', error);
      }
    };

    const interval = setInterval(checkNetworkLatency, 30000);
    checkNetworkLatency();

    return () => clearInterval(interval);
  }, [isEnabled]);

  const addAlert = useCallback(
    (
      type: 'error' | 'warning' | 'info',
      metric: string,
      value: number,
      threshold: number,
      message: string
    ) => {
      const alert: PerformanceAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        metric,
        value,
        threshold,
        message,
        timestamp: new Date(),
      };

      setAlerts(prev => [alert, ...prev].slice(0, 10));
    },
    []
  );

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const getPerformanceScore = useCallback(() => {
    let score = 100;

    if (metrics.pageLoadTime > DEFAULT_THRESHOLDS.pageLoadTime) score -= 20;
    if (metrics.apiResponseTime > DEFAULT_THRESHOLDS.apiResponseTime) score -= 20;
    if (metrics.renderTime > DEFAULT_THRESHOLDS.renderTime) score -= 10;
    if (metrics.networkLatency > DEFAULT_THRESHOLDS.networkLatency) score -= 10;
    if (metrics.errorRate > DEFAULT_THRESHOLDS.errorRate) score -= 20;

    return Math.max(0, score);
  }, [metrics]);

  const generateReport = useCallback(() => {
    return {
      timestamp: new Date().toISOString(),
      performanceScore: getPerformanceScore(),
      metrics,
      userMetrics,
      alerts: alerts.slice(0, 5),
      recommendations: generateRecommendations(metrics),
    };
  }, [metrics, userMetrics, alerts, getPerformanceScore]);

  return {
    metrics,
    userMetrics,
    alerts,
    isEnabled,
    setIsEnabled,
    addAlert,
    clearAlerts,
    getPerformanceScore,
    generateReport,
  };
}

function generateRecommendations(metrics: PerformanceMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.pageLoadTime > DEFAULT_THRESHOLDS.pageLoadTime) {
    recommendations.push('Consider implementing code splitting to reduce initial bundle size');
    recommendations.push('Optimize images and static assets');
    recommendations.push('Enable compression and caching');
  }

  if (metrics.apiResponseTime > DEFAULT_THRESHOLDS.apiResponseTime) {
    recommendations.push('Optimize database queries and add indexes');
    recommendations.push('Implement API response caching');
    recommendations.push('Consider using a CDN for static content');
  }

  if (metrics.renderTime > DEFAULT_THRESHOLDS.renderTime) {
    recommendations.push('Optimize React components to reduce re-renders');
    recommendations.push('Implement React.memo for expensive components');
    recommendations.push('Use useCallback and useMemo to prevent unnecessary calculations');
  }

  if (metrics.networkLatency > DEFAULT_THRESHOLDS.networkLatency) {
    recommendations.push('Optimize server response times');
    recommendations.push('Consider using server closer to users');
    recommendations.push('Implement service worker for offline capabilities');
  }

  if (metrics.errorRate > DEFAULT_THRESHOLDS.errorRate) {
    recommendations.push('Review error handling and implement better validation');
    recommendations.push('Add comprehensive error logging');
    recommendations.push('Implement retry logic for failed requests');
  }

  return recommendations;
}

export default usePerformanceMonitoring;
export type { PerformanceMetrics, UserInteractionMetrics, PerformanceAlert };
