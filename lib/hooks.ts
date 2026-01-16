import { useSyncExternalStore } from 'react';

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
