import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// --- Type Definitions ---

export type PerformanceMetric = 'lcp' | 'fid' | 'cls' | 'fcp' | 'ttfb';
export type OptimizationType =
  | 'lazy-loading'
  | 'virtualization'
  | 'caching'
  | 'code-splitting'
  | 'preloading'
  | 'debouncing';

export interface OptimizationConfig {
  enableIntersectionObserver: boolean;
  enablePerformanceObserver: boolean;
  enableMemoryMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  virtualScrollThreshold: number;
  lazyLoadMargin: string;
  preloadCriticalResources: boolean;
  cacheMaxSize: number;
  debounceDelay: number;
}

// Standardized MemoryInfo type for clarity
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface PerformanceMetrics {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  memoryUsage?: MemoryInfo;
  connectionType?: string;
  devicePixelRatio?: number;
  viewport?: { width: number; height: number };
  timestamp: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
  size: number;
  hits: number;
}

export interface VirtualItem {
  id: string;
  index: number;
  height: number;
  y: number;
}

export interface LazyLoadingOptions {
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

const DEFAULT_CONFIG: OptimizationConfig = {
  enableIntersectionObserver: true,
  enablePerformanceObserver: true,
  enableMemoryMonitoring: true,
  enableNetworkMonitoring: true,
  virtualScrollThreshold: 100,
  lazyLoadMargin: '50px',
  preloadCriticalResources: true,
  cacheMaxSize: 100,
  debounceDelay: 300,
};

// --- Hooks ---

// Lazy loading hook
export function useLazyLoading(options?: LazyLoadingOptions) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current || !options) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setInView(entry.isIntersecting);
          if (entry.isIntersecting && options.triggerOnce) {
            observer.disconnect();
          }
        }
      },
      {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.1,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [options?.triggerOnce]);

  return { ref, inView };
}

// Virtual scrolling hook
export function useVirtualScrolling(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleEndIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    const items: VirtualItem[] = [];
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
      const y = i * itemHeight;
      items.push({
        id: `item-${i}`,
        index: i,
        height: itemHeight,
        y,
      });
    }
    return items;
  }, [visibleStartIndex, visibleEndIndex, itemHeight]);

  const totalHeight = itemCount * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    handleScroll,
    scrollTop,
    visibleStartIndex,
    visibleEndIndex,
  };
}

// Debounce hook
export function useDebounce<T>(value: T, delay?: number) {
  const debounceDelay = delay || 300;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, debounceDelay]);

  return debouncedValue;
}

// --- Main Hook ---

