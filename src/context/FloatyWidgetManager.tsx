import {
  createContext,
  useContext,
  useRef,
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

interface FloatyWidgetManagerHandle {
  registerFloaty: (id: string, ref: RefObject<FloatyHandle>) => void;
  unregisterFloaty: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  pinAll: () => void;
  unpinAll: () => void;
  expandWidget: (id: string) => void;
  collapseWidget: (id: string) => void;
  pinWidget: (id: string) => void;
  unpinWidget: (id: string) => void;
  getWidgetCount: () => number;
}

// Context solo para pasar el método de registro
const FloatyManagerContext = createContext<
  ((id: string, ref: RefObject<FloatyHandle>) => void) | null
>(null);

export interface FloatyWidgetManagerProps {
  children: ReactNode;
}

export const FloatyWidgetManager = forwardRef<
  FloatyWidgetManagerHandle,
  FloatyWidgetManagerProps
>(({ children }, ref) => {
  const widgetsRef = useRef<Map<string, RefObject<FloatyHandle>>>(
    new Map()
  );

  const registerFloaty = (id: string, floatyRef: RefObject<FloatyHandle>) => {
    widgetsRef.current.set(id, floatyRef);
  };

  const unregisterFloaty = (id: string) => {
    widgetsRef.current.delete(id);
  };

  const expandAll = () => {
    widgetsRef.current.forEach((ref) => {
      ref?.current?.expand();
    });
  };

  const collapseAll = () => {
    widgetsRef.current.forEach((ref) => {
      ref?.current?.collapse();
    });
  };

  const pinAll = () => {
    widgetsRef.current.forEach((ref) => {
      ref?.current?.pin();
    });
  };

  const unpinAll = () => {
    widgetsRef.current.forEach((ref) => {
      ref?.current?.unpin();
    });
  };

  const expandWidget = (id: string) => {
    widgetsRef.current.get(id)?.current?.expand();
  };

  const collapseWidget = (id: string) => {
    widgetsRef.current.get(id)?.current?.collapse();
  };

  const pinWidget = (id: string) => {
    widgetsRef.current.get(id)?.current?.pin();
  };

  const unpinWidget = (id: string) => {
    widgetsRef.current.get(id)?.current?.unpin();
  };

  const getWidgetCount = () => widgetsRef.current.size;

  useImperativeHandle(
    ref,
    () => ({
      registerFloaty,
      unregisterFloaty,
      expandAll,
      collapseAll,
      pinAll,
      unpinAll,
      expandWidget,
      collapseWidget,
      pinWidget,
      unpinWidget,
      getWidgetCount,
    }),
    []
  );

  return (
    <FloatyManagerContext.Provider value={registerFloaty}>
      {children}
    </FloatyManagerContext.Provider>
  );
});

FloatyWidgetManager.displayName = 'FloatyWidgetManager';

export const useFloatyManager = () => {
  const register = useContext(FloatyManagerContext);
  return register;
};
