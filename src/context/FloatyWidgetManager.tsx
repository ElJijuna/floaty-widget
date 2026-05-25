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

/** X/Y coordinates for positioning a widget on screen. */
export interface FloatyPosition {
  x: number;
  y: number;
}

/** Explicit dimensions for a widget. Accepts pixel numbers or CSS strings (e.g. `'50%'`). */
export interface FloatySize {
  width?: number | string;
  height?: number | string;
}

/** Imperative handle exposed via `ref` on a `<Floaty>` component. */
export interface FloatyHandle {
  /** Expands the widget body if it is collapsed. */
  expand: () => void;
  /** Collapses the widget body, keeping the header visible. */
  collapse: () => void;
  /** Hides the widget completely (removed from the DOM). */
  minimize: () => void;
  /** Makes the widget visible again after it was minimized. */
  restore: () => void;
  /** Locks the widget in place so it cannot be dragged. */
  pin: () => void;
  /** Unlocks the widget so it can be dragged again. */
  unpin: () => void;
  /** Toggles the collapsed state of the widget body. */
  toggle: () => void;
  /** Toggles the minimized state of the widget. */
  toggleMinimized: () => void;
}

/** Runtime state of a widget tracked by `FloatyWidgetManager`. */
export interface FloatyWidgetState {
  /** Unique identifier for the widget. */
  id: string;
  /** Content displayed in the widget header. */
  title?: ReactNode;
  /** Whether the widget body is hidden (header still visible). */
  isCollapsed: boolean;
  /** Whether the widget is fully hidden from the screen. */
  isMinimized: boolean;
  /** Whether the widget is locked in place and cannot be dragged. */
  isPinned: boolean;
  /** Current position on screen. */
  position?: FloatyPosition;
  /** Current dimensions. */
  size?: FloatySize;
  /** CSS `z-index` used to layer widgets on top of each other. */
  zIndex: number;
}

/** Full descriptor of a widget registered in `FloatyWidgetManager`, including its component and props. */
export interface FloatyWidget<P = unknown> extends FloatyWidgetState {
  /** React component rendered inside the widget body. */
  component?: ComponentType<P>;
  /** Props forwarded to `component`. */
  props?: P;
  /** Additional CSS class applied to the widget root element. */
  className?: string;
}

/** Payload passed to `manager.open()` to create a new widget. */
export type FloatyOpenWidget<P> = {
  /** Unique identifier. If a widget with this id already exists, `duplicateStrategy` controls the behaviour. */
  id: string;
  /** React component to render inside the widget body. */
  component: ComponentType<P>;
  /** Props forwarded to `component`. */
  props: P;
  /** Content displayed in the widget header. */
  title?: ReactNode;
  /** Initial position on screen. */
  position?: FloatyPosition;
  /** Initial dimensions. */
  size?: FloatySize;
  /** Open the widget already collapsed. */
  collapsed?: boolean;
  /** Open the widget already minimized. */
  minimized?: boolean;
  /** Open the widget already pinned. */
  pinned?: boolean;
  /** Additional CSS class applied to the widget root element. */
  className?: string;
};

/**
 * Controls what happens when `open()` is called with an id that already exists.
 *
 * - `'replace'` — replaces the existing widget (default).
 * - `'focus'`   — brings the existing widget to the front without replacing it.
 * - `'duplicate'` — opens a second widget with a suffixed id (e.g. `my-id-2`).
 */
export type FloatyDuplicateStrategy = 'replace' | 'focus' | 'duplicate';

/** Options accepted by `manager.open()`. */
export interface FloatyOpenOptions {
  /** @default 'replace' */
  duplicateStrategy?: FloatyDuplicateStrategy;
}

/**
 * Partial update applied to an existing widget via `manager.update()`.
 * Supports both the camelCase state flags (`isCollapsed`) and their shorthand aliases (`collapsed`).
 */
export type FloatyWidgetPatch<P = unknown> = Partial<
  Omit<FloatyWidget<P>, 'id' | 'component' | 'props'>
> & {
  component?: ComponentType<P>;
  props?: P;
  collapsed?: boolean;
  minimized?: boolean;
  pinned?: boolean;
};

