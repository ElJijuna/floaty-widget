import {
  ComponentType,
  createContext,
  lazy,
  useRef,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  RefObject,
  useImperativeHandle,
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

export const FloatyManagerContext = createContext<FloatyWidgetManagerHandle | null>(
  null
);

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

const normalizeLazyModule = <P,>(
  loaded: FloatyLazyModule<P>
): { default: ComponentType<P> } => {
  if (typeof loaded === 'function') {
    return { default: loaded };
  }

  return loaded;
};

const createLazyComponent = <P,>(loader: FloatyComponentLoader<P>) => {
  return lazy(() => loader().then(normalizeLazyModule));
};

export const FloatyWidgetManager = forwardRef<
  FloatyWidgetManagerHandle,
  FloatyWidgetManagerProps
>(({ children, labels: labelsProp, icons = {}, theme }, ref) => {
  const widgetHandlesRef = useRef<Map<string, RefObject<FloatyHandle | null>>>(
    new Map()
  );
  const zIndexRef = useRef(1000);
  const [widgets, setWidgets] = useState<Map<string, FloatyWidget>>(
    () => new Map()
  );

  const labels = useMemo(
    () => ({ ...defaultLabels, ...labelsProp }),
    [labelsProp]
  );

  const bringToFront = useCallback((id: string) => {
    setWidgets((current) => {
      const previous = current.get(id);
      if (!previous) return current;

      zIndexRef.current += 1;
      const next = new Map(current);
      next.set(id, { ...previous, zIndex: zIndexRef.current });
      return next;
    });
  }, []);

  const open = useCallback(
    <P,>(
      widget: FloatyOpenWidget<P>,
      options: FloatyOpenOptions = {}
    ) => {
      const duplicateStrategy: FloatyDuplicateStrategy = options.duplicateStrategy ?? 'replace';
      const widgetExists = widgets.has(widget.id);
      const widgetId =
        widgetExists && duplicateStrategy === 'duplicate'
          ? createDuplicateId(widget.id, widgets)
          : widget.id;

      setWidgets((current) => {
        if (widgetExists) {
          if (duplicateStrategy === 'focus' && current.has(widget.id)) {
            zIndexRef.current += 1;
            const next = new Map(current);
            next.set(widget.id, {
              ...current.get(widget.id)!,
              isMinimized: false,
              zIndex: zIndexRef.current,
            });
            return next;
          }
        }

        zIndexRef.current += 1;
        const next = new Map(current);
        const component =
          widget.component ??
          (widget.loader ? createLazyComponent(widget.loader) : undefined);

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
    [widgets]
  );

  const openComponent = useCallback(
    <P,>(
      component: ComponentType<P>,
      config: FloatyOpenWidgetBase<P>
    ) => open({ ...config, component }),
    [open]
  );

  const close = useCallback((id: string) => {
    widgetHandlesRef.current.delete(id);
    setWidgets((current) => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }, []);

  const closeAll = useCallback(() => {
    widgetHandlesRef.current.clear();
    setWidgets(new Map());
  }, []);

  const update = useCallback(
    <P,>(id: string, patch: FloatyWidgetPatch<P>) => {
      setWidgets((current) => {
        const previous = current.get(id);
        if (!previous) return current;

        const next = new Map(current);
        next.set(id, {
          ...previous,
          ...patch,
          isCollapsed: patch.collapsed ?? patch.isCollapsed ?? previous.isCollapsed,
          isMinimized: patch.minimized ?? patch.isMinimized ?? previous.isMinimized,
          isPinned: patch.pinned ?? patch.isPinned ?? previous.isPinned,
          component: patch.loader
            ? createLazyComponent(patch.loader) as ComponentType<unknown>
            : (patch.component as ComponentType<unknown> | undefined) ?? previous.component,
          loader: (patch.loader as FloatyComponentLoader<unknown> | undefined) ?? previous.loader,
          props: patch.props ?? previous.props,
        });
        return next;
      });
    },
    []
  );

  const updateProps = useCallback(
    <P,>(id: string, props: P) => {
      update(id, { props });
    },
    [update]
  );

  const registerFloaty = useCallback(
    (
      id: string,
      floatyRef: RefObject<FloatyHandle | null>,
      initialState: Partial<Omit<FloatyWidgetState, 'id'>> = {}
    ) => {
      widgetHandlesRef.current.set(id, floatyRef);
      setWidgets((current) => {
        const previous = current.get(id);
        const next = new Map(current);
        next.set(id, {
          ...previous,
          id,
          title: initialState.title ?? previous?.title,
          position: initialState.position ?? previous?.position,
          size: initialState.size ?? previous?.size,
          isCollapsed: initialState.isCollapsed ?? false,
          isMinimized: initialState.isMinimized ?? previous?.isMinimized ?? false,
          isPinned: initialState.isPinned ?? false,
          zIndex: previous?.zIndex ?? zIndexRef.current,
        });
        return next;
      });

      return () => {
        widgetHandlesRef.current.delete(id);
        setWidgets((current) => {
          const widget = current.get(id);
          if (widget?.component) return current;

          const next = new Map(current);
          next.delete(id);
          return next;
        });
      };
    },
    []
  );

  const unregisterFloaty = useCallback((id: string) => {
    widgetHandlesRef.current.delete(id);
  }, []);

  const updateWidgetState = useCallback(
    (id: string, state: Partial<Omit<FloatyWidgetState, 'id'>>) => {
      setWidgets((current) => {
        const previous = current.get(id);
        if (!previous) return current;

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
    []
  );

  const expandAll = useCallback(() => {
    widgetHandlesRef.current.forEach((ref) => {
      ref?.current?.expand();
    });
    setWidgets((current) => {
      const next = new Map(current);
      next.forEach((widget, id) => {
        next.set(id, { ...widget, isCollapsed: false });
      });
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    widgetHandlesRef.current.forEach((ref) => {
      ref?.current?.collapse();
    });
    setWidgets((current) => {
      const next = new Map(current);
      next.forEach((widget, id) => {
        next.set(id, { ...widget, isCollapsed: true });
      });
      return next;
    });
  }, []);

  const minimizeAll = useCallback(() => {
    widgetHandlesRef.current.forEach((ref) => {
      ref?.current?.minimize();
    });
    setWidgets((current) => {
      const next = new Map(current);
      next.forEach((widget, id) => {
        next.set(id, { ...widget, isMinimized: true });
      });
      return next;
    });
  }, []);

  const restoreAll = useCallback(() => {
    setWidgets((current) => {
      const next = new Map(current);
      next.forEach((widget, id) => {
        next.set(id, { ...widget, isMinimized: false });
      });
      return next;
    });
  }, []);

  const pinAll = useCallback(() => {
    widgetHandlesRef.current.forEach((ref) => {
      ref?.current?.pin();
    });
    setWidgets((current) => {
      const next = new Map(current);
      next.forEach((widget, id) => {
        next.set(id, { ...widget, isPinned: true });
      });
      return next;
    });
  }, []);

  const unpinAll = useCallback(() => {
    widgetHandlesRef.current.forEach((ref) => {
      ref?.current?.unpin();
    });
    setWidgets((current) => {
      const next = new Map(current);
      next.forEach((widget, id) => {
        next.set(id, { ...widget, isPinned: false });
      });
      return next;
    });
  }, []);

  const expandWidget = useCallback((id: string) => {
    widgetHandlesRef.current.get(id)?.current?.expand();
    updateWidgetState(id, { isCollapsed: false });
  }, [updateWidgetState]);

  const collapseWidget = useCallback((id: string) => {
    widgetHandlesRef.current.get(id)?.current?.collapse();
    updateWidgetState(id, { isCollapsed: true });
  }, [updateWidgetState]);

  const minimizeWidget = useCallback((id: string) => {
    widgetHandlesRef.current.get(id)?.current?.minimize();
    updateWidgetState(id, { isMinimized: true });
  }, [updateWidgetState]);

  const restoreWidget = useCallback((id: string) => {
    updateWidgetState(id, { isMinimized: false });
  }, [updateWidgetState]);

  const pinWidget = useCallback((id: string) => {
    widgetHandlesRef.current.get(id)?.current?.pin();
    updateWidgetState(id, { isPinned: true });
  }, [updateWidgetState]);

  const unpinWidget = useCallback((id: string) => {
    widgetHandlesRef.current.get(id)?.current?.unpin();
    updateWidgetState(id, { isPinned: false });
  }, [updateWidgetState]);

  const getWidgetCount = useCallback(() => widgets.size, [widgets.size]);

  const getWidget = useCallback(
    (id: string) => widgets.get(id),
    [widgets]
  );

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
    ]
  );

  useImperativeHandle(
    ref,
    () => manager,
    [manager]
  );

  return (
    <FloatyManagerContext.Provider value={manager}>
      {children}
    </FloatyManagerContext.Provider>
  );
});

FloatyWidgetManager.displayName = 'FloatyWidgetManager';

/** Alias for `FloatyWidgetManager`. */
export const FloatyProvider = FloatyWidgetManager;