export function usePerformanceOptimizations(customConfig?: Partial<OptimizationConfig>) {
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...customConfig }), [customConfig]);

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    timestamp: Date.now(),
  });

  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [activeOptimization] = useState<OptimizationType[]>([]);

  const cacheRef = useRef<Map<string, CacheEntry<unknown>>>(new Map());
  const [cache, setCache] = useState<Map<string, CacheEntry<unknown>>>(cacheRef.current);

  const performanceObserverRef = useRef<PerformanceObserver | null>(null);
  const memoryIntervalRef = useRef<number | null>(null);

  // Performance Observer setup
  useEffect(() => {
    if (!config.enablePerformanceObserver || typeof window === 'undefined') return;

    if ('PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver((list: any) => {
        setMetrics(prevMetrics => {
          const newMetrics = { ...prevMetrics, timestamp: Date.now() };

          list.getEntries().forEach((entry: any) => {
            const time = entry.startTime;

            // Core Web Vitals
            if (entry.entryType === 'largest-contentful-paint') {
              newMetrics.lcp = time;
            } else if (entry.entryType === 'first-input') {
              const fidEntry = entry as PerformanceEventTiming;
              newMetrics.fid = fidEntry.processingStart - fidEntry.startTime;
            } else if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              const shiftEntry = entry as any;
              newMetrics.cls = (newMetrics.cls || 0) + shiftEntry.value;
            } else if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              newMetrics.fcp = time;
            } else if (entry.entryType === 'navigation') {
              const nav = entry as PerformanceNavigationTiming;
              newMetrics.ttfb = nav.responseStart - nav.requestStart;
            }
          });
          return newMetrics;
        });
      });

      performanceObserverRef.current.observe({
        entryTypes: [
          'largest-contentful-paint',
          'first-input',
          'layout-shift',
          'paint',
          'navigation',
        ],
      });
    }

    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, [config.enablePerformanceObserver]);

  // Memory monitoring
  useEffect(() => {
    if (!config.enableMemoryMonitoring || typeof window === 'undefined') return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;

        setMetrics(prev => ({
          ...prev,
          memoryUsage: {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          },
        }));
      }
    };

    memoryIntervalRef.current = window.setInterval(checkMemory, 10000);

    return () => {
      if (memoryIntervalRef.current) {
        window.clearInterval(memoryIntervalRef.current);
      }
    };
  }, [config.enableMemoryMonitoring]);

  // Network monitoring
  useEffect(() => {
    if (!config.enableNetworkMonitoring || typeof window === 'undefined') return;

    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setMetrics(prev => ({
          ...prev,
          connectionType: connection.effectiveType,
        }));
      }
    };

    updateNetworkInfo();

    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
    };
  }, [config.enableNetworkMonitoring]);

  // Device information
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      setMetrics(prev => ({
        ...prev,
        devicePixelRatio: window.devicePixelRatio,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      }));
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Performance classification
  useEffect(() => {
    const classifyPerformance = () => {
      let lowPerformanceScore = 0;

      // Standard Core Web Vitals thresholds
      if (metrics.lcp && metrics.lcp > 2500) lowPerformanceScore += 1;
      if (metrics.fid && metrics.fid > 100) lowPerformanceScore += 1;
      if (metrics.cls && metrics.cls > 0.25) lowPerformanceScore += 1;
      if (metrics.fcp && metrics.fcp > 1800) lowPerformanceScore += 1;
      if (metrics.ttfb && metrics.ttfb > 600) lowPerformanceScore += 1;

      // Check memory usage
      if (metrics.memoryUsage) {
        const memoryUsage =
          metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit;
        if (memoryUsage > 0.8) lowPerformanceScore += 1;
      }

      // Check connection type
      if (
        metrics.connectionType === 'slow-2g' ||
        metrics.connectionType === '2g' ||
        metrics.connectionType === '3g'
      ) {
        lowPerformanceScore += 1;
      }

      setIsLowPerformance(lowPerformanceScore >= 2);
    };

    classifyPerformance();
  }, [metrics]);

  // Cache management
  const getCached = useCallback(<T,>(key: string): T | null => {
    const entry = cacheRef.current.get(key);
    if (!entry) return null;

    entry.lastAccessed = Date.now();
    entry.hits += 1;

    setCache(new Map(cacheRef.current));

    return entry.data as T;
  }, []);

  const setCached = useCallback(
    <T,>(key: string, data: T, size: number = 1) => {
      const newCache = cacheRef.current;

      // Eviction Policy: Remove oldest entries if cache is full (Least Recently Used)
      if (newCache.size >= config.cacheMaxSize) {
        const entries = Array.from(newCache.entries());
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        const toRemove = Math.ceil(config.cacheMaxSize * 0.1);
        for (let i = 0; i < toRemove && i < entries.length; i++) {
          const keyToRemove = entries[i]?.[0];
          if (keyToRemove !== undefined) {
            newCache.delete(keyToRemove);
          }
        }
      }

      newCache.set(key, {
        data,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        size,
        hits: 0,
      });

      setCache(new Map(newCache));
    },
    [config.cacheMaxSize]
  );

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setCache(new Map());
  }, []);

  const getCacheStats = useCallback(() => {
    const entries = Array.from(cacheRef.current.values());
    const totalEntries = cacheRef.current.size;
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const averageAge =
      entries.length > 0
        ? entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length
        : 0;

    return {
      totalEntries,
      totalSize,
      totalHits,
      averageAge,
    };
  }, [cache]);

  // Preloading hook
  const preloadResource = useCallback(
    (url: string, as: 'script' | 'style' | 'image' | 'font' = 'script') => {
      if (typeof document === 'undefined') return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = as;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    },
    []
  );

  // Performance recommendations
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push(
        'Consider optimizing images and reducing server response time to improve Largest Contentful Paint (LCP).'
      );
    }

    if (metrics.fid && metrics.fid > 100) {
      recommendations.push(
        'Reduce JavaScript execution time and main thread blocking to improve First Input Delay (FID).'
      );
    }

    if (metrics.cls && metrics.cls > 0.25) {
      recommendations.push(
        'Reserve space for dynamic content (images/ads) to prevent layout shifts and reduce Cumulative Layout Shift (CLS).'
      );
    }

    if (metrics.ttfb && metrics.ttfb > 600) {
      recommendations.push(
        'Optimize backend processing and DNS lookups to improve Time to First Byte (TTFB).'
      );
    }

    if (metrics.memoryUsage) {
      const memoryUsage = metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit;
      if (memoryUsage > 0.8) {
        recommendations.push(
          'High memory usage detected. Consider implementing more aggressive caching strategies and checking for memory leaks.'
        );
      }
    }

    if (metrics.connectionType === 'slow-2g' || metrics.connectionType === '2g') {
      recommendations.push(
        'Consider serving smaller, optimized bundles and enabling code-splitting for slow network connections.'
      );
    }

    return recommendations;
  }, [metrics]);

  return {
    // State
    metrics,
    isLowPerformance,
    activeOptimization,
    cache,

    // Cache management
    getCached,
    setCached,
    clearCache,
    getCacheStats,

    // Utilities
    preloadResource,
    getRecommendations,
  };
}
