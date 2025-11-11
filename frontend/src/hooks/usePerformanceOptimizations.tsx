// Performance optimization system for enhanced application performance
// Provides lazy loading, virtualization, caching, and performance monitoring

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';

export type PerformanceMetric = 'lcp' | 'fid' | 'cls' | 'fcp' | 'ttfb';
export type OptimizationType =
  | 'lazy-loading'
  | 'virtualization'
  | 'caching'
  | 'code-splitting'
  | 'preloading'
  | 'debouncing';

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

export interface OptimizationConfig {
  enableIntersectionObserver: boolean;
  enablePerformanceObserver: boolean;
  enableMemoryMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  virtualScrollThreshold: number;
  lazyLoadMargin: string;
  preloadCriticalResources: boolean;
  cacheMaxSize: number; // in entries
  debounceDelay: number; // in ms
}

export interface VirtualItem {
  id: string;
  index: number;
  height: number;
  y: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
  size: number;
  hits: number;
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
  const [activeOptimization, setActiveOptimization] = useState<OptimizationType[]>([]);
  const [cache, setCache] = useState<Map<string, CacheEntry<unknown>>>(new Map());
  const [virtualItems, setVirtualItems] = useState<VirtualItem[]>([]);

  const performanceObserverRef = useRef<PerformanceObserver | null>(null);
  const memoryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const networkStatusRef = useRef<unknown>(null);

  // Performance Observer setup
  useEffect(() => {
    if (!config.enablePerformanceObserver || typeof window === 'undefined') return;

    if ('PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver(list => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          setMetrics(prev => ({
            ...prev,
            timestamp: Date.now(),
          }));

          // Core Web Vitals
          if (entry.entryType === 'largest-contentful-paint') {
            setMetrics(prev => ({
              ...prev,
              lcp: entry.startTime,
            }));
          }

          if (entry.entryType === 'first-input') {
            setMetrics(prev => ({
              ...prev,
              fid: entry.processingStart - entry.startTime,
            }));
          }

