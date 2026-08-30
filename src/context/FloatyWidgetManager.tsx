import {
  type ComponentType,
  createContext,
  forwardRef,
  lazy,
  type RefObject,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  FloatyComponentLoader,
  FloatyDuplicateStrategy,
  FloatyHandle,
  FloatyLazyModule,
  FloatyOpenOptions,
  FloatyOpenWidget,
  FloatyOpenWidgetBase,
  FloatyTexts,
  FloatyWidget,
  FloatyWidgetManagerHandle,
  FloatyWidgetManagerProps,
  FloatyWidgetPatch,
  FloatyWidgetState,
} from '../types';

export const FloatyManagerContext = createContext<FloatyWidgetManagerHandle | null>(null);

const defaultLabels: FloatyTexts = {
  pin: 'Pin',
  unpin: 'Unpin',
  collapse: 'Collapse',
  expand: 'Expand',
  minimize: 'Minimize',
  restore: 'Restore',
  close: 'Close',
  resize: 'Resize widget',
  loading: 'Loading widget...',
  loadError: 'Could not load widget',
  retry: 'Retry',
};

const createDuplicateId = (id: string, widgets: Map<string, FloatyWidget>) => {
  let index = 2;
  let nextId = `${id}-${index}`;

  while (widgets.has(nextId)) {
    index += 1;
    nextId = `${id}-${index}`;
  }

  return nextId;
};

const normalizeLazyModule = <P,>(loaded: FloatyLazyModule<P>): { default: ComponentType<P> } => {
  if (typeof loaded === 'function') {
    return { default: loaded };
  }

  return loaded;
};

const createLazyComponent = <P,>(loader: FloatyComponentLoader<P>) => {
  return lazy(async () => normalizeLazyModule(await loader()));
};

