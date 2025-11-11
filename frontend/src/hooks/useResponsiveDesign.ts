// Responsive design system for desktop-first mobile support
// Provides intelligent responsive behavior and mobile optimizations

import { useState, useEffect, useCallback, useMemo } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide';
export type Orientation = 'portrait' | 'landscape';

export interface BreakpointConfig {
  [key: string]: {
    min: number;
    max?: number;
    label: string;
  };
}

export interface ViewportInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  hasNotch: boolean;
  hasVirtualKeyboard: boolean;
  pixelRatio: number;
  supportsHover: boolean;
  supportsPointer: 'none' | 'coarse' | 'fine';
  colorScheme: 'light' | 'dark' | 'no-preference';
}

export interface ResponsiveLayout {
  columns: number;
  gap: number;
  padding: number;
  fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  spacing: 'tight' | 'normal' | 'relaxed' | 'loose';
  navigation: 'sidebar' | 'tabbar' | 'bottom-nav' | 'floating';
  contentWidth: 'full' | 'container' | 'narrow';
}

const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  xs: { min: 0, max: 479, label: 'extra-small' },
  sm: { min: 480, max: 767, label: 'small' },
  md: { min: 768, max: 1023, label: 'medium' },
  lg: { min: 1024, max: 1279, label: 'large' },
  xl: { min: 1280, max: 1535, label: 'extra-large' },
  '2xl': { min: 1536, max: 1919, label: '2xl' },
  '3xl': { min: 1920, max: undefined, label: '3xl' },
};

const DEVICE_THRESHOLDS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

const ORIENTATION_THRESHOLDS = {
  portrait: 0, // width < height
  landscape: 1, // width >= height
};

