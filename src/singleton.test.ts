import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { createElement, FC, ReactNode } from 'react';
import { FloatyWidgetManager } from './context/FloatyWidgetManager';
import { useFloatyWidgetManager } from './hooks/useFloatyWidgetManager';
import {
  connectFloatySingleton,
  openFloaty,
  closeFloaty,
  closeAllFloaty,
  updateFloaty,
} from './singleton';

const MockComponent: FC = () => null;

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(FloatyWidgetManager, { children });

afterEach(() => {
  connectFloatySingleton(null);
  cleanup();
});

describe('connectFloatySingleton + openFloaty', () => {
  it('routes openFloaty to external manager', () => {
    const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    connectFloatySingleton(() => result.current);

    act(() => {
      openFloaty({ id: 'test', component: MockComponent, props: {} });
    });

    expect(result.current.getWidgetCount()).toBe(1);
    expect(result.current.getWidget('test')).toBeDefined();
  });

  it('forwards title and initial state to external manager', () => {
    const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    connectFloatySingleton(() => result.current);

    act(() => {
      openFloaty({
        id: 'w',
        component: MockComponent,
        props: {},
        title: 'My Panel',
        collapsed: true,
        pinned: true,
      });
    });

    const widget = result.current.getWidget('w');
    expect(widget?.title).toBe('My Panel');
    expect(widget?.isCollapsed).toBe(true);
    expect(widget?.isPinned).toBe(true);
  });

  it('returns the widget id', () => {
    const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    connectFloatySingleton(() => result.current);

    let id: string;
    act(() => {
      id = openFloaty({ id: 'my-widget', component: MockComponent, props: {} });
    });

    expect(id!).toBe('my-widget');
  });

  it('passes duplicate strategy to external manager', () => {
    const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    connectFloatySingleton(() => result.current);

    act(() => {
      openFloaty({ id: 'w', component: MockComponent, props: {} });
    });
    act(() => {
      openFloaty(
        { id: 'w', component: MockComponent, props: {} },
        { duplicateStrategy: 'duplicate' }
      );
    });

    expect(result.current.getWidgetCount()).toBe(2);
  });
});

describe('connectFloatySingleton + closeFloaty', () => {
  it('closes a widget in external manager', () => {
    const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    connectFloatySingleton(() => result.current);

    act(() => {
      openFloaty({ id: 'w', component: MockComponent, props: {} });
    });
    act(() => {
      closeFloaty('w');
    });

    expect(result.current.getWidgetCount()).toBe(0);
  });
});

describe('connectFloatySingleton + closeAllFloaty', () => {
  it('closes all widgets in external manager', () => {
    const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    connectFloatySingleton(() => result.current);

    act(() => {
      openFloaty({ id: 'a', component: MockComponent, props: {} });
      openFloaty({ id: 'b', component: MockComponent, props: {} });
    });
    act(() => {
      closeAllFloaty();
    });

    expect(result.current.getWidgetCount()).toBe(0);
  });
});

describe('connectFloatySingleton + updateFloaty', () => {
  it('updates a widget in external manager', () => {
    const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

    connectFloatySingleton(() => result.current);

    act(() => {
      openFloaty({ id: 'w', component: MockComponent, props: {} });
    });
    act(() => {
      updateFloaty('w', { collapsed: true });
    });

    expect(result.current.getWidget('w')?.isCollapsed).toBe(true);
  });
});

describe('openFloaty auto-mount', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
  });

  it('creates a data-floaty-root container in body on first call', async () => {
    const { openFloaty: open } = await import('./singleton');

    open({ id: 'w', component: MockComponent, props: {} });

    expect(document.querySelector('[data-floaty-root]')).not.toBeNull();
  });

  it('reuses the same root on subsequent calls', async () => {
    const { openFloaty: open } = await import('./singleton');

    open({ id: 'a', component: MockComponent, props: {} });
    open({ id: 'b', component: MockComponent, props: {} });

    expect(document.querySelectorAll('[data-floaty-root]')).toHaveLength(1);
  });
});