export const FloatyWidgetManager = forwardRef<FloatyWidgetManagerHandle, FloatyWidgetManagerProps>(
  ({ children, labels: labelsProp, icons = {}, theme }, ref) => {
    const widgetHandlesRef = useRef<Map<string, RefObject<FloatyHandle | null>>>(new Map());
    const zIndexRef = useRef(1000);
    const [widgets, setWidgets] = useState<Map<string, FloatyWidget>>(() => new Map());
    const widgetsRef = useRef(widgets);

    const updateWidgets = useCallback(
      (updater: (current: Map<string, FloatyWidget>) => Map<string, FloatyWidget>) => {
        const { current } = widgetsRef;
        const next = updater(current);

        if (next !== current) {
          widgetsRef.current = next;
          setWidgets(next);
        }

        return next;
      },
      [],
    );

    const labels = useMemo(() => ({ ...defaultLabels, ...labelsProp }), [labelsProp]);

    const bringToFront = useCallback(
      (id: string) => {
        updateWidgets((current) => {
          const previous = current.get(id);

          if (!previous) {
            return current;
          }

          zIndexRef.current += 1;
          const next = new Map(current);

          next.set(id, { ...previous, zIndex: zIndexRef.current });

          return next;
        });
      },
      [updateWidgets],
    );

    const open = useCallback(
      <P,>(widget: FloatyOpenWidget<P>, options: FloatyOpenOptions = {}) => {
        const duplicateStrategy: FloatyDuplicateStrategy = options.duplicateStrategy ?? 'replace';
        const { current } = widgetsRef;
        const widgetExists = current.has(widget.id);
        const widgetId =
          widgetExists && duplicateStrategy === 'duplicate'
            ? createDuplicateId(widget.id, current)
            : widget.id;

        updateWidgets((currentWidgets) => {
          if (widgetExists) {
            if (duplicateStrategy === 'focus' && currentWidgets.has(widget.id)) {
              const existing = currentWidgets.get(widget.id);

              if (!existing) {
                return currentWidgets;
              }

              zIndexRef.current += 1;
              const next = new Map(currentWidgets);

              next.set(widget.id, {
                ...existing,
                isMinimized: false,
                zIndex: zIndexRef.current,
              });

              return next;
            }
          }

          zIndexRef.current += 1;
          const next = new Map(currentWidgets);
          const component =
            widget.component ?? (widget.loader ? createLazyComponent(widget.loader) : undefined);

          next.set(widgetId, {
            id: widgetId,
            title: widget.title,
            component: component as ComponentType<unknown> | undefined,
            loader: widget.loader as FloatyComponentLoader<unknown> | undefined,
            props: widget.props,
            fallback: widget.fallback,
            position: widget.position,
            size: widget.size,
            className: widget.className,
            isCollapsed: widget.collapsed ?? false,
            isMinimized: widget.minimized ?? false,
            isPinned: widget.pinned ?? false,
            zIndex: zIndexRef.current,
          });

          return next;
        });

        return widgetId;
      },
      [updateWidgets],
    );

    const openComponent = useCallback(
      <P,>(component: ComponentType<P>, config: FloatyOpenWidgetBase<P>) =>
        open({ ...config, component }),
      [open],
    );

    const close = useCallback(
      (id: string) => {
        widgetHandlesRef.current.delete(id);
        updateWidgets((current) => {
          if (!current.has(id)) {
            return current;
          }

          const next = new Map(current);

          next.delete(id);

          return next;
        });
      },
      [updateWidgets],
    );

    const closeAll = useCallback(() => {
      widgetHandlesRef.current.clear();
      updateWidgets((current) => (current.size === 0 ? current : new Map()));
    }, [updateWidgets]);

    const update = useCallback(
      <P,>(id: string, patch: FloatyWidgetPatch<P>) => {
        const handle = widgetHandlesRef.current.get(id)?.current;
        const collapsed = patch.collapsed ?? patch.isCollapsed;
        const minimized = patch.minimized ?? patch.isMinimized;
        const pinned = patch.pinned ?? patch.isPinned;

        if (collapsed !== undefined) {
          handle?.[collapsed ? 'collapse' : 'expand']();
        }

        if (minimized !== undefined) {
          handle?.[minimized ? 'minimize' : 'restore']();
        }

        if (pinned !== undefined) {
          handle?.[pinned ? 'pin' : 'unpin']();
        }

        if (patch.size) {
          handle?.resizeTo(patch.size);
        }

        if (patch.position) {
          handle?.moveTo(patch.position);
        }

        updateWidgets((current) => {
          const previous = current.get(id);

          if (!previous) {
            return current;
          }

          const next = new Map(current);

          next.set(id, {
            ...previous,
            ...patch,
            isCollapsed: patch.collapsed ?? patch.isCollapsed ?? previous.isCollapsed,
            isMinimized: patch.minimized ?? patch.isMinimized ?? previous.isMinimized,
            isPinned: patch.pinned ?? patch.isPinned ?? previous.isPinned,
            component: patch.loader
              ? (createLazyComponent(patch.loader) as ComponentType<unknown>)
              : ((patch.component as ComponentType<unknown> | undefined) ?? previous.component),
            loader: (patch.loader as FloatyComponentLoader<unknown> | undefined) ?? previous.loader,
            props: patch.props ?? previous.props,
          });

          return next;
        });
      },
      [updateWidgets],
    );

    const updateProps = useCallback(
      <P,>(id: string, props: P) => {
        update(id, { props });
      },
      [update],
    );

    const registerFloaty = useCallback(
      (
        id: string,
        floatyRef: RefObject<FloatyHandle | null>,
        initialState: Partial<Omit<FloatyWidgetState, 'id'>> = {},
      ) => {
        widgetHandlesRef.current.set(id, floatyRef);
        updateWidgets((current) => {
          const previous = current.get(id);
          const next = new Map(current);

          next.set(id, {
            ...previous,
            id,
            title: initialState.title ?? previous?.title,
            position: initialState.position ?? previous?.position,
            size: initialState.size ?? previous?.size,
            isCollapsed: initialState.isCollapsed ?? previous?.isCollapsed ?? false,
            isMinimized: initialState.isMinimized ?? previous?.isMinimized ?? false,
            isPinned: initialState.isPinned ?? previous?.isPinned ?? false,
            zIndex: previous?.zIndex ?? zIndexRef.current,
          });

          return next;
        });

        return () => {
          widgetHandlesRef.current.delete(id);
          updateWidgets((current) => {
            const widget = current.get(id);

            if (widget?.component) {
              return current;
            }

            const next = new Map(current);

            next.delete(id);

            return next;
          });
        };
      },
      [updateWidgets],
    );

    const unregisterFloaty = useCallback((id: string) => {
      widgetHandlesRef.current.delete(id);
    }, []);

    const updateWidgetState = useCallback(
      (id: string, state: Partial<Omit<FloatyWidgetState, 'id'>>) => {
        updateWidgets((current) => {
          const previous = current.get(id);

          if (!previous) {
            return current;
          }

          const nextWidget = { ...previous, ...state };

          if (
            nextWidget.isCollapsed === previous.isCollapsed &&
            nextWidget.isMinimized === previous.isMinimized &&
            nextWidget.isPinned === previous.isPinned &&
            nextWidget.position === previous.position &&
            nextWidget.size === previous.size &&
            nextWidget.zIndex === previous.zIndex
          ) {
            return current;
          }

          const next = new Map(current);

          next.set(id, nextWidget);

          return next;
        });
      },
      [updateWidgets],
    );

    const expandAll = useCallback(() => {
      widgetHandlesRef.current.forEach((ref) => {
        ref?.current?.expand();
      });
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          next.set(id, { ...widget, isCollapsed: false });
        });

        return next;
      });
    }, [updateWidgets]);

    const collapseAll = useCallback(() => {
      widgetHandlesRef.current.forEach((ref) => {
        ref?.current?.collapse();
      });
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          next.set(id, { ...widget, isCollapsed: true });
        });

        return next;
      });
    }, [updateWidgets]);

    const minimizeAll = useCallback(() => {
      widgetHandlesRef.current.forEach((ref) => {
        ref?.current?.minimize();
      });
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          next.set(id, { ...widget, isMinimized: true });
        });

        return next;
      });
    }, [updateWidgets]);

    const restoreAll = useCallback(() => {
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          next.set(id, { ...widget, isMinimized: false });
        });

        return next;
      });
    }, [updateWidgets]);

    const pinAll = useCallback(() => {
      widgetHandlesRef.current.forEach((ref) => {
        ref?.current?.pin();
      });
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          next.set(id, { ...widget, isPinned: true });
        });

        return next;
      });
    }, [updateWidgets]);

    const unpinAll = useCallback(() => {
      widgetHandlesRef.current.forEach((ref) => {
        ref?.current?.unpin();
      });
      updateWidgets((current) => {
        const next = new Map(current);

        next.forEach((widget, id) => {
          next.set(id, { ...widget, isPinned: false });
        });

        return next;
      });
    }, [updateWidgets]);

    const expandWidget = useCallback(
      (id: string) => {
        widgetHandlesRef.current.get(id)?.current?.expand();
        updateWidgetState(id, { isCollapsed: false });
      },
      [updateWidgetState],
    );

    const collapseWidget = useCallback(
      (id: string) => {
        widgetHandlesRef.current.get(id)?.current?.collapse();
        updateWidgetState(id, { isCollapsed: true });
      },
      [updateWidgetState],
    );

    const minimizeWidget = useCallback(
      (id: string) => {
        widgetHandlesRef.current.get(id)?.current?.minimize();
        updateWidgetState(id, { isMinimized: true });
      },
      [updateWidgetState],
    );

    const restoreWidget = useCallback(
      (id: string) => {
        updateWidgetState(id, { isMinimized: false });
      },
      [updateWidgetState],
    );

    const pinWidget = useCallback(
      (id: string) => {
        widgetHandlesRef.current.get(id)?.current?.pin();
        updateWidgetState(id, { isPinned: true });
      },
      [updateWidgetState],
    );

    const unpinWidget = useCallback(
      (id: string) => {
        widgetHandlesRef.current.get(id)?.current?.unpin();
        updateWidgetState(id, { isPinned: false });
      },
      [updateWidgetState],
    );

    const getWidgetCount = useCallback(() => widgetsRef.current.size, []);

    const getWidget = useCallback((id: string) => widgetsRef.current.get(id), []);

    const manager = useMemo<FloatyWidgetManagerHandle>(
      () => ({
        open,
        openComponent,
        close,
        closeAll,
        update,
        updateProps,
        bringToFront,
        registerFloaty,
        unregisterFloaty,
        updateWidgetState,
        expandAll,
        collapseAll,
        minimizeAll,
        restoreAll,
        pinAll,
        unpinAll,
        expandWidget,
        collapseWidget,
        minimizeWidget,
        restoreWidget,
        pinWidget,
        unpinWidget,
        getWidgetCount,
        getWidget,
        widgets,
        labels,
        icons,
        theme,
      }),
      [
        open,
        openComponent,
        close,
        closeAll,
        update,
        updateProps,
        bringToFront,
        registerFloaty,
        unregisterFloaty,
        updateWidgetState,
        expandAll,
        collapseAll,
        minimizeAll,
        restoreAll,
        pinAll,
        unpinAll,
        expandWidget,
        collapseWidget,
        minimizeWidget,
        restoreWidget,
        pinWidget,
        unpinWidget,
        getWidgetCount,
        getWidget,
        widgets,
        labels,
        icons,
        theme,
      ],
    );

    useImperativeHandle(ref, () => manager, [manager]);

    return (
      <FloatyManagerContext.Provider value={manager}>{children}</FloatyManagerContext.Provider>
    );
  },
);

FloatyWidgetManager.displayName = 'FloatyWidgetManager';

/** Alias for `FloatyWidgetManager`. */
export const FloatyProvider = FloatyWidgetManager;