export function useResponsiveDesign(customBreakpoints?: BreakpointConfig) {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        deviceType: 'desktop',
        orientation: 'landscape',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        hasNotch: false,
        hasVirtualKeyboard: false,
        pixelRatio: 1,
        supportsHover: true,
        supportsPointer: 'fine',
        colorScheme: 'light',
      };
    }
    return getInitialViewportInfo();
  });

  const breakpoints = customBreakpoints || DEFAULT_BREAKPOINTS;
  const currentBreakpoint = getCurrentBreakpoint(viewport.width, breakpoints);

  // Initialize viewport info
  function getInitialViewportInfo(): ViewportInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    return {
      width,
      height,
      deviceType: getDeviceType(width),
      orientation: width >= height ? 'landscape' : 'portrait',
      isMobile: width < DEVICE_THRESHOLDS.mobile,
      isTablet: width >= DEVICE_THRESHOLDS.mobile && width < DEVICE_THRESHOLDS.tablet,
      isDesktop: width >= DEVICE_THRESHOLDS.desktop,
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      hasNotch: detectNotch(),
      hasVirtualKeyboard: false, // Will be detected by resize
      pixelRatio,
      supportsHover: !viewportPrefersNoHover(),
      supportsPointer: getPointerCapability(),
      colorScheme: getColorScheme(),
    };
  }

  // Get current breakpoint
  function getCurrentBreakpoint(width: number, bp: BreakpointConfig): Breakpoint {
    for (const [key, config] of Object.entries(bp)) {
      if (width >= config.min && (config.max === undefined || width <= config.max)) {
        return key as Breakpoint;
      }
    }
    return 'lg'; // fallback
  }

  // Get device type
  function getDeviceType(width: number): DeviceType {
    if (width < DEVICE_THRESHOLDS.mobile) return 'mobile';
    if (width < DEVICE_THRESHOLDS.tablet) return 'tablet';
    if (width < DEVICE_THRESHOLDS.desktop) return 'desktop';
    return 'wide';
  }

  // Detect device notch
  function detectNotch(): boolean {
    // This would need to be customized based on specific device detection
    return (
      /iPhone|iPad|iPod/.test(navigator.userAgent) && window.screen.height / window.screen.width > 2
    );
  }

  // Check if user prefers reduced motion
  function viewportPrefersNoHover(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: none)').matches;
  }

  // Get pointer capability
  function getPointerCapability(): 'none' | 'coarse' | 'fine' {
    if (window.matchMedia('(pointer: coarse)').matches) return 'coarse';
    if (window.matchMedia('(pointer: fine)').matches) return 'fine';
    return 'none';
  }

  // Get color scheme preference
  function getColorScheme(): 'light' | 'dark' | 'no-preference' {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'no-preference';
  }

  // Update viewport on resize
  const handleResize = useCallback(() => {
    setViewport(getInitialViewportInfo());
  }, []);

  // Detect virtual keyboard
  const detectVirtualKeyboard = useCallback(() => {
    if (!viewport.isMobile) return;

    const visualViewport = (window as unknown).visualViewport;
    if (!visualViewport) return;

    const isKeyboardOpen = visualViewport.height < window.innerHeight * 0.75;

    setViewport(prev => ({
      ...prev,
      hasVirtualKeyboard: isKeyboardOpen,
    }));
  }, [viewport.isMobile]);

  // Handle orientation change
  const handleOrientationChange = useCallback(() => {
    setTimeout(() => {
      setViewport(getInitialViewportInfo());
    }, 100); // Small delay to ensure correct measurements
  }, []);

  // Handle color scheme change
  const handleColorSchemeChange = useCallback((e: MediaQueryListEvent) => {
    setViewport(prev => ({
      ...prev,
      colorScheme: e.matches ? 'dark' : 'light',
    }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Monitor color scheme changes
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    colorSchemeQuery.addEventListener('change', handleColorSchemeChange);

    // Monitor virtual keyboard
    const visualViewport = (window as unknown).visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', detectVirtualKeyboard);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', detectVirtualKeyboard);
      }
    };
  }, [handleResize, handleOrientationChange, handleColorSchemeChange, detectVirtualKeyboard]);

  // Get responsive layout configuration
  const getResponsiveLayout = useCallback((): ResponsiveLayout => {
    const { deviceType, orientation, isTouch, supportsHover } = viewport;

    if (deviceType === 'mobile' || deviceType === 'tablet') {
      return {
        columns: deviceType === 'mobile' ? 1 : 2,
        gap: 16,
        padding: 16,
        fontSize: deviceType === 'mobile' ? 'sm' : 'base',
        spacing: 'normal',
        navigation: 'bottom-nav',
        contentWidth: 'full',
      };
    }

    if (deviceType === 'desktop') {
      return {
        columns: 3,
        gap: 24,
        padding: 24,
        fontSize: 'base',
        spacing: 'normal',
        navigation: 'sidebar',
        contentWidth: 'container',
      };
    }

    // Wide screens
    return {
      columns: 4,
      gap: 32,
      padding: 32,
      fontSize: 'base',
      spacing: 'relaxed',
      navigation: 'sidebar',
      contentWidth: 'narrow',
    };
  }, [viewport]);

  // Check if breakpoint matches
  const isBreakpoint = useCallback(
    (breakpoint: Breakpoint): boolean => {
      return currentBreakpoint === breakpoint;
    },
    [currentBreakpoint]
  );

  // Check if viewport is at least breakpoint
  const isBreakpointUp = useCallback(
    (breakpoint: Breakpoint): boolean => {
      const bp = breakpoints[breakpoint];
      return viewport.width >= bp.min;
    },
    [viewport.width, breakpoints]
  );

  // Check if viewport is at most breakpoint
  const isBreakpointDown = useCallback(
    (breakpoint: Breakpoint): boolean => {
      const bp = breakpoints[breakpoint];
      return viewport.width <= (bp.max || Infinity);
    },
    [viewport.width, breakpoints]
  );

  // Get breakpoint value
  const getBreakpointValue = useCallback(
    (breakpoint: Breakpoint): number => {
      return breakpoints[breakpoint].min;
    },
    [breakpoints]
  );

  // Get container max width for breakpoint
  const getContainerMaxWidth = useCallback(
    (breakpoint: Breakpoint): string => {
      const max = breakpoints[breakpoint].max;
      if (max === undefined) return '100%';
      return `${max}px`;
    },
    [breakpoints]
  );

  // Calculate grid columns based on available width
  const getGridColumns = useCallback(
    (minColumnWidth: number, maxColumns?: number): number => {
      const availableWidth = viewport.width;
      const gap = 24; // Assuming 24px gap
      const padding = 32; // Assuming 32px padding

      const usableWidth = availableWidth - padding * 2 - gap * (maxColumns || 12 - 1);
      const columns = Math.floor(usableWidth / minColumnWidth);

      return Math.max(1, Math.min(columns, maxColumns || 12));
    },
    [viewport.width]
  );

  // Get spacing value based on screen size
  const getSpacing = useCallback(
    (baseSpacing: number): number => {
      const { deviceType } = viewport;

      if (deviceType === 'mobile') {
        return Math.max(8, baseSpacing * 0.75);
      } else if (deviceType === 'tablet') {
        return Math.max(12, baseSpacing * 0.875);
      }
      return baseSpacing;
    },
    [viewport.deviceType]
  );

  // Get typography scale
  const getTypographyScale = useCallback(
    (baseSize: number): { size: number; lineHeight: number } => {
      const { deviceType } = viewport;

      let multiplier = 1;
      if (deviceType === 'mobile') {
        multiplier = 0.875;
      } else if (deviceType === 'tablet') {
        multiplier = 0.9375;
      }

      const size = Math.max(14, Math.round(baseSize * multiplier));
      const lineHeight = Math.round(size * 1.5);

      return { size, lineHeight };
    },
    [viewport.deviceType]
  );

  // Memoized computed values
  const responsiveLayout = useMemo(() => getResponsiveLayout(), [getResponsiveLayout]);

  const canHover = useMemo(
    () => !viewport.isTouch && viewport.supportsHover,
    [viewport.isTouch, viewport.supportsHover]
  );

  const isNarrow = useMemo(() => viewport.width < 768, [viewport.width]);

  const isWide = useMemo(() => viewport.width >= 1280, [viewport.width]);

  // Utility functions
  const css = {
    // Breakpoint media queries
    up: (breakpoint: Breakpoint) => `@media (min-width: ${getBreakpointValue(breakpoint)}px)`,
    down: (breakpoint: Breakpoint) => `@media (max-width: ${getBreakpointValue(breakpoint)}px)`,
    between: (lower: Breakpoint, upper: Breakpoint) =>
      `@media (min-width: ${getBreakpointValue(lower)}px) and (max-width: ${getBreakpointValue(upper)}px)`,

    // Orientation queries
    portrait: '@media (orientation: portrait)',
    landscape: '@media (orientation: landscape)',

    // Device-specific queries
    mobile: '@media (max-width: 767px)',
    tablet: '@media (min-width: 768px) and (max-width: 1023px)',
    desktop: '@media (min-width: 1024px)',

    // Interaction queries
    hover: '@media (hover: hover)',
    noHover: '@media (hover: none)',
    touch: '@media (pointer: coarse)',
    fine: '@media (pointer: fine)',

    // Color scheme
    dark: '@media (prefers-color-scheme: dark)',
    light: '@media (prefers-color-scheme: light)',

    // Reduced motion
    reduceMotion: '@media (prefers-reduced-motion: reduce)',
  };

  return {
    // Viewport information
    viewport,
    currentBreakpoint,
    breakpoints,

    // Device checks
    isMobile: viewport.isMobile,
    isTablet: viewport.isTablet,
    isDesktop: viewport.isDesktop,
    isTouch: viewport.isTouch,
    canHover,
    isNarrow,
    isWide,

    // Breakpoint checks
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    getBreakpointValue,
    getContainerMaxWidth,

    // Responsive utilities
    getGridColumns,
    getSpacing,
    getTypographyScale,
    responsiveLayout,

    // CSS helpers
    css,
  };
}

// Hook for conditional rendering based on breakpoints
export function useBreakpointQuery(query: string, initialValue: boolean = false) {
  const [matches, setMatches] = useState(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Hook for responsive values
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint | DeviceType, T>>
): T | undefined {
  const { viewport, currentBreakpoint } = useResponsiveDesign();

  // Try device type first
  if (values[viewport.deviceType]) {
    return values[viewport.deviceType];
  }

  // Then try breakpoint
  if (values[currentBreakpoint]) {
    return values[currentBreakpoint];
  }

  // Return unknown value as fallback
  return Object.values(values)[0];
}

export default useResponsiveDesign;
