import { useEffect, useRef } from 'react';
import { useFloatyWidgetManager } from '../context/FloatyWidgetManager';
import { connectFloatySingleton } from '../singleton';

export function useFloatySingleton(): void {
  const manager = useFloatyWidgetManager();
  const ref = useRef(manager);
  ref.current = manager;

  useEffect(() => {
    connectFloatySingleton(() => ref.current);
    return () => connectFloatySingleton(null);
  }, []);
}
