import { act, render, renderHook, screen } from '@testing-library/react';
import type { FC, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FloatyViewport } from '../components/Floaty/FloatyViewport';
import { useFloatyWidgetManager } from '../hooks/useFloatyWidgetManager';
import { FloatyWidgetManager } from './FloatyWidgetManager';

const MockComponent: FC = () => null;

const wrapper = ({ children }: { children: ReactNode }) => (
  <FloatyWidgetManager>{children}</FloatyWidgetManager>
);

describe('FloatyWidgetManager', () => {
  describe('open', () => {
    it('creates a widget with correct default state', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({
          id: 'test',
          component: MockComponent,
          props: {},
          title: 'My Widget',
          mode: 'window',
        });
      });

      expect(result.current.getWidgetCount()).toBe(1);
      const widget = result.current.getWidget('test');

      expect(widget?.title).toBe('My Widget');
      expect(widget?.mode).toBe('window');
      expect(widget?.isCollapsed).toBe(false);
      expect(widget?.isMinimized).toBe(false);
      expect(widget?.isPinned).toBe(false);
    });

    it('replaces existing widget by default (replace strategy)', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'test', component: MockComponent, props: {}, title: 'First' });
        result.current.open({ id: 'test', component: MockComponent, props: {}, title: 'Second' });
      });

      expect(result.current.getWidgetCount()).toBe(1);
      expect(result.current.getWidget('test')?.title).toBe('Second');
    });

    it('focuses and restores existing widget with focus strategy', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'test', component: MockComponent, props: {} });
      });
      act(() => {
        result.current.update('test', { minimized: true });
      });

      expect(result.current.getWidget('test')?.isMinimized).toBe(true);

      act(() => {
        result.current.open(
          { id: 'test', component: MockComponent, props: {} },
          { duplicateStrategy: 'focus' },
        );
      });

      expect(result.current.getWidgetCount()).toBe(1);
      expect(result.current.getWidget('test')?.isMinimized).toBe(false);
    });

    it('creates a new widget with unique id using duplicate strategy', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'test', component: MockComponent, props: {} });
      });
      act(() => {
        result.current.open(
          { id: 'test', component: MockComponent, props: {} },
          { duplicateStrategy: 'duplicate' },
        );
      });

      expect(result.current.getWidgetCount()).toBe(2);
      expect(result.current.getWidget('test')).toBeDefined();
      expect(result.current.getWidget('test-2')).toBeDefined();
    });

    it('generates sequential unique ids for multiple duplicates', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'w', component: MockComponent, props: {} });
      });
      act(() => {
        result.current.open(
          { id: 'w', component: MockComponent, props: {} },
          { duplicateStrategy: 'duplicate' },
        );
      });
      act(() => {
        result.current.open(
          { id: 'w', component: MockComponent, props: {} },
          { duplicateStrategy: 'duplicate' },
        );
      });

      expect(result.current.getWidgetCount()).toBe(3);
      expect(result.current.getWidget('w-3')).toBeDefined();
    });

    it('reserves unique ids for duplicate widgets opened in the same batch', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });
      const ids: string[] = [];

      act(() => {
        ids.push(result.current.open({ id: 'w', component: MockComponent, props: {} }));
        ids.push(
          result.current.open(
            { id: 'w', component: MockComponent, props: {} },
            { duplicateStrategy: 'duplicate' },
          ),
        );
        ids.push(
          result.current.open(
            { id: 'w', component: MockComponent, props: {} },
            { duplicateStrategy: 'duplicate' },
          ),
        );
      });

      expect(ids).toEqual(['w', 'w-2', 'w-3']);
      expect(result.current.getWidgetCount()).toBe(3);
    });

    it('respects collapsed/minimized/pinned initial flags', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({
          id: 'test',
          component: MockComponent,
          props: {},
          collapsed: true,
          minimized: false,
          pinned: true,
        });
      });

      const widget = result.current.getWidget('test');

      expect(widget?.isCollapsed).toBe(true);
      expect(widget?.isPinned).toBe(true);
    });

    it('stores a lazy component without loading it immediately', () => {
      const LazyComponent: FC<{ label: string }> = ({ label }) => <div>{label}</div>;
      const loader = vi.fn(async () => ({ default: LazyComponent }));
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({
          id: 'lazy',
          loader,
          props: { label: 'Lazy body' },
        });
      });

      const widget = result.current.getWidget('lazy');

      expect(widget?.component).toBeDefined();
      expect(widget?.loader).toBe(loader);
      expect(loader).not.toHaveBeenCalled();
    });

    it('loads a lazy component when the viewport renders it', async () => {
      const LazyComponent: FC<{ label: string }> = ({ label }) => <div>{label}</div>;
      const loader = vi.fn(async () => ({ default: LazyComponent }));

      const Opener = () => {
        const manager = useFloatyWidgetManager();

        return (
          <button
            type="button"
            onClick={() =>
              manager.open({
                id: 'lazy',
                title: 'Lazy Widget',
                loader,
                props: { label: 'Lazy body' },
                fallback: <span>Loading widget</span>,
              })
            }
          >
            Open
          </button>
        );
      };

      render(
        <FloatyWidgetManager>
          <Opener />
          <FloatyViewport />
        </FloatyWidgetManager>,
      );

      expect(loader).not.toHaveBeenCalled();

      act(() => {
        screen.getByRole('button', { name: 'Open' }).click();
      });

      expect(screen.getByText('Loading widget')).toBeInTheDocument();
      expect(await screen.findByText('Lazy body')).toBeInTheDocument();
      expect(loader).toHaveBeenCalledOnce();
    });

    it('shows the default fallback for lazy widgets without a fallback prop', () => {
      const loader = vi.fn(() => new Promise<{ default: FC }>(() => {}));

      const Opener = () => {
        const manager = useFloatyWidgetManager();

        return (
          <button
            type="button"
            onClick={() =>
              manager.open({
                id: 'lazy-default-fallback',
                title: 'Lazy Widget',
                loader,
                props: {},
              })
            }
          >
            Open
          </button>
        );
      };

      render(
        <FloatyWidgetManager>
          <Opener />
          <FloatyViewport />
        </FloatyWidgetManager>,
      );

      act(() => {
        screen.getByRole('button', { name: 'Open' }).click();
      });

      expect(screen.getByText('Loading widget...')).toBeInTheDocument();
    });

    it('uses custom labels for built-in lazy loading and error states', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const loader = vi.fn().mockRejectedValue(new Error('fallo de chunk'));

      const Opener = () => {
        const manager = useFloatyWidgetManager();

        return (
          <button
            type="button"
            onClick={() =>
              manager.open({
                id: 'lazy-custom-labels',
                title: 'Lazy Widget',
                loader,
                props: {},
              })
            }
          >
            Open
          </button>
        );
      };

      render(
        <FloatyWidgetManager
          labels={{
            loading: 'Cargando panel...',
            loadError: 'No se pudo cargar el panel',
            retry: 'Reintentar',
          }}
        >
          <Opener />
          <FloatyViewport />
        </FloatyWidgetManager>,
      );

      act(() => {
        screen.getByRole('button', { name: 'Open' }).click();
      });

      expect(screen.getByText('Cargando panel...')).toBeInTheDocument();
      expect(await screen.findByText('No se pudo cargar el panel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();

      consoleError.mockRestore();
    });

    it('shows lazy load errors and can retry the loader', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const LazyComponent: FC<{ label: string }> = ({ label }) => <div>{label}</div>;
      const loader = vi
        .fn()
        .mockRejectedValueOnce(new Error('network chunk failed'))
        .mockResolvedValueOnce({ default: LazyComponent });

      const Opener = () => {
        const manager = useFloatyWidgetManager();

        return (
          <button
            type="button"
            onClick={() =>
              manager.open({
                id: 'lazy-error',
                title: 'Lazy Widget',
                loader,
                props: { label: 'Recovered body' },
              })
            }
          >
            Open
          </button>
        );
      };

      render(
        <FloatyWidgetManager>
          <Opener />
          <FloatyViewport />
        </FloatyWidgetManager>,
      );

      act(() => {
        screen.getByRole('button', { name: 'Open' }).click();
      });

      expect(await screen.findByText('Could not load widget')).toBeInTheDocument();
      expect(screen.getByText('network chunk failed')).toBeInTheDocument();

      act(() => {
        screen.getByRole('button', { name: 'Retry' }).click();
      });

      expect(await screen.findByText('Recovered body')).toBeInTheDocument();
      expect(loader).toHaveBeenCalledTimes(2);

      consoleError.mockRestore();
    });
  });

  describe('close', () => {
    it('removes a widget by id', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'test', component: MockComponent, props: {} });
      });
      act(() => {
        result.current.close('test');
      });

      expect(result.current.getWidgetCount()).toBe(0);
      expect(result.current.getWidget('test')).toBeUndefined();
    });

    it('does not throw for unknown id', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      expect(() => {
        act(() => result.current.close('unknown'));
      }).not.toThrow();
    });
  });

  describe('closeAll', () => {
    it('removes all widgets', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'a', component: MockComponent, props: {} });
        result.current.open({ id: 'b', component: MockComponent, props: {} });
        result.current.open({ id: 'c', component: MockComponent, props: {} });
      });

      act(() => {
        result.current.closeAll();
      });

      expect(result.current.getWidgetCount()).toBe(0);
    });
  });

  describe('update', () => {
    it('updates widget state using shorthand flags', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'test', component: MockComponent, props: {} });
      });
      act(() => {
        result.current.update('test', { collapsed: true, pinned: true });
      });

      const widget = result.current.getWidget('test');

      expect(widget?.isCollapsed).toBe(true);
      expect(widget?.isPinned).toBe(true);
    });

    it('does not throw for unknown id', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      expect(() => {
        act(() => result.current.update('unknown', { collapsed: true }));
      }).not.toThrow();
    });

    it('synchronizes visual state for an already mounted widget', () => {
      const Controller = () => {
        const manager = useFloatyWidgetManager();

        return (
          <>
            <button
              type="button"
              onClick={() =>
                manager.open({
                  id: 'visual',
                  component: () => <div>Visual body</div>,
                  props: {},
                })
              }
            >
              Open visual
            </button>
            <button
              type="button"
              onClick={() =>
                manager.update('visual', {
                  collapsed: true,
                  pinned: true,
                  position: { x: 24, y: 32 },
                  size: { width: 480, height: 240 },
                })
              }
            >
              Update visual
            </button>
            <FloatyViewport />
          </>
        );
      };
      const { container } = render(
        <FloatyWidgetManager>
          <Controller />
        </FloatyWidgetManager>,
      );

      act(() => screen.getByRole('button', { name: 'Open visual' }).click());
      act(() => screen.getByRole('button', { name: 'Update visual' }).click());

      const floaty = container.querySelector<HTMLElement>('.floaty');

      expect(floaty).toHaveClass('collapsed', 'pinned');
      expect(floaty).toHaveStyle({
        transform: 'translate(24px, 32px)',
        width: '480px',
        height: '240px',
      });
    });

    it('passes window style and icon through the viewport and updates them', () => {
      const Controller = () => {
        const manager = useFloatyWidgetManager();
        return (
          <>
            <button
              type="button"
              onClick={() =>
                manager.open({
                  id: 'styled',
                  mode: 'window',
                  windowStyle: 'mac',
                  windowIcon: <span data-testid="mac-icon" />,
                  component: MockComponent,
                  props: {},
                })
              }
            >
              Open styled
            </button>
            <button
              type="button"
              onClick={() =>
                manager.update('styled', {
                  windowStyle: 'windows',
                  windowIcon: <span data-testid="windows-icon" />,
                })
              }
            >
              Update styled
            </button>
            <FloatyViewport />
          </>
        );
      };
      const { container } = render(
        <FloatyWidgetManager>
          <Controller />
        </FloatyWidgetManager>,
      );

      act(() => screen.getByRole('button', { name: 'Open styled' }).click());
      expect(container.querySelector('.floaty')).toHaveClass('floaty--window-mac');
      expect(screen.getByTestId('mac-icon')).toBeInTheDocument();

      act(() => screen.getByRole('button', { name: 'Update styled' }).click());
      expect(container.querySelector('.floaty')).toHaveClass('floaty--window-windows');
      expect(screen.getByTestId('windows-icon')).toBeInTheDocument();
    });
  });

  describe('updateProps', () => {
    it('updates widget props', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'test', component: MockComponent, props: { value: 1 } });
      });
      act(() => {
        result.current.updateProps('test', { value: 99 });
      });

      expect((result.current.getWidget('test')?.props as { value: number })?.value).toBe(99);
    });
  });

  describe('bringToFront', () => {
    it('assigns a higher zIndex than all other widgets', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'a', component: MockComponent, props: {} });
        result.current.open({ id: 'b', component: MockComponent, props: {} });
      });

      const zIndexB = result.current.getWidget('b')?.zIndex ?? 0;

      act(() => {
        result.current.bringToFront('a');
      });

      const zIndexA = result.current.getWidget('a')?.zIndex ?? 0;

      expect(zIndexA).toBeGreaterThan(zIndexB);
    });
  });

  describe('bulk operations', () => {
    it('collapseAll / expandAll toggle isCollapsed on all widgets', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'a', component: MockComponent, props: {} });
        result.current.open({ id: 'b', component: MockComponent, props: {} });
      });

      act(() => result.current.collapseAll());
      expect(result.current.getWidget('a')?.isCollapsed).toBe(true);
      expect(result.current.getWidget('b')?.isCollapsed).toBe(true);

      act(() => result.current.expandAll());
      expect(result.current.getWidget('a')?.isCollapsed).toBe(false);
      expect(result.current.getWidget('b')?.isCollapsed).toBe(false);
    });

    it('minimizeAll / restoreAll toggle isMinimized on all widgets', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'a', component: MockComponent, props: {} });
        result.current.open({ id: 'b', component: MockComponent, props: {} });
      });

      act(() => result.current.minimizeAll());
      expect(result.current.getWidget('a')?.isMinimized).toBe(true);

      act(() => result.current.restoreAll());
      expect(result.current.getWidget('a')?.isMinimized).toBe(false);
    });

    it('pinAll / unpinAll toggle isPinned on all widgets', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'a', component: MockComponent, props: {} });
        result.current.open({ id: 'b', component: MockComponent, props: {} });
      });

      act(() => result.current.pinAll());
      expect(result.current.getWidget('a')?.isPinned).toBe(true);
      expect(result.current.getWidget('b')?.isPinned).toBe(true);

      act(() => result.current.unpinAll());
      expect(result.current.getWidget('a')?.isPinned).toBe(false);
    });
  });

  describe('per-widget operations', () => {
    it('restores and maximizes a persisted window through the manager', () => {
      const key = 'floaty-test:managed-layout';
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          position: { x: 30, y: 40 },
          size: { width: 340, height: 220 },
          isCollapsed: false,
          isMinimized: true,
          isPinned: false,
          isMaximized: false,
          snapZone: null,
          restoreGeometry: { position: { x: 30, y: 40 }, size: { width: 340, height: 220 } },
        }),
      );
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() =>
        result.current.open({
          id: 'persisted',
          mode: 'window',
          component: MockComponent,
          props: {},
          persistenceKey: key,
        }),
      );
      expect(result.current.getWidget('persisted')?.isMinimized).toBe(true);

      act(() => result.current.restoreWidget('persisted'));
      expect(result.current.getWidget('persisted')?.isMinimized).toBe(false);
      expect(JSON.parse(window.localStorage.getItem(key) ?? '{}').isMinimized).toBe(false);

      act(() => result.current.maximizeWidget('persisted'));
      expect(result.current.getWidget('persisted')?.isMaximized).toBe(true);
      expect(JSON.parse(window.localStorage.getItem(key) ?? '{}').isMaximized).toBe(true);

      act(() => result.current.unmaximizeWidget('persisted'));
      expect(result.current.getWidget('persisted')).toMatchObject({
        isMaximized: false,
        position: { x: 30, y: 40 },
        size: { width: 340, height: 220 },
      });
      expect(JSON.parse(window.localStorage.getItem(key) ?? '{}').isMaximized).toBe(false);
      window.localStorage.removeItem(key);
    });

    it('collapseWidget / expandWidget', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'test', component: MockComponent, props: {} });
      });

      act(() => result.current.collapseWidget('test'));
      expect(result.current.getWidget('test')?.isCollapsed).toBe(true);

      act(() => result.current.expandWidget('test'));
      expect(result.current.getWidget('test')?.isCollapsed).toBe(false);
    });

    it('minimizeWidget / restoreWidget', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'test', component: MockComponent, props: {} });
      });

      act(() => result.current.minimizeWidget('test'));
      expect(result.current.getWidget('test')?.isMinimized).toBe(true);

      act(() => result.current.restoreWidget('test'));
      expect(result.current.getWidget('test')?.isMinimized).toBe(false);
    });

    it('pinWidget / unpinWidget', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'test', component: MockComponent, props: {} });
      });

      act(() => result.current.pinWidget('test'));
      expect(result.current.getWidget('test')?.isPinned).toBe(true);

      act(() => result.current.unpinWidget('test'));
      expect(result.current.getWidget('test')?.isPinned).toBe(false);
    });

    it('maximizeWidget / unmaximizeWidget', () => {
      const { result } = renderHook(() => useFloatyWidgetManager(), { wrapper });

      act(() => {
        result.current.open({ id: 'test', component: MockComponent, props: {} });
      });

      act(() => result.current.maximizeWidget('test'));
      expect(result.current.getWidget('test')?.isMaximized).toBe(true);

      act(() => result.current.unmaximizeWidget('test'));
      expect(result.current.getWidget('test')?.isMaximized).toBe(false);
    });
  });

  describe('hooks', () => {
    it('useFloatyWidgetManager throws outside provider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useFloatyWidgetManager());
      }).toThrow('useFloatyWidgetManager must be used within FloatyWidgetManager');

      spy.mockRestore();
    });
  });
});
