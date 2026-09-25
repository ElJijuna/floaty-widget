import {
  type CSSProperties,
  forwardRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import './Floaty.css';
import { useFloatyManager } from '../../hooks/useFloatyWidgetManager';
import type {
  FloatyControlledState,
  FloatyHandle,
  FloatyIcons,
  FloatyMode,
  FloatyPosition,
  FloatyResizeDirection,
  FloatySize,
  FloatySizeConstraints,
  FloatySnapZone,
  FloatyTexts,
  FloatyWindowStyle,
} from '../../types';
import {
  clampPosition,
  constrainSize,
  DEFAULT_MIN_HEIGHT,
  DEFAULT_MIN_WIDTH,
  DEFAULT_SNAP_THRESHOLD,
  getSnapGeometry,
  getSnapZone,
  numericSize,
  readPersistedState,
  writePersistedState,
} from '../../utils/windowGeometry';

/** Props for the `<Floaty>` component. */
export interface FloatyProps {
  /** Content rendered inside the widget body. */
  children?: ReactNode;
  /** Content displayed in the widget header bar. */
  title?: ReactNode;
  /** Inline styles applied to the widget root element. */
  style?: CSSProperties;
  /** Additional CSS class applied to the widget root element. */
  className?: string;
  /**
   * Unique identifier used to register this widget with a parent `FloatyWidgetManager`.
   * Required if you want to control the widget from outside via `useFloatyWidgetManager`.
   */
  id?: string;
  /** Override the default action button labels for this widget only. */
  labels?: Partial<FloatyTexts>;
  /** Custom icon components for action buttons on this widget only. */
  icons?: FloatyIcons;
  /** Visual layout. `window` keeps the header integrated and always visible. @default 'floating' */
  mode?: FloatyMode;
  /** Complete externally controlled state. When supplied, `onValueChange` receives proposed updates. */
  value?: FloatyControlledState;
  /** Called with the next complete state after a user or imperative action. */
  onValueChange?: (value: FloatyControlledState) => void;
  /** Title bar appearance in window mode. @default 'windows' */
  windowStyle?: FloatyWindowStyle;
  /** Application icon shown in the window title bar. */
  windowIcon?: ReactNode;
  /** Whether the widget body is collapsed on first render. @default false */
  defaultCollapsed?: boolean;
  /** Whether the widget is minimized (hidden) on first render. @default false */
  defaultMinimized?: boolean;
  /** Whether the widget is pinned (non-draggable) on first render. @default false */
  defaultPinned?: boolean;
  /** Whether the widget fills the viewport on first render. @default false */
  defaultMaximized?: boolean;
  /** Initial screen position. @default \{ x: 100, y: 100 \} */
  initialPosition?: FloatyPosition;
  /** Initial dimensions. */
  initialSize?: FloatySize;
  /** Pixel constraints respected by pointer, keyboard and imperative resizing. */
  sizeConstraints?: FloatySizeConstraints;
  /** Enables edge and corner snapping while dragging window mode. @default true */
  snap?: boolean;
  /** Distance from a viewport edge that activates snap preview. @default 28 */
  snapThreshold?: number;
  /** localStorage key used to persist geometry and window state. */
  persistenceKey?: string;
  /** CSS `z-index` for this widget. */
  zIndex?: number;
  /** Whether this widget is currently the active/front-most widget. */
  isActive?: boolean;
  /** Called when the user clicks the close button. If omitted, the close button is not rendered. */
  onClose?: () => void;
  /** Called when the user clicks or starts dragging the widget (used to bring it to front). */
  onFocus?: () => void;
  /** Called when this widget gains or loses front-most focus. */
  onFocusChange?: (focused: boolean) => void;
  /** Called when a pointer resize starts. */
  onResizeStart?: (size: FloatySize) => void;
  /** Called whenever the committed size changes. */
  onResize?: (size: FloatySize) => void;
  /** Called when a pointer resize ends. */
  onResizeEnd?: (size: FloatySize) => void;
  /** Called whenever the committed position changes. */
  onPositionChange?: (position: FloatyPosition) => void;
  /** Called when maximized state changes. */
  onMaximizeChange?: (maximized: boolean) => void;
}

const defaultLabels: FloatyTexts = {
  pin: 'Pin',
  unpin: 'Unpin',
  collapse: 'Collapse',
  expand: 'Expand',
  minimize: 'Minimize',
  restore: 'Restore',
  close: 'Close',
  resize: 'Resize widget',
  maximize: 'Maximize',
  unmaximize: 'Restore window',
  loading: 'Loading widget...',
  loadError: 'Could not load widget',
  retry: 'Retry',
};

const KEYBOARD_MOVE_STEP = 10;
const KEYBOARD_MOVE_LARGE_STEP = 50;
const KEYBOARD_RESIZE_STEP = 16;
const KEYBOARD_RESIZE_LARGE_STEP = 64;
const RESIZE_DIRECTIONS: FloatyResizeDirection[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

const resolveStateAction = <T,>(action: SetStateAction<T>, previous: T): T =>
  typeof action === 'function' ? (action as (value: T) => T)(previous) : action;

const getKeyboardStep = (
  e: ReactKeyboardEvent<HTMLElement>,
  baseStep: number,
  largeStep: number,
) => {
  if (e.altKey) {
    return 1;
  }

  if (e.shiftKey) {
    return largeStep;
  }

  return baseStep;
};

const PinIcon = ({ pinned }: { pinned: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {pinned ? (
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3-13h-2v4h-2v-4h-2v2h4v2h-4v2h6v-6" />
    ) : (
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9h-7v2h7v-2" />
    )}
  </svg>
);

const ChevronIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`chevron ${collapsed ? 'collapsed' : ''}`}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const MinusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
  </svg>
);

const ResizeIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {active ? (
      <>
        <path d="M4 14v6h6" />
        <path d="M20 10V4h-6" />
        <path d="M14 10 20 4" />
        <path d="M10 14 4 20" />
      </>
    ) : (
      <>
        <path d="M15 3h6v6" />
        <path d="M21 3 14 10" />
        <path d="M9 21H3v-6" />
        <path d="M3 21l7-7" />
      </>
    )}
  </svg>
);