          if (entry.entryType === 'layout-shift' && !(entry as unknown).hadRecentInput) {
            setMetrics(prev => ({
              ...prev,
              cls: (prev.cls || 0) + entry.value,
            }));
          }

          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({
              ...prev,
              fcp: entry.startTime,
            }));
          }

          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming;
            setMetrics(prev => ({
              ...prev,
              ttfb: nav.responseStart - nav.requestStart,
            }));
          }
        });
      });

      // Observe different entry types
      performanceObserverRef.current.observe({ entryTypes: ['largest-contentful-paint'] });
      performanceObserverRef.current.observe({ entryTypes: ['first-input'] });
      performanceObserverRef.current.observe({ entryTypes: ['layout-shift'] });
      performanceObserverRef.current.observe({ entryTypes: ['paint'] });
      performanceObserverRef.current.observe({ entryTypes: ['navigation'] });
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
        const memory = (performance as unknown).memory;
        const memoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };

        setMetrics(prev => ({
          ...prev,
          memoryUsage,
        }));
      }
    };

    memoryIntervalRef.current = setInterval(checkMemory, 10000); // Check every 10 seconds

    return () => {
      if (memoryIntervalRef.current) {
        clearInterval(memoryIntervalRef.current);
      }
    };
  }, [config.enableMemoryMonitoring]);

  // Network monitoring
  useEffect(() => {
    if (!config.enableNetworkMonitoring || typeof window === 'undefined') return;

    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as unknown).connection;
        setMetrics(prev => ({
          ...prev,
          connectionType: connection.effectiveType,
        }));
      }
    };

    updateNetworkInfo();

    networkStatusRef.current = window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
    };
  }, [config.enableNetworkMonitoring]);

  // Device information
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setMetrics(prev => ({
      ...prev,
      devicePixelRatio: window.devicePixelRatio,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }));
  }, []);

  // Performance classification
  useEffect(() => {
    const classifyPerformance = () => {
      let lowPerformanceScore = 0;

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
      if (metrics.connectionType === 'slow-2g' || metrics.connectionType === '2g') {
        lowPerformanceScore += 1;
      }

      setIsLowPerformance(lowPerformanceScore >= 2);
    };

    classifyPerformance();
  }, [metrics]);

  // Lazy loading hook
  const useLazyLoading = useCallback(
    (options?: { rootMargin?: string; threshold?: number; triggerOnce?: boolean }) => {
      const { ref, inView, entry } = useInView({
        rootMargin: options?.rootMargin || config.lazyLoadMargin,
        threshold: options?.threshold || 0.1,
        triggerOnce: options?.triggerOnce !== false,
      });

      return { ref, inView, entry };
    },
    [config.lazyLoadMargin]
  );

  // Virtual scrolling hook
  const useVirtualScrolling = useCallback(
    (itemCount: number, itemHeight: number, containerHeight: number, overscan: number = 5) => {
      const [scrollTop, setScrollTop] = useState(0);
      const [containerWidth, setContainerWidth] = useState(0);

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

      const handleResize = useCallback(() => {
        setContainerWidth(window.innerWidth);
      }, []);

      useEffect(() => {
        setContainerWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, [handleResize]);

      return {
        visibleItems,
        totalHeight,
        handleScroll,
        scrollTop,
        visibleStartIndex,
        visibleEndIndex,
      };
    },
    []
  );

  // Cache management
  const getCached = useCallback(
    <T,>(key: string): T | null => {
      const entry = cache.get(key);
      if (!entry) return null;

      // Update access time
      entry.lastAccessed = Date.now();
      entry.hits += 1;

      return entry.data as T;
    },
    [cache]
  );

  const setCached = useCallback(
    <T,>(key: string, data: T, size: number = 1) => {
      setCache(prev => {
        const newCache = new Map(prev);

        // Remove oldest entries if cache is full
        if (newCache.size >= config.cacheMaxSize) {
          const entries = Array.from(newCache.entries());
          entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

          // Remove 10% of oldest entries
          const toRemove = Math.ceil(config.cacheMaxSize * 0.1);
          for (let i = 0; i < toRemove; i++) {
            newCache.delete(entries[i][0]);
          }
        }

        newCache.set(key, {
          data,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
          size,
          hits: 0,
        });

        return newCache;
      });
    },
    [config.cacheMaxSize]
  );

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  const getCacheStats = useCallback(() => {
    const entries = Array.from(cache.values());
    return {
      totalEntries: cache.size,
      totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      averageAge:
        entries.length > 0
          ? entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length
          : 0,
    };
  }, [cache]);

  // Debounce hook
  const useDebounce = useCallback(
    <T,>(value: T, delay?: number) => {
      const debounceDelay = delay || config.debounceDelay;
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
    },
    [config.debounceDelay]
  );

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

  // Optimized image component
  const OptimizedImage = useCallback(
    ({
      src,
      alt,
      className,
      loading = 'lazy',
      sizes,
      srcSet,
    }: {
      src: string;
      alt: string;
      className?: string;
      loading?: 'lazy' | 'eager';
      sizes?: string;
      srcSet?: string;
    }) => {
      const { ref, inView } = useLazyLoading({
        rootMargin: config.lazyLoadMargin,
        threshold: 0.1,
        triggerOnce: true,
      });

      const [isLoaded, setIsLoaded] = useState(false);
      const [error, setError] = useState(false);

      const handleLoad = useCallback(() => setIsLoaded(true), []);
      const handleError = useCallback(() => setError(true), []);

      useEffect(() => {
        if (inView && !isLoaded && !error) {
          const img = new Image();
          img.onload = handleLoad;
          img.onerror = handleError;
          img.src = src;
          if (srcSet) img.srcset = srcSet;
          if (sizes) img.sizes = sizes;
        }
      }, [inView, isLoaded, error, src, srcSet, sizes, handleLoad, handleError]);

      return (
        <div ref={ref} className={className}>
          {inView && !error ? (
            <img
              src={
                isLoaded
                  ? src
                  : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjwvc3ZnPg=='
              }
              alt={alt}
              loading={loading}
              sizes={sizes}
              srcSet={srcSet}
            />
          ) : null}
          {error && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400 text-sm">Failed to load image: {src}</span>
            </div>
          )}
        </div>
      );
    },
    [useLazyLoading, config.lazyLoadMargin]
  );

  // Performance recommendations
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push(
        'Consider optimizing images and reducing server response time to improve Largest Contentful Paint'
      );
    }

    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('Reduce JavaScript execution time to improve First Input Delay');
    }

    if (metrics.cls && metrics.cls > 0.25) {
      recommendations.push('Reserve space for dynamic content to reduce Cumulative Layout Shift');
    }

    if (metrics.memoryUsage) {
      const memoryUsage = metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit;
      if (memoryUsage > 0.8) {
        recommendations.push(
          'High memory usage detected. Consider implementing more aggressive caching strategies'
        );
      }
    }

    if (metrics.connectionType === 'slow-2g' || metrics.connectionType === '2g') {
      recommendations.push('Consider reducing bundle size for slow network connections');
    }

    return recommendations;
  }, [metrics]);

  return {
    // Metrics
    metrics,
    isLowPerformance,
    activeOptimization,

    // Optimization hooks
    useLazyLoading,
    useVirtualScrolling,
    useDebounce,

    // Cache management
    getCached,
    setCached,
    clearCache,
    getCacheStats,

    // Utilities
    preloadResource,
    OptimizedImage,

    // Performance insights
    getRecommendations,
  };
}

export default usePerformanceOptimizations;
