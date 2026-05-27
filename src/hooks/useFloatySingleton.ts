import { useEffect, useRef } from 'react';
import { useFloatyWidgetManager } from './useFloatyWidgetManager';
import { connectFloatySingleton } from '../singleton';

/**
 * Connects the nearest `FloatyWidgetManager` to the imperative singleton API
 * (`openFloaty`, `closeFloaty`, etc.), so those functions use the same manager
 * instance as your React tree instead of creating a separate root.
 *
 * Call this hook once, inside a component that is a descendant of `FloatyWidgetManager`.
 *
 * @example
 * ```tsx
 * function App() {
 *   useFloatySingleton();
 *   return <FloatyViewport />;
 * }
 * ```
 */
export function useFloatySingleton(): void {
  const manager = useFloatyWidgetManager();
  const ref = useRef(manager);
  ref.current = manager;

  useEffect(() => {
    connectFloatySingleton(() => ref.current);
    return () => connectFloatySingleton(null);
  }, []);
}
