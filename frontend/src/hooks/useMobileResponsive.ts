import { useState, useEffect, useCallback } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveConfig {
  breakpoints: Record<Breakpoint, number>;
  containerMaxWidths: Record<Breakpoint, number>;
  spacing: Record<Breakpoint, number>;
  fontSize: Record<Breakpoint, Record<string, number>>;
}

const defaultConfig: ResponsiveConfig = {
  breakpoints: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  containerMaxWidths: {
    xs: 100,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  fontSize: {
    xs: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, '2xl': 22 },
    sm: { xs: 14, sm: 16, md: 18, lg: 20, xl: 22, '2xl': 24 },
    md: { xs: 16, sm: 18, md: 20, lg: 22, xl: 24, '2xl': 26 },
    lg: { xs: 18, sm: 20, md: 22, lg: 24, xl: 26, '2xl': 28 },
    xl: { xs: 20, sm: 22, md: 24, lg: 26, xl: 28, '2xl': 30 },
    '2xl': { xs: 24, sm: 26, md: 28, lg: 30, xl: 32, '2xl': 34 },
  },
};

export interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

export function useMobileResponsive(config: Partial<ResponsiveConfig> = {}) {
  const mergedConfig = { ...defaultConfig, ...config };
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined'
      ? window.innerHeight > window.innerWidth
        ? 'portrait'
        : 'landscape'
      : 'landscape'
  );
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('lg');

  // Update window size and orientation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({ width, height });
      setOrientation(height > width ? 'portrait' : 'landscape');

      // Determine current breakpoint
      const breakpoint =
        (Object.entries(mergedConfig.breakpoints) as [Breakpoint, number][])
          .reverse()
          .find(([_, bpWidth]) => width >= bpWidth)?.[0] || 'xs';

      setCurrentBreakpoint(breakpoint);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [mergedConfig.breakpoints]);

  // Get responsive value based on current breakpoint
  const getResponsiveValue = useCallback(
    <T>(values: ResponsiveValue<T> | T): T => {
      if (typeof values !== 'object' || values === null) {
        return values as T;
      }

      const responsiveValues = values as ResponsiveValue<T>;
      const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

      // Find the first breakpoint that has a value and is <= current breakpoint
      const currentIndex = breakpoints.indexOf(currentBreakpoint);
      for (let i = currentIndex; i >= 0; i--) {
        const bp = breakpoints[i] as Breakpoint;
        if (responsiveValues[bp] !== undefined) {
          return responsiveValues[bp]!;
        }
      }

      // Fallback to xs or first defined value
      return (
        responsiveValues.xs ??
        responsiveValues.sm ??
        responsiveValues.md ??
        responsiveValues.lg ??
        responsiveValues.xl ??
        (responsiveValues['2xl']! as T)
      );
    },
    [currentBreakpoint]
  );

  // Check if current breakpoint matches or is above
  const isBreakpoint = useCallback(
    (breakpoint: Breakpoint) => {
      const currentIndex = (Object.keys(mergedConfig.breakpoints) as Breakpoint[]).indexOf(
        currentBreakpoint
      );
      const targetIndex = (Object.keys(mergedConfig.breakpoints) as Breakpoint[]).indexOf(
        breakpoint
      );
      return currentIndex >= targetIndex;
    },
    [currentBreakpoint, mergedConfig.breakpoints]
  );

  // Check if current breakpoint is below
  const isBelowBreakpoint = useCallback(
    (breakpoint: Breakpoint) => {
      const currentIndex = (Object.keys(mergedConfig.breakpoints) as Breakpoint[]).indexOf(
        currentBreakpoint
      );
      const targetIndex = (Object.keys(mergedConfig.breakpoints) as Breakpoint[]).indexOf(
        breakpoint
      );
      return currentIndex < targetIndex;
    },
    [currentBreakpoint, mergedConfig.breakpoints]
  );

  // Check if device is mobile
  const isMobile = useCallback(() => {
    return isBreakpoint('md') === false;
  }, [isBreakpoint]);

  // Check if device is tablet
  const isTablet = useCallback(() => {
    return isBreakpoint('md') && isBelowBreakpoint('lg');
  }, [isBreakpoint, isBelowBreakpoint]);

  // Check if device is desktop
  const isDesktop = useCallback(() => {
    return isBreakpoint('lg');
  }, [isBreakpoint]);

  // Get responsive classes
  const getResponsiveClasses = useCallback(
    (classes: ResponsiveValue<string>) => {
      return getResponsiveValue(classes);
    },
    [getResponsiveValue]
  );

  // Get responsive styles
  const getResponsiveStyles = useCallback(
    (styles: ResponsiveValue<React.CSSProperties>) => {
      return getResponsiveValue(styles);
    },
    [getResponsiveValue]
  );

  // Get container max width
  const getContainerMaxWidth = useCallback(() => {
    return mergedConfig.containerMaxWidths[currentBreakpoint];
  }, [currentBreakpoint, mergedConfig.containerMaxWidths]);

  // Get spacing
  const getSpacing = useCallback(
    (multiplier: number = 1) => {
      return mergedConfig.spacing[currentBreakpoint] * multiplier;
    },
    [currentBreakpoint, mergedConfig.spacing]
  );

  // Get font size
  const getFontSize = useCallback(
    (size: keyof typeof defaultConfig.fontSize) => {
      return mergedConfig.fontSize[size][currentBreakpoint];
    },
    [currentBreakpoint, mergedConfig.fontSize]
  );

  // Touch detection
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });

    return () => window.removeEventListener('touchstart', checkTouch);
  }, []);

  // Device detection
  const getDeviceInfo = useCallback(() => {
    if (typeof window === 'undefined') return { type: 'unknown', os: 'unknown' };

    const userAgent = navigator.userAgent.toLowerCase();

    // Device type
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      type = 'mobile';
    } else if (/tablet|ipad|android(?!.*mobile)|silk/i.test(userAgent)) {
      type = 'tablet';
    }

    // OS detection
    let os: 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'unknown' = 'unknown';
    if (/iphone|ipad|ipod/.test(userAgent)) {
      os = 'ios';
    } else if (/android/.test(userAgent)) {
      os = 'android';
    } else if (/win/.test(userAgent)) {
      os = 'windows';
    } else if (/mac/.test(userAgent)) {
      os = 'mac';
    } else if (/linux/.test(userAgent)) {
      os = 'linux';
    }

    return { type, os };
  }, []);

  // Safe area insets for mobile devices
  const getSafeAreaInsets = useCallback(() => {
    if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };

    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('safe-area-inset-left') || '0'),
    };
  }, []);

  // Viewport height accounting for mobile browsers
  const [viewportHeight, setViewportHeight] = useState(windowSize.height);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewportHeight = () => {
      // Use visual viewport API if available (better for mobile browsers)
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.visualViewport?.addEventListener('resize', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  return {
    // Current state
    windowSize,
    viewportHeight,
    orientation,
    currentBreakpoint,
    isTouch,
    deviceInfo: getDeviceInfo(),
    safeAreaInsets: getSafeAreaInsets(),

    // Breakpoint checks
    isBreakpoint,
    isBelowBreakpoint,
    isMobile,
    isTablet,
    isDesktop,

    // Responsive utilities
    getResponsiveValue,
    getResponsiveClasses,
    getResponsiveStyles,

    // Layout utilities
    getContainerMaxWidth,
    getSpacing,
    getFontSize,

    // Configuration
    config: mergedConfig,
  };
}

// Helper hooks for common responsive patterns
export function useMobileMenu() {
  const { isMobile } = useMobileResponsive();
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = useCallback(() => setIsOpen(true), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);

  // Close menu on screen size change to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  return { isOpen, openMenu, closeMenu, toggleMenu, isMobile };
}

export function useResponsiveGrid() {
  const { currentBreakpoint, getResponsiveValue } = useMobileResponsive();

  const getGridColumns = useCallback(
    (columns: ResponsiveValue<number>) => {
      return getResponsiveValue(columns);
    },
    [getResponsiveValue]
  );

  const getGridGap = useCallback(
    (gap: ResponsiveValue<number>) => {
      return getResponsiveValue(gap);
    },
    [getResponsiveValue]
  );

  return {
    getGridColumns,
    getGridGap,
    currentBreakpoint,
  };
}

export function useResponsiveNavigation() {
  const { isMobile, isTablet } = useMobileResponsive();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile()) {
      setIsCollapsed(true);
    } else if (isTablet()) {
      setIsCollapsed(false);
    }
  }, [isMobile, isTablet]);

  const toggleCollapsed = useCallback(() => {
    if (!isMobile) {
      setIsCollapsed(prev => !prev);
    }
  }, [isMobile]);

  return {
    isCollapsed,
    toggleCollapsed,
    canCollapse: !isMobile,
    isMobile,
    isTablet,
  };
}