const MaximizeIcon = ({ maximized }: { maximized: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    {maximized ? (
      <>
        <rect x="4" y="8" width="12" height="12" rx="1" />
        <path d="M8 8V4h12v12h-4" />
      </>
    ) : (
      <rect x="4" y="4" width="16" height="16" rx="1" />
    )}
  </svg>
);

/**
 * A draggable, resizable, collapsible floating widget.
 *
 * Supports imperative control via `ref` (see `FloatyHandle`) and automatic
 * state synchronisation when nested inside a `FloatyWidgetManager` and given an `id`.
 *
 * @example
 * ```tsx
 * const ref = useRef<FloatyHandle>(null);
 *
 * <Floaty ref={ref} id="my-widget" title="My Widget" onClose={() => {}}>
 *   <p>Content</p>
 * </Floaty>
 * ```
 */
export const Floaty = forwardRef<FloatyHandle, FloatyProps>(
  (
    {
      children = 'Content',
      title = 'Floaty',
      style = {},
      className,
      id,
      labels: labelsProp,
      icons = {},
      mode = 'floating',
      value,
      onValueChange,
      windowStyle = 'windows',
      windowIcon,
      defaultCollapsed = false,
      defaultMinimized = false,
      defaultPinned = false,
      defaultMaximized = false,
      initialPosition = { x: 100, y: 100 },
      initialSize,
      sizeConstraints = {},
      snap = true,
      snapThreshold = DEFAULT_SNAP_THRESHOLD,
      persistenceKey,
      zIndex,
      isActive = false,
      onClose,
      onFocus,
      onFocusChange,
      onResizeStart,
      onResize,
      onResizeEnd,
      onPositionChange,
      onMaximizeChange,
    }: FloatyProps,
    ref,
  ) => {
    const manager = useFloatyManager();
    const registerFloaty = manager?.registerFloaty;
    const updateWidgetState = manager?.updateWidgetState;
    const labels = useMemo(
      () => ({ ...defaultLabels, ...manager?.labels, ...labelsProp }),
      [manager?.labels, labelsProp],
    );
    const mergedIcons = useMemo(() => ({ ...manager?.icons, ...icons }), [manager?.icons, icons]);
    const [persistedState] = useState(() => readPersistedState(persistenceKey));
    const [internalState, setInternalState] = useState<FloatyControlledState>(() => ({
      isCollapsed: persistedState?.isCollapsed ?? defaultCollapsed,
      isMinimized: persistedState?.isMinimized ?? defaultMinimized,
      isPinned: persistedState?.isPinned ?? defaultPinned,
      isMaximized: persistedState?.isMaximized ?? defaultMaximized,
      snapZone: persistedState?.snapZone ?? null,
      position: clampPosition(
        persistedState?.position ?? initialPosition,
        persistedState?.size ?? initialSize,
      ),
      size: persistedState?.size ?? initialSize ?? {},
    }));
    const currentState = value ?? internalState;
    const { isCollapsed, isMinimized, isPinned, isMaximized, snapZone, position, size } =
      currentState;
    const stateRef = useRef(currentState);
    const valueRef = useRef(value);
    const onValueChangeRef = useRef(onValueChange);
    stateRef.current = currentState;
    valueRef.current = value;
    onValueChangeRef.current = onValueChange;

    const applyState = useCallback((patch: Partial<FloatyControlledState>) => {
      const next = { ...stateRef.current, ...patch };
      stateRef.current = next;
      if (valueRef.current !== undefined) {
        onValueChangeRef.current?.(next);
      } else {
        setInternalState(next);
      }
    }, []);
    const setIsCollapsed = useCallback(
      (action: SetStateAction<boolean>) =>
        applyState({ isCollapsed: resolveStateAction(action, stateRef.current.isCollapsed) }),
      [applyState],
    );
    const setIsMinimized = useCallback(
      (action: SetStateAction<boolean>) =>
        applyState({ isMinimized: resolveStateAction(action, stateRef.current.isMinimized) }),
      [applyState],
    );
    const setIsPinned = useCallback(
      (action: SetStateAction<boolean>) =>
        applyState({ isPinned: resolveStateAction(action, stateRef.current.isPinned) }),
      [applyState],
    );
    const setIsMaximized = useCallback(
      (action: SetStateAction<boolean>) =>
        applyState({ isMaximized: resolveStateAction(action, stateRef.current.isMaximized) }),
      [applyState],
    );
    const setSnapZone = useCallback(
      (action: SetStateAction<FloatySnapZone | null>) =>
        applyState({ snapZone: resolveStateAction(action, stateRef.current.snapZone) }),
      [applyState],
    );
    const setPosition = useCallback(
      (action: SetStateAction<FloatyPosition>) =>
        applyState({ position: resolveStateAction(action, stateRef.current.position) }),
      [applyState],
    );
    const setSize = useCallback(
      (action: SetStateAction<FloatySize>) =>
        applyState({ size: resolveStateAction(action, stateRef.current.size) }),
      [applyState],
    );
    const [snapPreview, setSnapPreview] = useState<FloatySnapZone | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isResizeEnabled, setIsResizeEnabled] = useState(false);
    const floatyRef = useRef<HTMLElement>(null);
    const dragStateRef = useRef({
      isDragging: false,
      pointerId: 0,
      startPointerX: 0,
      startPointerY: 0,
      startX: 0,
      startY: 0,
      baseLeft: 0,
      baseTop: 0,
      width: 0,
      height: 0,
    });
    const resizeStateRef = useRef({
      isResizing: false,
      pointerId: 0,
      startPointerX: 0,
      startPointerY: 0,
      startWidth: 0,
      startHeight: 0,
      baseLeft: 0,
      baseTop: 0,
      direction: 'se' as FloatyResizeDirection,
      startX: 0,
      startY: 0,
    });
    const pinchStateRef = useRef({
      isPinching: false,
      pointers: new Map<number, { x: number; y: number }>(),
      startDistance: 0,
      startWidth: 0,
      startHeight: 0,
    });
    const positionRef = useRef(position);
    const sizeRef = useRef(size);
    const frameRef = useRef<number | null>(null);
    const pendingPositionRef = useRef<FloatyPosition | null>(null);
    const pendingSizeRef = useRef<FloatySize | null>(null);
    const internalHandleRef = useRef<FloatyHandle | null>(null);
    const restoreGeometryRef = useRef({
      position: persistedState?.restoreGeometry?.position ?? initialPosition,
      size: persistedState?.restoreGeometry?.size ?? initialSize ?? {},
    });
    const isMaximizedRef = useRef(isMaximized);
    const snapZoneRef = useRef(snapZone);
    const snapPreviewRef = useRef<FloatySnapZone | null>(null);
    const sizeConstraintsRef = useRef(sizeConstraints);
    const Pin = mergedIcons.pin;
    const Unpin = mergedIcons.unpin;
    const Collapse = mergedIcons.collapse;
    const Expand = mergedIcons.expand;
    const Minimize = mergedIcons.minimize;
    const Close = mergedIcons.close;
    const Resize = mergedIcons.resize;
    const Maximize = mergedIcons.maximize;
    const Unmaximize = mergedIcons.unmaximize;

    sizeConstraintsRef.current = sizeConstraints;

    const commitGeometry = useCallback(
      (geometry: { position: FloatyPosition; size: FloatySize }) => {
        positionRef.current = geometry.position;
        sizeRef.current = geometry.size;
        setPosition(geometry.position);
        setSize(geometry.size);
      },
      [setPosition, setSize],
    );

    const captureRestoreGeometry = useCallback(() => {
      if (isMaximizedRef.current || snapZoneRef.current) {
        return;
      }

      const rect = floatyRef.current?.getBoundingClientRect();
      restoreGeometryRef.current = {
        position: positionRef.current,
        size: {
          width: numericSize(sizeRef.current.width, rect?.width ?? 320),
          height: numericSize(sizeRef.current.height, rect?.height ?? DEFAULT_MIN_HEIGHT),
        },
      };
    }, []);

    const maximizeWindow = useCallback(() => {
      captureRestoreGeometry();
      commitGeometry(getSnapGeometry('top'));
      snapZoneRef.current = null;
      isMaximizedRef.current = true;
      setSnapZone(null);
      setIsMaximized(true);
      setIsCollapsed(false);
    }, [captureRestoreGeometry, commitGeometry, setIsCollapsed, setIsMaximized, setSnapZone]);

    const unmaximizeWindow = useCallback(() => {
      commitGeometry(restoreGeometryRef.current);
      snapZoneRef.current = null;
      isMaximizedRef.current = false;
      setSnapZone(null);
      setIsMaximized(false);
    }, [commitGeometry, setIsMaximized, setSnapZone]);

    const snapWindow = useCallback(
      (zone: FloatySnapZone) => {
        captureRestoreGeometry();
        commitGeometry(getSnapGeometry(zone));
        const maximized = zone === 'top';
        snapZoneRef.current = maximized ? null : zone;
        isMaximizedRef.current = maximized;
        setSnapZone(maximized ? null : zone);
        setIsMaximized(maximized);
        setIsCollapsed(false);
      },
      [captureRestoreGeometry, commitGeometry, setIsCollapsed, setIsMaximized, setSnapZone],
    );

    const handleMethods = useMemo<FloatyHandle>(
      () => ({
        expand: () => setIsCollapsed(false),
        collapse: () => setIsCollapsed(true),
        minimize: () => setIsMinimized(true),
        restore: () => setIsMinimized(false),
        pin: () => setIsPinned(true),
        unpin: () => setIsPinned(false),
        toggle: () => setIsCollapsed((prev) => !prev),
        toggleMinimized: () => setIsMinimized((prev) => !prev),
        moveTo: (nextPosition) => {
          const clampedPosition = clampPosition(nextPosition, sizeRef.current);

          positionRef.current = clampedPosition;
          setPosition(clampedPosition);
          snapZoneRef.current = null;
          isMaximizedRef.current = false;
          setSnapZone(null);
          setIsMaximized(false);
        },
        resizeTo: (nextSize) => {
          const constrained = constrainSize(
            {
              width: nextSize.width ?? sizeRef.current.width ?? 320,
              height: nextSize.height ?? sizeRef.current.height ?? DEFAULT_MIN_HEIGHT,
            },
            sizeConstraintsRef.current,
            {
              width: window.innerWidth - positionRef.current.x,
              height: window.innerHeight - positionRef.current.y,
            },
          );

          sizeRef.current = constrained;
          setSize(constrained);
          setPosition((current) => {
            const clampedPosition = clampPosition(current, constrained);

            positionRef.current = clampedPosition;

            return clampedPosition;
          });
        },
        setGeometry: (geometry) => {
          positionRef.current = geometry.position;
          sizeRef.current = geometry.size;
          restoreGeometryRef.current = geometry;
          snapZoneRef.current = null;
          isMaximizedRef.current = false;
          setPosition(geometry.position);
          setSize(geometry.size);
          setIsCollapsed(false);
          setSnapZone(null);
          setIsMaximized(false);
        },
        maximize: maximizeWindow,
        unmaximize: unmaximizeWindow,
        toggleMaximized: () => {
          if (isMaximizedRef.current || snapZoneRef.current) {
            unmaximizeWindow();
          } else {
            maximizeWindow();
          }
        },
        snapTo: snapWindow,
      }),
      [
        maximizeWindow,
        setIsCollapsed,
        setIsMaximized,
        setIsMinimized,
        setIsPinned,
        setPosition,
        setSize,
        setSnapZone,
        snapWindow,
        unmaximizeWindow,
      ],
    );

    // Keep internal ref always updated
    internalHandleRef.current = handleMethods;
    positionRef.current = position;
    sizeRef.current = size;
    isMaximizedRef.current = isMaximized;
    snapZoneRef.current = snapZone;

    // Expose imperative methods via forward ref
    useImperativeHandle(ref, () => handleMethods, [handleMethods]);

    // Register with manager using internal ref that always has methods.
    // Initial state values are only used for setup — internalHandleRef always reflects latest state.
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — re-registering on every state change would break the widget lifecycle
    useEffect(() => {
      if (id && registerFloaty) {
        return registerFloaty(id, internalHandleRef, {
          isCollapsed,
          isMinimized,
          isPinned,
          isMaximized,
          snapZone,
          position,
          size,
          mode,
          windowStyle,
          windowIcon,
          zIndex,
          persistenceKey,
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, registerFloaty]);

    useEffect(() => {
      if (id) {
        updateWidgetState?.(id, {
          isCollapsed,
          isMinimized,
          isPinned,
          isMaximized,
          snapZone,
          position,
          size,
          mode,
          windowStyle,
          windowIcon,
          zIndex,
          persistenceKey,
        });
      }
    }, [
      id,
      isCollapsed,
      isMaximized,
      isMinimized,
      isPinned,
      mode,
      windowStyle,
      windowIcon,
      persistenceKey,
      position,
      size,
      snapZone,
      updateWidgetState,
      zIndex,
    ]);

    useEffect(() => {
      onFocusChange?.(isActive);
    }, [isActive, onFocusChange]);

    useEffect(() => {
      onPositionChange?.(position);
    }, [onPositionChange, position]);

    useEffect(() => {
      onResize?.(size);
    }, [onResize, size]);

    useEffect(() => {
      onMaximizeChange?.(isMaximized);
    }, [isMaximized, onMaximizeChange]);

    useEffect(() => {
      if (!persistenceKey) {
        return;
      }

      writePersistedState(persistenceKey, {
        version: 1,
        position,
        size,
        isCollapsed,
        isMinimized,
        isPinned,
        isMaximized,
        snapZone,
        restoreGeometry: restoreGeometryRef.current,
      });
    }, [isCollapsed, isMaximized, isMinimized, isPinned, persistenceKey, position, size, snapZone]);

    const flushPendingFrame = useCallback(() => {
      frameRef.current = null;

      const element = floatyRef.current;

      if (!element) {
        return;
      }

      const nextPosition = pendingPositionRef.current;

      if (nextPosition) {
        element.style.transform = `translate(${nextPosition.x}px, ${nextPosition.y}px)`;
      }

      const nextSize = pendingSizeRef.current;

      if (nextSize) {
        if (nextSize.width !== undefined) {
          element.style.width =
            typeof nextSize.width === 'number' ? `${nextSize.width}px` : nextSize.width;
        }

        if (nextSize.height !== undefined) {
          element.style.height =
            typeof nextSize.height === 'number' ? `${nextSize.height}px` : nextSize.height;
        }
      }
    }, []);

    const scheduleVisualUpdate = useCallback(() => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = requestAnimationFrame(flushPendingFrame);
    }, [flushPendingFrame]);

    const handlePointerMove = useCallback(
      (e: PointerEvent) => {
        if (dragStateRef.current.isDragging && e.pointerId === dragStateRef.current.pointerId) {
          const dragState = dragStateRef.current;

          let newX = dragState.startX + e.clientX - dragState.startPointerX;
          let newY = dragState.startY + e.clientY - dragState.startPointerY;

          const minX = -dragState.baseLeft;
          const minY = -dragState.baseTop;
          const maxX = window.innerWidth - dragState.width - dragState.baseLeft;
          const maxY = window.innerHeight - dragState.height - dragState.baseTop;

          newX = Math.max(minX, Math.min(newX, maxX));
          newY = Math.max(minY, Math.min(newY, maxY));

          pendingPositionRef.current = { x: newX, y: newY };
          scheduleVisualUpdate();

          if (mode === 'window' && snap) {
            const nextSnapZone = getSnapZone(
              { x: e.clientX, y: e.clientY },
              window.innerWidth,
              window.innerHeight,
              snapThreshold,
            );

            if (nextSnapZone !== snapPreviewRef.current) {
              snapPreviewRef.current = nextSnapZone;
              setSnapPreview(nextSnapZone);
            }
          }
        }

        if (resizeStateRef.current.isResizing && e.pointerId === resizeStateRef.current.pointerId) {
          const resizeState = resizeStateRef.current;
          const dx = e.clientX - resizeState.startPointerX;
          const dy = e.clientY - resizeState.startPointerY;
          const fromWest = resizeState.direction.includes('w');
          const fromNorth = resizeState.direction.includes('n');
          const changesWidth = fromWest || resizeState.direction.includes('e');
          const changesHeight = fromNorth || resizeState.direction.includes('s');
          const requestedWidth = changesWidth
            ? resizeState.startWidth + (fromWest ? -dx : dx)
            : resizeState.startWidth;
          const requestedHeight = changesHeight
            ? resizeState.startHeight + (fromNorth ? -dy : dy)
            : resizeState.startHeight;
          const constrained = constrainSize(
            { width: requestedWidth, height: requestedHeight },
            sizeConstraintsRef.current,
            {
              width: fromWest
                ? resizeState.startX + resizeState.startWidth
                : window.innerWidth - resizeState.startX,
              height: fromNorth
                ? resizeState.startY + resizeState.startHeight
                : window.innerHeight - resizeState.startY,
            },
          );

          pendingSizeRef.current = {
            width: constrained.width,
            height: constrained.height,
          };

          if (fromWest || fromNorth) {
            pendingPositionRef.current = {
              x: fromWest
                ? resizeState.startX + resizeState.startWidth - constrained.width
                : resizeState.startX,
              y: fromNorth
                ? resizeState.startY + resizeState.startHeight - constrained.height
                : resizeState.startY,
            };
          }

          scheduleVisualUpdate();
        }

        if (pinchStateRef.current.isPinching && !resizeStateRef.current.isResizing) {
          const pinchState = pinchStateRef.current;
          const pointer = pinchState.pointers.get(e.pointerId);
          if (pointer) {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
          }

          const [first, second] = Array.from(pinchState.pointers.values());
          if (first && second && pinchState.startDistance > 0) {
            const distance = Math.hypot(first.x - second.x, first.y - second.y);
            const scale = distance / pinchState.startDistance;

            const constrained = constrainSize(
              {
                width: pinchState.startWidth * scale,
                height: pinchState.startHeight * scale,
              },
              sizeConstraintsRef.current,
              {
                width: window.innerWidth - positionRef.current.x,
                height: window.innerHeight - positionRef.current.y,
              },
            );

            pendingSizeRef.current = constrained;
            scheduleVisualUpdate();
          }
        }
      },
      [mode, scheduleVisualUpdate, snap, snapThreshold],
    );

    const handlePointerUp = useCallback(
      (e: PointerEvent) => {
        pinchStateRef.current.pointers.delete(e.pointerId);

        const endedPinch = pinchStateRef.current.isPinching;
        if (endedPinch) {
          pinchStateRef.current.isPinching = false;
          pinchStateRef.current.pointers.clear();
        }

        const nextPosition = pendingPositionRef.current;
        const nextSize = pendingSizeRef.current;
        const nextSnapZone = snapPreviewRef.current;
        const endedDrag = dragStateRef.current.isDragging;
        const endedResize = resizeStateRef.current.isResizing || endedPinch;

        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          flushPendingFrame();
        }

        dragStateRef.current.isDragging = false;
        resizeStateRef.current.isResizing = false;
        pendingPositionRef.current = null;
        pendingSizeRef.current = null;
        snapPreviewRef.current = null;
        setSnapPreview(null);

        if (nextSnapZone && endedDrag) {
          snapWindow(nextSnapZone);
        } else if (nextPosition) {
          positionRef.current = nextPosition;
          setPosition(nextPosition);
          snapZoneRef.current = null;
          setSnapZone(null);
        }

        if (nextSize) {
          sizeRef.current = nextSize;
          setSize(nextSize);
          if (endedResize) {
            onResizeEnd?.(nextSize);
          }
        }

        setIsDragging(false);
        setIsResizing(false);

        if (pinchStateRef.current.pointers.size === 0) {
          globalThis.removeEventListener('pointermove', handlePointerMove);
          globalThis.removeEventListener('pointerup', handlePointerUp);
          globalThis.removeEventListener('pointercancel', handlePointerUp);
        }
      },
      [
        flushPendingFrame,
        handlePointerMove,
        onResizeEnd,
        setPosition,
        setSize,
        setSnapZone,
        snapWindow,
      ],
    );

    const startGlobalPointerListeners = useCallback(() => {
      globalThis.addEventListener('pointermove', handlePointerMove);
      globalThis.addEventListener('pointerup', handlePointerUp);
      globalThis.addEventListener('pointercancel', handlePointerUp);
    }, [handlePointerMove, handlePointerUp]);

    const handlePointerDown = (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) {
        return;
      }

      if (isPinned) {
        return;
      }

      if (isMaximized || snapZone) {
        return;
      }

      if ((e.target as HTMLElement).closest('button')) {
        return;
      }

      if (e.pointerType === 'touch') {
        e.currentTarget.setPointerCapture(e.pointerId);
        pinchStateRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pinchStateRef.current.pointers.size >= 2) {
          const resizeEnabled = mode === 'window' || isResizeEnabled;

          if (!pinchStateRef.current.isPinching && resizeEnabled && !isCollapsed) {
            dragStateRef.current.isDragging = false;
            setIsDragging(false);

            const [first, second] = Array.from(pinchStateRef.current.pointers.values());
            pinchStateRef.current.isPinching = true;
            pinchStateRef.current.startDistance = Math.hypot(
              first.x - second.x,
              first.y - second.y,
            );
            pinchStateRef.current.startWidth = numericSize(
              sizeRef.current.width,
              DEFAULT_MIN_WIDTH,
            );
            pinchStateRef.current.startHeight = numericSize(
              sizeRef.current.height,
              DEFAULT_MIN_HEIGHT,
            );
            onResizeStart?.({
              width: pinchStateRef.current.startWidth,
              height: pinchStateRef.current.startHeight,
            });
            setIsResizing(true);
            startGlobalPointerListeners();
          }

          return;
        }
      }

      const rect = floatyRef.current?.getBoundingClientRect();

      if (rect) {
        onFocus?.();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragStateRef.current = {
          isDragging: true,
          pointerId: e.pointerId,
          startPointerX: e.clientX,
          startPointerY: e.clientY,
          startX: positionRef.current.x,
          startY: positionRef.current.y,
          baseLeft: rect.left - positionRef.current.x,
          baseTop: rect.top - positionRef.current.y,
          width: rect.width,
          height: rect.height,
        };
        startGlobalPointerListeners();
        setIsDragging(true);
      }
    };

    const handleResizePointerDown = (
      e: ReactPointerEvent<HTMLElement>,
      direction: FloatyResizeDirection,
    ) => {
      const resizeEnabled = mode === 'window' || isResizeEnabled;

      if (isCollapsed || !resizeEnabled || isMaximized) {
        return;
      }

      const rect = floatyRef.current?.getBoundingClientRect();

      if (rect) {
        e.preventDefault();
        e.stopPropagation();
        onFocus?.();
        e.currentTarget.setPointerCapture(e.pointerId);
        resizeStateRef.current = {
          isResizing: true,
          pointerId: e.pointerId,
          startPointerX: e.clientX,
          startPointerY: e.clientY,
          startWidth: rect.width,
          startHeight: rect.height,
          baseLeft: rect.left,
          baseTop: rect.top,
          startX: positionRef.current.x,
          startY: positionRef.current.y,
          direction,
        };
        onResizeStart?.({ width: rect.width, height: rect.height });
        startGlobalPointerListeners();
        setIsResizing(true);
      }
    };

    const handleHeaderDoubleClick = (e: ReactMouseEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).closest('button')) {
        return;
      }

      if (mode === 'window') {
        handleMethods.toggleMaximized();
      } else {
        setIsCollapsed((collapsed) => !collapsed);
      }
    };

    const handleHeaderKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).closest('button')) {
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (mode === 'window') {
          handleMethods.toggleMaximized();
        } else {
          setIsCollapsed((collapsed) => !collapsed);
        }

        return;
      }

      if (
        !isPinned &&
        !isMaximized &&
        !snapZone &&
        ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(e.key)
      ) {
        e.preventDefault();
        onFocus?.();
        const step = getKeyboardStep(e, KEYBOARD_MOVE_STEP, KEYBOARD_MOVE_LARGE_STEP);
        const delta = (
          {
            ArrowUp: { x: 0, y: -step },
            ArrowRight: { x: step, y: 0 },
            ArrowDown: { x: 0, y: step },
            ArrowLeft: { x: -step, y: 0 },
          } as Record<string, { x: number; y: number }>
        )[e.key] ?? { x: 0, y: 0 };

        setPosition((current) =>
          clampPosition({ x: current.x + delta.x, y: current.y + delta.y }, sizeRef.current),
        );
      }
    };

    const handleResizeKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      if ((mode !== 'window' && !isResizeEnabled) || isMaximized) {
        return;
      }

      if (!['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(e.key)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      onFocus?.();

      const rect = floatyRef.current?.getBoundingClientRect();
      const currentWidth = numericSize(sizeRef.current.width, rect?.width ?? 320);
      const currentHeight = numericSize(sizeRef.current.height, rect?.height ?? DEFAULT_MIN_HEIGHT);
      const step = getKeyboardStep(e, KEYBOARD_RESIZE_STEP, KEYBOARD_RESIZE_LARGE_STEP);
      const delta = (
        {
          ArrowUp: { width: 0, height: -step },
          ArrowRight: { width: step, height: 0 },
          ArrowDown: { width: 0, height: step },
          ArrowLeft: { width: -step, height: 0 },
        } as Record<string, { width: number; height: number }>
      )[e.key] ?? { width: 0, height: 0 };
      const baseLeft = rect?.left ?? positionRef.current.x;
      const baseTop = rect?.top ?? positionRef.current.y;
      const nextSize = constrainSize(
        { width: currentWidth + delta.width, height: currentHeight + delta.height },
        sizeConstraintsRef.current,
        { width: window.innerWidth - baseLeft, height: window.innerHeight - baseTop },
      );

      // Each key press is a complete resize, so it reports the same lifecycle as a pointer gesture.
      onResizeStart?.({ width: currentWidth, height: currentHeight });
      sizeRef.current = nextSize;
      setSize(nextSize);
      onResizeEnd?.(nextSize);
    };

    const toggleResizeEnabled = () => {
      if (isCollapsed) {
        return;
      }

      onFocus?.();
      setIsResizeEnabled((enabled) => !enabled);
    };

    const titleText = typeof title === 'string' ? title : undefined;

    useEffect(() => {
      return () => {
        globalThis.removeEventListener('pointermove', handlePointerMove);
        globalThis.removeEventListener('pointerup', handlePointerUp);
        globalThis.removeEventListener('pointercancel', handlePointerUp);
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }, [handlePointerMove, handlePointerUp]);

    useEffect(() => {
      const handleViewportResize = () => {
        if (isMaximizedRef.current) {
          commitGeometry(getSnapGeometry('top'));
          return;
        }

        if (snapZoneRef.current) {
          commitGeometry(getSnapGeometry(snapZoneRef.current));
          return;
        }

        const rect = floatyRef.current?.getBoundingClientRect();
        const measuredSize = {
          width: numericSize(sizeRef.current.width, rect?.width ?? 320),
          height: numericSize(sizeRef.current.height, rect?.height ?? DEFAULT_MIN_HEIGHT),
        };

        setPosition((current) => {
          const clamped = clampPosition(current, measuredSize);
          return clamped.x === current.x && clamped.y === current.y ? current : clamped;
        });
      };

      handleViewportResize();

      globalThis.addEventListener('resize', handleViewportResize);

      return () => {
        globalThis.removeEventListener('resize', handleViewportResize);
      };
    }, [commitGeometry, setPosition]);

    useEffect(() => {
      if (isCollapsed || isMinimized) {
        setIsResizeEnabled(false);
      }
    }, [isCollapsed, isMinimized]);

    if (isMinimized) {
      return null;
    }

    const resizeEnabled = mode === 'window' || isResizeEnabled;
    const previewGeometry = snapPreview ? getSnapGeometry(snapPreview) : null;
    const isDocked = isMaximized || Boolean(snapZone);

    return (
      <>
        <section
          ref={floatyRef}
          aria-label={titleText ?? 'Floaty widget'}
          data-active={isActive || undefined}
          data-maximized={isMaximized || undefined}
          data-snap-zone={snapZone ?? undefined}
          className={`floaty floaty--${mode} ${mode === 'window' ? `floaty--window-${windowStyle}` : ''} ${isActive ? 'active' : ''} ${isPinned ? 'pinned' : ''} ${isCollapsed ? 'collapsed' : ''} ${isMaximized ? 'maximized' : ''} ${snapZone ? 'snapped' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${resizeEnabled ? 'resize-enabled' : ''} ${className ?? ''}`}
          onPointerDown={onFocus}
          style={{
            ...style,
            left: 0,
            top: 0,
            width: size.width ?? style.width,
            height: mode === 'window' && isCollapsed ? undefined : (size.height ?? style.height),
            minWidth: isDocked ? 0 : (sizeConstraints.minWidth ?? style.minWidth),
            minHeight: isDocked ? 0 : (sizeConstraints.minHeight ?? style.minHeight),
            maxWidth: isDocked ? 'none' : (sizeConstraints.maxWidth ?? style.maxWidth),
            maxHeight: isDocked ? 'none' : (sizeConstraints.maxHeight ?? style.maxHeight),
            transform: `translate(${position.x}px, ${position.y}px)`,
            zIndex,
          }}
        >
          <div
            role="toolbar"
            className={`floaty-header ${isPinned ? 'pinned' : ''}`}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleHeaderDoubleClick}
            onKeyDown={handleHeaderKeyDown}
            aria-label={`${titleText ?? 'Floaty widget'} controls`}
            aria-keyshortcuts="Enter Space ArrowUp ArrowRight ArrowDown ArrowLeft"
            tabIndex={0}
          >
            {mode === 'floating' && (
              <span className="floaty-header-grip" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
            )}

            {mode === 'floating' && (
              <button
                type="button"
                className="floaty-button floaty-button--pin"
                onClick={() => setIsPinned((pinned) => !pinned)}
                title={isPinned ? labels.unpin : labels.pin}
                aria-label={isPinned ? labels.unpin : labels.pin}
              >
                {isPinned && Unpin ? (
                  <Unpin active />
                ) : !isPinned && Pin ? (
                  <Pin />
                ) : (
                  <PinIcon pinned={isPinned} />
                )}
              </button>
            )}

            {mode === 'window' && (
              <span className="floaty-window-icon" aria-hidden="true">
                {windowIcon ?? <span className="floaty-window-icon-default" />}
              </span>
            )}

            {mode === 'window' && (
              <button
                type="button"
                className="floaty-button floaty-button--maximize"
                onClick={handleMethods.toggleMaximized}
                title={isMaximized || snapZone ? labels.unmaximize : labels.maximize}
                aria-label={isMaximized || snapZone ? labels.unmaximize : labels.maximize}
                aria-pressed={isMaximized}
              >
                {isMaximized && Unmaximize ? (
                  <Unmaximize active />
                ) : !isMaximized && Maximize ? (
                  <Maximize />
                ) : (
                  <MaximizeIcon maximized={isMaximized || Boolean(snapZone)} />
                )}
              </button>
            )}

            <span className="floaty-title" title={titleText}>
              {title}
            </span>

            {mode === 'floating' && (
              <button
                type="button"
                className="floaty-button floaty-button--expand"
                onClick={() => setIsCollapsed((collapsed) => !collapsed)}
                title={isCollapsed ? labels.expand : labels.collapse}
                aria-label={isCollapsed ? labels.expand : labels.collapse}
              >
                {isCollapsed && Expand ? (
                  <Expand active />
                ) : !isCollapsed && Collapse ? (
                  <Collapse />
                ) : (
                  <ChevronIcon collapsed={isCollapsed} />
                )}
              </button>
            )}

            {mode === 'floating' && (
              <button
                type="button"
                className="floaty-button floaty-button--resize"
                onClick={toggleResizeEnabled}
                title={labels.resize}
                aria-label={labels.resize}
                aria-pressed={isResizeEnabled}
                disabled={isCollapsed}
              >
                {Resize ? (
                  <Resize active={isResizeEnabled} />
                ) : (
                  <ResizeIcon active={isResizeEnabled} />
                )}
              </button>
            )}

            <button
              type="button"
              className="floaty-button floaty-button--minimize"
              onClick={() => {
                setIsResizeEnabled(false);
                setIsMinimized(true);
              }}
              title={labels.minimize}
              aria-label={labels.minimize}
            >
              {Minimize ? <Minimize /> : <MinusIcon />}
            </button>

            {onClose && (
              <button
                type="button"
                className="floaty-button floaty-button--close"
                onClick={onClose}
                title={labels.close}
                aria-label={labels.close}
              >
                {Close ? <Close /> : <CloseIcon />}
              </button>
            )}
          </div>

          {!isCollapsed && <div className="floaty-body">{children}</div>}

          {!isCollapsed &&
            resizeEnabled &&
            !isMaximized &&
            RESIZE_DIRECTIONS.map((direction) =>
              direction === 'se' ? (
                <button
                  key={direction}
                  type="button"
                  className={`floaty-resize-handle floaty-resize-handle--${direction}`}
                  onPointerDown={(event) => handleResizePointerDown(event, direction)}
                  onKeyDown={handleResizeKeyDown}
                  title={labels.resize}
                  aria-label={`${labels.resize} handle`}
                  aria-keyshortcuts="ArrowUp ArrowRight ArrowDown ArrowLeft"
                />
              ) : (
                <span
                  key={direction}
                  aria-hidden="true"
                  className={`floaty-resize-handle floaty-resize-handle--${direction}`}
                  onPointerDown={(event) => handleResizePointerDown(event, direction)}
                />
              ),
            )}
        </section>

        {previewGeometry &&
          createPortal(
            <div
              className="floaty-snap-preview"
              data-snap-zone={snapPreview ?? undefined}
              style={{
                left: previewGeometry.position.x,
                top: previewGeometry.position.y,
                width: previewGeometry.size.width,
                height: previewGeometry.size.height,
                zIndex: (zIndex ?? 1000) + 1,
              }}
            />,
            document.body,
          )}
      </>
    );
  },
);

export default Floaty;