/** Localised labels for every action button rendered in the widget header. */
export interface FloatyTexts {
  pin: string;
  unpin: string;
  collapse: string;
  expand: string;
  minimize: string;
  restore: string;
  close: string;
}

/** Key matching one of the action buttons in the widget header. */
export type FloatyIconName = keyof FloatyTexts;
/** A React component used as a custom icon. Receives `active` when the action is currently active. */
export type FloatyIconComponent = ComponentType<{ active?: boolean }>;
/** Map of custom icon components, keyed by action name. Unset keys fall back to the built-in SVG icons. */
export type FloatyIcons = Partial<Record<FloatyIconName, FloatyIconComponent>>;

/** CSS custom-property overrides that control the visual appearance of all widgets. */
export interface FloatyTheme {
  /** Widget background color. Maps to `--floaty-bg`. */
  background?: string;
  /** Widget text color. Maps to `--floaty-fg`. */
  foreground?: string;
  /** Body section background color. Maps to `--floaty-body-bg`. */
  bodyBackground?: string;
  /** Header background color. Maps to `--floaty-header-bg`. */
  headerBackground?: string;
  /** Header background color on hover. Defaults to `headerBackground`. */
  headerBackgroundHover?: string;
  /** Header text color. Maps to `--floaty-header-fg`. */
  headerForeground?: string;
  /** Header background color when the widget is pinned. */
  pinnedHeaderBackground?: string;
  /** Header background color on hover when pinned. Defaults to `pinnedHeaderBackground`. */
  pinnedHeaderBackgroundHover?: string;
  /** Header text color when the widget is pinned. */
  pinnedHeaderForeground?: string;
  /** Border style for unpinned widgets. Maps to `--floaty-border`. */
  border?: string;
  /** Border style for pinned widgets. Maps to `--floaty-pinned-border`. */
  pinnedBorder?: string;
  /** Border radius. Maps to `--floaty-radius`. */
  radius?: string;
  /** Box shadow. Maps to `--floaty-shadow`. */
  shadow?: string;
  /** Font family applied to the widget. Maps to `--floaty-font-family`. */
  fontFamily?: string;
  /** Block (top/bottom) padding of the header. Maps to `--floaty-header-padding-block`. */
  headerPaddingBlock?: string;
  /** Inline (left/right) padding of the header. Maps to `--floaty-header-padding-inline`. */
  headerPaddingInline?: string;
  /** Padding inside the widget body. Maps to `--floaty-body-padding`. */
  bodyPadding?: string;
  /** Border radius of header action buttons. Maps to `--floaty-button-radius`. */
  buttonRadius?: string;
  /** Background color of header action buttons on hover. Maps to `--floaty-button-hover-bg`. */
  buttonHoverBackground?: string;
}

