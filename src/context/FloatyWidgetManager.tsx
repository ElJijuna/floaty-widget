import {
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

export interface FloatyHandle {
  expand: () => void;
  collapse: () => void;
  pin: () => void;
  unpin: () => void;
  toggle: () => void;
}

export interface FloatyWidgetState {
  id: string;
  isCollapsed: boolean;
  isPinned: boolean;
}

export interface FloatyWidgetManagerHandle {
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
  getWidget: (id: string) => FloatyWidgetState | undefined;
  widgets: Map<string, FloatyWidgetState>;
}

const FloatyManagerContext = createContext<FloatyWidgetManagerHandle | null>(
  null
);

export interface FloatyWidgetManagerProps {
  children: ReactNode;
}

export const FloatyWidgetManager = forwardRef<
  FloatyWidgetManagerHandle,
  FloatyWidgetManagerProps
>(({ children }, ref) => {
  const widgetHandlesRef = useRef<Map<string, RefObject<FloatyHandle | null>>>(
    new Map()
  );
  const [widgets, setWidgets] = useState<Map<string, FloatyWidgetState>>(
    () => new Map()
  );

  const registerFloaty = useCallback(
    (
      id: string,
      floatyRef: RefObject<FloatyHandle | null>,
      initialState: Partial<Omit<FloatyWidgetState, 'id'>> = {}
    ) => {
      widgetHandlesRef.current.set(id, floatyRef);
      setWidgets((current) => {
        const next = new Map(current);
        next.set(id, {
          id,
          isCollapsed: initialState.isCollapsed ?? false,
          isPinned: initialState.isPinned ?? false,
        });
        return next;
      });

      return () => {
        widgetHandlesRef.current.delete(id);
        setWidgets((current) => {
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
    setWidgets((current) => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }, []);

  const updateWidgetState = useCallback(
    (id: string, state: Partial<Omit<FloatyWidgetState, 'id'>>) => {
      setWidgets((current) => {
        const previous = current.get(id);
        if (!previous) return current;

        const nextWidget = { ...previous, ...state };
        if (
          nextWidget.isCollapsed === previous.isCollapsed &&
          nextWidget.isPinned === previous.isPinned
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
  }, []);

  const collapseAll = useCallback(() => {
    widgetHandlesRef.current.forEach((ref) => {
      ref?.current?.collapse();
    });
  }, []);

  const pinAll = useCallback(() => {
    widgetHandlesRef.current.forEach((ref) => {
      ref?.current?.pin();
    });
  }, []);

  const unpinAll = useCallback(() => {
    widgetHandlesRef.current.forEach((ref) => {
      ref?.current?.unpin();
    });
  }, []);

  const expandWidget = useCallback((id: string) => {
    widgetHandlesRef.current.get(id)?.current?.expand();
  }, []);

  const collapseWidget = useCallback((id: string) => {
    widgetHandlesRef.current.get(id)?.current?.collapse();
  }, []);

  const pinWidget = useCallback((id: string) => {
    widgetHandlesRef.current.get(id)?.current?.pin();
  }, []);

  const unpinWidget = useCallback((id: string) => {
    widgetHandlesRef.current.get(id)?.current?.unpin();
  }, []);

  const getWidgetCount = useCallback(() => widgetHandlesRef.current.size, []);

  const getWidget = useCallback(
    (id: string) => widgets.get(id),
    [widgets]
  );

  const manager = useMemo<FloatyWidgetManagerHandle>(
    () => ({
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
    }),
    [
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
