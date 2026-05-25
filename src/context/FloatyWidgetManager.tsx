import {
  ComponentType,
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  forwardRef,
  RefObject,
  useImperativeHandle,
} from 'react';

export interface FloatyPosition {
  x: number;
  y: number;
}

export interface FloatySize {
  width?: number | string;
  height?: number | string;
}

export interface FloatyHandle {
  expand: () => void;
  collapse: () => void;
  pin: () => void;
  unpin: () => void;
  toggle: () => void;
}

export interface FloatyWidgetState {
  id: string;
  title?: ReactNode;
  isCollapsed: boolean;
  isPinned: boolean;
  position?: FloatyPosition;
  size?: FloatySize;
  zIndex: number;
}

export interface FloatyWidget<P = unknown> extends FloatyWidgetState {
  component?: ComponentType<P>;
  props?: P;
  className?: string;
}

export type FloatyOpenWidget<P> = {
  id: string;
  component: ComponentType<P>;
  props: P;
  title?: ReactNode;
  position?: FloatyPosition;
  size?: FloatySize;
  collapsed?: boolean;
  pinned?: boolean;
  className?: string;
};

export type FloatyDuplicateStrategy = 'replace' | 'focus' | 'duplicate';

export interface FloatyOpenOptions {
  duplicateStrategy?: FloatyDuplicateStrategy;
}

export type FloatyWidgetPatch<P = unknown> = Partial<
  Omit<FloatyWidget<P>, 'id' | 'component' | 'props'>
> & {
  component?: ComponentType<P>;
  props?: P;
  collapsed?: boolean;
  pinned?: boolean;
};

export interface FloatyTexts {
  pin: string;
  unpin: string;
  collapse: string;
  expand: string;
  close: string;
}

export type FloatyIconName = keyof FloatyTexts;
export type FloatyIconComponent = ComponentType<{ active?: boolean }>;
export type FloatyIcons = Partial<Record<FloatyIconName, FloatyIconComponent>>;

export interface FloatyTheme {
  background?: string;
  foreground?: string;
  bodyBackground?: string;
  headerBackground?: string;
  headerBackgroundHover?: string;
  headerForeground?: string;
  pinnedHeaderBackground?: string;
  pinnedHeaderBackgroundHover?: string;
  pinnedHeaderForeground?: string;
  border?: string;
  radius?: string;
  shadow?: string;
  fontFamily?: string;
  headerPaddingBlock?: string;
  headerPaddingInline?: string;
  bodyPadding?: string;
  buttonRadius?: string;
  buttonHoverBackground?: string;
}

export interface FloatyWidgetManagerHandle {
  open: <P>(widget: FloatyOpenWidget<P>, options?: FloatyOpenOptions) => string;
  openComponent: <P>(
    component: ComponentType<P>,
    config: Omit<FloatyOpenWidget<P>, 'component'>
  ) => string;
  close: (id: string) => void;
  closeAll: () => void;
  update: <P = unknown>(id: string, patch: FloatyWidgetPatch<P>) => void;
  updateProps: <P>(id: string, props: P) => void;
  bringToFront: (id: string) => void;
  registerFloaty: (
    id: string,
    ref: RefObject<FloatyHandle | null>,
    initialState?: Partial<Omit<FloatyWidgetState, 'id'>>
  ) => () => void;
  unregisterFloaty: (id: string) => void;
  updateWidgetState: (
    id: string,
    state: Partial<Omit<FloatyWidgetState, 'id'>>
  ) => void;
  expandAll: () => void;
  collapseAll: () => void;
  pinAll: () => void;
  unpinAll: () => void;
  expandWidget: (id: string) => void;
  collapseWidget: (id: string) => void;
  pinWidget: (id: string) => void;
  unpinWidget: (id: string) => void;
  getWidgetCount: () => number;
  getWidget: (id: string) => FloatyWidget | undefined;
  widgets: Map<string, FloatyWidget>;
  labels: FloatyTexts;
  icons: FloatyIcons;
  theme?: FloatyTheme;
}

const FloatyManagerContext = createContext<FloatyWidgetManagerHandle | null>(
  null
);

export interface FloatyWidgetManagerProps {
  children: ReactNode;
  labels?: Partial<FloatyTexts>;
  icons?: FloatyIcons;
  theme?: FloatyTheme;
}

const defaultLabels: FloatyTexts = {
  pin: 'Pin',
  unpin: 'Unpin',
  collapse: 'Collapse',
  expand: 'Expand',
  close: 'Close',
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
      const duplicateStrategy = options.duplicateStrategy ?? 'replace';
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
              zIndex: zIndexRef.current,
            });
            return next;
          }
        }

        zIndexRef.current += 1;
        const next = new Map(current);
        next.set(widgetId, {
          id: widgetId,
          title: widget.title,
          component: widget.component as ComponentType<unknown>,
          props: widget.props,
          position: widget.position,
          size: widget.size,
          className: widget.className,
          isCollapsed: widget.collapsed ?? false,
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
      config: Omit<FloatyOpenWidget<P>, 'component'>
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
          isPinned: patch.pinned ?? patch.isPinned ?? previous.isPinned,
          component: (patch.component as ComponentType<unknown> | undefined) ?? previous.component,
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
      pinAll,
      unpinAll,
      expandWidget,
      collapseWidget,
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
      pinAll,
      unpinAll,
      expandWidget,
      collapseWidget,
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

export const useFloatyManager = () => {
  return useContext(FloatyManagerContext);
};

export const useFloatyWidgetManager = () => {
  const manager = useContext(FloatyManagerContext);

  if (!manager) {
    throw new Error(
      'useFloatyWidgetManager must be used within FloatyWidgetManager'
    );
  }

  return manager;
};

export const useFloatyWidget = (id: string) => {
  const manager = useFloatyWidgetManager();
  return manager.getWidget(id);
};

export const useFloaty = useFloatyWidgetManager;