/** Full API surface returned by `useFloatyWidgetManager()` and exposed via the `FloatyWidgetManager` ref. */
export interface FloatyWidgetManagerHandle {
  /**
   * Opens a new widget (or applies `duplicateStrategy` if the id already exists).
   * @returns The id of the opened widget.
   */
  open: <P>(widget: FloatyOpenWidget<P>, options?: FloatyOpenOptions) => string;
  /**
   * Shorthand for `open` — pass the component separately from the rest of the config.
   * @returns The id of the opened widget.
   */
  openComponent: <P>(
    component: ComponentType<P>,
    config: Omit<FloatyOpenWidget<P>, 'component'>
  ) => string;
  /** Removes a widget by id. */
  close: (id: string) => void;
  /** Removes all widgets. */
  closeAll: () => void;
  /** Applies a partial update to a widget. */
  update: <P = unknown>(id: string, patch: FloatyWidgetPatch<P>) => void;
  /** Updates only the props of a widget's component without touching its state. */
  updateProps: <P>(id: string, props: P) => void;
  /** Raises a widget above all others by increasing its `z-index`. */
  bringToFront: (id: string) => void;
  /**
   * Internal — called by `<Floaty id="…">` on mount to synchronise with the manager.
   * @returns A cleanup function that unregisters the widget on unmount.
   */
  registerFloaty: (
    id: string,
    ref: RefObject<FloatyHandle | null>,
    initialState?: Partial<Omit<FloatyWidgetState, 'id'>>
  ) => () => void;
  /** Internal — removes the imperative ref from the registry without destroying the widget entry. */
  unregisterFloaty: (id: string) => void;
  /** Internal — syncs state changes from `<Floaty>` back into the manager's widget map. */
  updateWidgetState: (
    id: string,
    state: Partial<Omit<FloatyWidgetState, 'id'>>
  ) => void;
  /** Expands all widgets. */
  expandAll: () => void;
  /** Collapses all widgets. */
  collapseAll: () => void;
  /** Minimizes all widgets. */
  minimizeAll: () => void;
  /** Restores all minimized widgets. */
  restoreAll: () => void;
  /** Pins all widgets. */
  pinAll: () => void;
  /** Unpins all widgets. */
  unpinAll: () => void;
  /** Expands a single widget by id. */
  expandWidget: (id: string) => void;
  /** Collapses a single widget by id. */
  collapseWidget: (id: string) => void;
  /** Minimizes a single widget by id. */
  minimizeWidget: (id: string) => void;
  /** Restores a single minimized widget by id. */
  restoreWidget: (id: string) => void;
  /** Pins a single widget by id. */
  pinWidget: (id: string) => void;
  /** Unpins a single widget by id. */
  unpinWidget: (id: string) => void;
  /** Returns the total number of registered widgets. */
  getWidgetCount: () => number;
  /** Returns the current state of a widget, or `undefined` if it does not exist. */
  getWidget: (id: string) => FloatyWidget | undefined;
  /** Live map of all registered widgets, keyed by id. */
  widgets: Map<string, FloatyWidget>;
  /** Resolved labels used for action buttons across all widgets. */
  labels: FloatyTexts;
  /** Custom icon components used across all widgets. */
  icons: FloatyIcons;
  /** Active theme tokens applied via CSS custom properties. */
  theme?: FloatyTheme;
}

const FloatyManagerContext = createContext<FloatyWidgetManagerHandle | null>(
  null
);

/** Props for the `FloatyWidgetManager` provider component. */
export interface FloatyWidgetManagerProps {
  children: ReactNode;
  /** Override the default action button labels for all widgets inside this provider. */
  labels?: Partial<FloatyTexts>;
  /** Custom icon components for action buttons, applied to all widgets inside this provider. */
  icons?: FloatyIcons;
  /** Theme tokens applied via CSS custom properties to all widgets inside this provider. */
  theme?: FloatyTheme;
}

const defaultLabels: FloatyTexts = {
  pin: 'Pin',
  unpin: 'Unpin',
  collapse: 'Collapse',
  expand: 'Expand',
  minimize: 'Minimize',
  restore: 'Restore',
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
              isMinimized: false,
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
          isMinimized: patch.minimized ?? patch.isMinimized ?? previous.isMinimized,
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

/**
 * Returns the `FloatyWidgetManagerHandle` from context, or `null` if used outside a provider.
 * Prefer `useFloatyWidgetManager` in most cases — this variant is useful when the provider is optional.
 */
export const useFloatyManager = () => {
  return useContext(FloatyManagerContext);
};

/**
 * Returns the `FloatyWidgetManagerHandle` from the nearest `FloatyWidgetManager` provider.
 * @throws If called outside of a `FloatyWidgetManager`.
 */
export const useFloatyWidgetManager = () => {
  const manager = useContext(FloatyManagerContext);

  if (!manager) {
    throw new Error(
      'useFloatyWidgetManager must be used within FloatyWidgetManager'
    );
  }

  return manager;
};

/**
 * Returns the current state of a single widget by id, or `undefined` if it does not exist.
 * Re-renders whenever the widget state changes.
 *
 * @param id - The widget id to observe.
 */
export const useFloatyWidget = (id: string) => {
  const manager = useFloatyWidgetManager();
  return manager.getWidget(id);
};

/** Alias for `useFloatyWidgetManager`. */
export const useFloaty = useFloatyWidgetManager;
