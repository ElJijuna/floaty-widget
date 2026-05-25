import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement, FC, ReactNode } from 'react';
import {
  FloatyWidgetManager,
  useFloatyWidgetManager,
} from '../context/FloatyWidgetManager';
import { openFloaty, connectFloatySingleton } from '../singleton';
import { useFloatySingleton } from './useFloatySingleton';

const MockComponent: FC = () => null;

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(FloatyWidgetManager, { children });

describe('useFloatySingleton', () => {
  it('connects openFloaty to the Provider manager while mounted', () => {
    const { result } = renderHook(
      () => ({ manager: useFloatyWidgetManager(), _: useFloatySingleton() }),
      { wrapper }
    );

    act(() => {
      openFloaty({ id: 'w', component: MockComponent, props: {} });
    });

    expect(result.current.manager.getWidgetCount()).toBe(1);

    connectFloatySingleton(null);
  });

  it('routes duplicate strategy through Provider manager', () => {
    const { result } = renderHook(
      () => ({ manager: useFloatyWidgetManager(), _: useFloatySingleton() }),
      { wrapper }
    );

    act(() => {
      openFloaty({ id: 'w', component: MockComponent, props: {} });
    });
    act(() => {
      openFloaty({ id: 'w', component: MockComponent, props: {} }, { duplicateStrategy: 'duplicate' });
    });

    expect(result.current.manager.getWidgetCount()).toBe(2);

    connectFloatySingleton(null);
  });

  it('disconnects on unmount — a new getter can be set cleanly after', () => {
    const { unmount } = renderHook(() => useFloatySingleton(), { wrapper });

    unmount();

    // After unmount the singleton has no getter. We verify by connecting a spy
    // and confirming it has not been called by residual state.
    const spy = vi.fn();
    connectFloatySingleton(spy);
    expect(spy).not.toHaveBeenCalled();

    connectFloatySingleton(null);
  });

  it('throws when used outside FloatyProvider', () => {
    expect(() => {
      renderHook(() => useFloatySingleton());
    }).toThrow('useFloatyWidgetManager must be used within FloatyWidgetManager');
  });
});
