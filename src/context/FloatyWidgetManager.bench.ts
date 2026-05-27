import { bench, describe } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement, FC, ReactNode } from 'react';
import { FloatyWidgetManager } from './FloatyWidgetManager';
import { useFloatyWidgetManager } from '../hooks/useFloatyWidgetManager';

const MockComponent: FC = () => null;

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(FloatyWidgetManager, null, children);

describe('open', () => {
  bench('open 50 widgets sequentially', () => {
    const { result, unmount } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    act(() => {
      for (let i = 0; i < 50; i++) {
        result.current.open({ id: `w-${i}`, component: MockComponent, props: {} });
      }
    });

    unmount();
  });

  bench('open + duplicate strategy x30', () => {
    const { result, unmount } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    act(() => {
      result.current.open({ id: 'base', component: MockComponent, props: {} });
    });

    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.open(
          { id: 'base', component: MockComponent, props: {} },
          { duplicateStrategy: 'duplicate' }
        );
      }
    });

    unmount();
  });
});

describe('bringToFront', () => {
  bench('bringToFront on 30 widgets', () => {
    const { result, unmount } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.open({ id: `w-${i}`, component: MockComponent, props: {} });
      }
    });

    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.bringToFront(`w-${i}`);
      }
    });

    unmount();
  });
});

describe('updateWidgetState', () => {
  bench('no-op equality check x100 (same state)', () => {
    const { result, unmount } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    act(() => {
      result.current.open({ id: 'w', component: MockComponent, props: {} });
    });

    const widget = result.current.getWidget('w')!;

    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.updateWidgetState('w', {
          isCollapsed: widget.isCollapsed,
          isMinimized: widget.isMinimized,
          isPinned: widget.isPinned,
          position: widget.position,
          size: widget.size,
          zIndex: widget.zIndex,
        });
      }
    });

    unmount();
  });

  bench('real state update x50', () => {
    const { result, unmount } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    act(() => {
      result.current.open({ id: 'w', component: MockComponent, props: {} });
    });

    act(() => {
      for (let i = 0; i < 50; i++) {
        result.current.updateWidgetState('w', { isCollapsed: i % 2 === 0 });
      }
    });

    unmount();
  });
});

describe('bulk operations', () => {
  bench('collapseAll + expandAll on 20 widgets', () => {
    const { result, unmount } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.open({ id: `w-${i}`, component: MockComponent, props: {} });
      }
    });

    act(() => result.current.collapseAll());
    act(() => result.current.expandAll());

    unmount();
  });
});
