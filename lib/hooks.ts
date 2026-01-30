import { useSyncExternalStore, useCallback } from 'react';

/**
 * Returns true after hydration is complete (client-side only).
 * Uses useSyncExternalStore which is the React-recommended pattern
 * for tracking client-side state without causing hydration mismatches.
 *
 * This replaces the antipattern of:
 *   const [mounted, setMounted] = useState(false);
 *   useEffect(() => setMounted(true), []);
 */

const emptySubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // Client: always true
    () => false  // Server: always false
  );
}

/**
 * Returns responsive chart height based on window width breakpoints.
 * Uses useSyncExternalStore for proper SSR handling.
 */
export function useResponsiveChartHeight(
  mobileHeight: number,
  tabletHeight: number,
  desktopHeight: number
): number {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return desktopHeight;
    if (window.innerWidth < 640) return mobileHeight;
    if (window.innerWidth < 1024) return tabletHeight;
    return desktopHeight;
  }, [mobileHeight, tabletHeight, desktopHeight]);

  const getServerSnapshot = useCallback(() => desktopHeight, [desktopHeight]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
