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
  useLayoutEffect,
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
  FloatyWindowTab,
} from '../../types';
import {
  type ChromeInsets,
  clampPosition,
  constrainSize,
  DEFAULT_MIN_HEIGHT,
  DEFAULT_MIN_WIDTH,
  DEFAULT_SNAP_THRESHOLD,
  getSnapGeometry,
  getSnapZone,
  NO_CHROME_INSETS,
  numericSize,
  readPersistedState,
  writePersistedState,
} from '../../utils/windowGeometry';
import { ChevronIcon, CloseIcon, MaximizeIcon, MinusIcon, PinIcon } from './FloatyDefaultIcons';
import { FloatyTabs } from './FloatyTabs';
import { findMergeTarget, getKeyboardStep, resolveStateAction } from './floatyHelpers';
import { readFloatingChromeInsets, useFloatingChrome } from './useFloatingChrome';

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
  /** Moves keyboard focus to the header when the widget appears (mount or restore). @default false */
  autoFocus?: boolean;
  /**
   * Returns focus to the element focused before the widget appeared when it closes or minimizes
   * while focus is inside it. Never moves focus that is elsewhere. @default true
   */
  restoreFocus?: boolean;
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
  /**
   * Keeps the widget mounted, with its content state, but not displayed. Used by
   * `FloatyViewport` for the inactive tabs of a tabbed window group. @default false
   */
  hidden?: boolean;
  /** Tabs shown in the title bar instead of `title` when there are two or more (window mode). */
  tabs?: FloatyWindowTab[];
  /** Id of the selected tab in `tabs`. */
  activeTabId?: string;
  /** Called when a tab is selected. */
  onTabSelect?: (id: string) => void;
  /** Called when a tab's close button is pressed. If omitted, tabs have no close button. */
  onTabClose?: (id: string) => void;
  /** Called when a tab is dragged out of the strip (with the drop point) or detached by keyboard. */
  onTabDetach?: (id: string, position?: FloatyPosition) => void;
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
  move: 'Move',
  maximize: 'Maximize',
  unmaximize: 'Restore window',
  loading: 'Loading widget...',
  loadError: 'Could not load widget',
  retry: 'Retry',
  tabs: 'Tabs',
  layoutDivider: 'Resize windows',
};

const MOVE_KEY_SHORTCUTS = 'ArrowUp ArrowRight ArrowDown ArrowLeft';
const KEYBOARD_MOVE_STEP = 10;
const KEYBOARD_MOVE_LARGE_STEP = 50;
const KEYBOARD_RESIZE_STEP = 16;
const KEYBOARD_RESIZE_LARGE_STEP = 64;
const RESIZE_DIRECTIONS: FloatyResizeDirection[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const ARRANGE_FALLBACK_MS = 1000;
const ARRANGE_PROPERTIES = new Set(['transform', 'width', 'height']);

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
      autoFocus = false,
      restoreFocus = true,
      onClose,
      onFocus,
      onFocusChange,
      onResizeStart,
      onResize,
      onResizeEnd,
      onPositionChange,
      onMaximizeChange,
      hidden = false,
      tabs,
      activeTabId,
      onTabSelect,
      onTabClose,
      onTabDetach,
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
        undefined,
        undefined,
        mode === 'floating' && !(persistedState?.isCollapsed ?? defaultCollapsed)
          ? readFloatingChromeInsets(null)
          : NO_CHROME_INSETS,
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
    const [isArranging, setIsArranging] = useState(false);
    const arrangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { isChromeRevealed, chromeHandlers } = useFloatingChrome(mode);
    const floatyRef = useRef<HTMLElement>(null);
    const openerRef = useRef<HTMLElement | null>(null);
    const hasFocusRef = useRef(false);
    const autoFocusRef = useRef(autoFocus);
    const restoreFocusRef = useRef(restoreFocus);
    autoFocusRef.current = autoFocus;
    restoreFocusRef.current = restoreFocus;
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
      insets: NO_CHROME_INSETS,
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
      insets: NO_CHROME_INSETS,
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
    const mergeTargetRef = useRef<HTMLElement | null>(null);
    // Read through refs so pointer handlers stay stable while a drag is in progress.
    const groupWindowsRef = useRef(manager?.groupWindows);
    const idRef = useRef(id);
    groupWindowsRef.current = manager?.groupWindows;
    idRef.current = id;
    const canMerge = mode === 'window' && Boolean(id) && Boolean(manager?.windowGrouping);
    const Pin = mergedIcons.pin;
    const Unpin = mergedIcons.unpin;
    const Collapse = mergedIcons.collapse;
    const Expand = mergedIcons.expand;
    const Minimize = mergedIcons.minimize;
    const Close = mergedIcons.close;
    const Maximize = mergedIcons.maximize;
    const Unmaximize = mergedIcons.unmaximize;

    sizeConstraintsRef.current = sizeConstraints;
    const modeRef = useRef(mode);
    modeRef.current = mode;

    /**
     * Space the floating frame takes outside the widget box. It is reserved even while the frame
     * is closed, so opening it never pushes the controls off screen.
     */
    const getChromeInsets = useCallback((): ChromeInsets => {
      // stateRef, not a render value: an imperative collapse() right before moveTo() must count.
      if (modeRef.current !== 'floating' || stateRef.current.isCollapsed) {
        return NO_CHROME_INSETS;
      }

      return readFloatingChromeInsets(floatyRef.current);
    }, []);

    const clampToViewport = useCallback(
      (nextPosition: FloatyPosition, nextSize: FloatySize | undefined) =>
        clampPosition(nextPosition, nextSize, undefined, undefined, getChromeInsets()),
      [getChromeInsets],
    );

    /** Largest size that fits between `origin` and the viewport's far edges. */
    const getAvailableSize = useCallback(
      (origin: FloatyPosition) => {
        const insets = getChromeInsets();

        return {
          width: window.innerWidth - origin.x - insets.right,
          height: window.innerHeight - origin.y - insets.bottom,
        };
      },
      [getChromeInsets],
    );

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
          const clampedPosition = clampToViewport(nextPosition, sizeRef.current);

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
            getAvailableSize(positionRef.current),
          );

          sizeRef.current = constrained;
          setSize(constrained);
          setPosition((current) => {
            const clampedPosition = clampToViewport(current, constrained);

            positionRef.current = clampedPosition;

            return clampedPosition;
          });
        },
        setGeometry: (geometry, options) => {
          if (arrangeTimeoutRef.current) {
            clearTimeout(arrangeTimeoutRef.current);
            arrangeTimeoutRef.current = null;
          }
          if (options?.animate) {
            setIsArranging(true);
            // Fallback for when no transition fires (unchanged geometry or reduced motion).
            arrangeTimeoutRef.current = setTimeout(() => {
              arrangeTimeoutRef.current = null;
              setIsArranging(false);
            }, ARRANGE_FALLBACK_MS);
          } else {
            setIsArranging(false);
          }
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
        clampToViewport,
        getAvailableSize,
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

    useEffect(
      () => () => {
        if (arrangeTimeoutRef.current) {
          clearTimeout(arrangeTimeoutRef.current);
        }
      },
      [],
    );

    // Expose imperative methods via forward ref
    useImperativeHandle(ref, () => handleMethods, [handleMethods]);

    const widgetState = useMemo(
      () => ({
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
      }),
      [
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
      ],
    );
    // Registration reads the state at mount time; later changes go through updateWidgetState.
    const widgetStateRef = useRef(widgetState);
    widgetStateRef.current = widgetState;

    // Register with manager using internal ref that always has methods.
    useEffect(() => {
      if (id && registerFloaty) {
        return registerFloaty(id, internalHandleRef, widgetStateRef.current);
      }
    }, [id, registerFloaty]);

    useEffect(() => {
      if (id) {
        updateWidgetState?.(id, widgetState);
      }
    }, [id, updateWidgetState, widgetState]);

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

    const setMergeTarget = useCallback((element: HTMLElement | null) => {
      if (mergeTargetRef.current === element) {
        return;
      }

      mergeTargetRef.current?.removeAttribute('data-merge-target');
      element?.setAttribute('data-merge-target', 'true');
      mergeTargetRef.current = element;
    }, []);

    useEffect(() => () => setMergeTarget(null), [setMergeTarget]);

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

          const { insets } = dragState;
          const minX = insets.left - dragState.baseLeft;
          const minY = insets.top - dragState.baseTop;
          const maxX = window.innerWidth - dragState.width - dragState.baseLeft - insets.right;
          const maxY = window.innerHeight - dragState.height - dragState.baseTop - insets.bottom;

          newX = Math.max(minX, Math.min(newX, maxX));
          newY = Math.max(minY, Math.min(newY, maxY));

          pendingPositionRef.current = { x: newX, y: newY };
          scheduleVisualUpdate();

          const mergeTarget = canMerge
            ? findMergeTarget(e.clientX, e.clientY, floatyRef.current)
            : null;

          setMergeTarget(mergeTarget);

          if (mergeTarget) {
            // Dropping on a title bar merges into tabs, so it wins over edge snapping.
            if (snapPreviewRef.current) {
              snapPreviewRef.current = null;
              setSnapPreview(null);
            }
          } else if (mode === 'window' && snap) {
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
                ? resizeState.startX + resizeState.startWidth - resizeState.insets.left
                : window.innerWidth - resizeState.startX - resizeState.insets.right,
              height: fromNorth
                ? resizeState.startY + resizeState.startHeight - resizeState.insets.top
                : window.innerHeight - resizeState.startY - resizeState.insets.bottom,
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
              getAvailableSize(positionRef.current),
            );

            pendingSizeRef.current = constrained;
            scheduleVisualUpdate();
          }
        }
      },
      [canMerge, getAvailableSize, mode, scheduleVisualUpdate, setMergeTarget, snap, snapThreshold],
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
        const mergeTargetId = endedDrag ? mergeTargetRef.current?.dataset.floatyId : undefined;

        setMergeTarget(null);

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

        if (mergeTargetId && idRef.current && groupWindowsRef.current) {
          // Undo the live drag transform; the group gives this window the target's geometry.
          if (floatyRef.current) {
            floatyRef.current.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;
          }
          groupWindowsRef.current([mergeTargetId, idRef.current]);
        } else if (nextSnapZone && endedDrag) {
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
        setMergeTarget,
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

      // Other buttons act on click; the move handle is also a drag handle.
      const button = (e.target as HTMLElement).closest('button');

      if (button && !button.classList.contains('floaty-move-handle')) {
        return;
      }

      if (e.pointerType === 'touch') {
        e.currentTarget.setPointerCapture(e.pointerId);
        pinchStateRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pinchStateRef.current.pointers.size >= 2) {
          if (!pinchStateRef.current.isPinching && !isCollapsed) {
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
          insets: getChromeInsets(),
        };
        startGlobalPointerListeners();
        setIsDragging(true);
      }
    };

    const handleResizePointerDown = (
      e: ReactPointerEvent<HTMLElement>,
      direction: FloatyResizeDirection,
    ) => {
      if (isCollapsed || isMaximized) {
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
          insets: getChromeInsets(),
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

    const handleMoveKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
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
          clampToViewport({ x: current.x + delta.x, y: current.y + delta.y }, sizeRef.current),
        );
      }
    };

    const handleResizeKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (isMaximized) {
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
      const nextSize = constrainSize(
        { width: currentWidth + delta.width, height: currentHeight + delta.height },
        sizeConstraintsRef.current,
        getAvailableSize({
          x: rect?.left ?? positionRef.current.x,
          y: rect?.top ?? positionRef.current.y,
        }),
      );

      // Each key press is a complete resize, so it reports the same lifecycle as a pointer gesture.
      onResizeStart?.({ width: currentWidth, height: currentHeight });
      sizeRef.current = nextSize;
      setSize(nextSize);
      onResizeEnd?.(nextSize);
    };

    const titleText = typeof title === 'string' ? title : undefined;
    const moveLabel = titleText ? `${labels.move} ${titleText}` : labels.move;

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

    const reclampToViewport = useCallback(() => {
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
        const clamped = clampToViewport(current, measuredSize);
        return clamped.x === current.x && clamped.y === current.y ? current : clamped;
      });
    }, [clampToViewport, commitGeometry, setPosition]);

    useEffect(() => {
      reclampToViewport();

      globalThis.addEventListener('resize', reclampToViewport);

      return () => {
        globalThis.removeEventListener('resize', reclampToViewport);
      };
    }, [reclampToViewport]);

    // Expanding or switching to floating mode adds the frame, which needs room on screen.
    const hasFloatingChrome = mode === 'floating' && !isCollapsed;

    useEffect(() => {
      if (hasFloatingChrome) {
        reclampToViewport();
      }
    }, [hasFloatingChrome, reclampToViewport]);

    // Focus management runs whenever the section appears (mount or restore from minimized).
    // A layout-effect cleanup covers both ways it disappears: on unmount it runs before the DOM
    // is removed, on minimize it runs after, so "focus inside" is tracked by focus events too.
    useLayoutEffect(() => {
      const node = floatyRef.current;

      if (isMinimized || !node) {
        return;
      }

      const active = document.activeElement;
      openerRef.current =
        active instanceof HTMLElement && active !== document.body && !node.contains(active)
          ? active
          : null;

      if (autoFocusRef.current) {
        node.querySelector<HTMLElement>('.floaty-move-handle')?.focus({ preventScroll: true });
      }

      return () => {
        const current = document.activeElement;
        const focusLost = !current || current === document.body || node.contains(current);
        const opener = openerRef.current;

        if (restoreFocusRef.current && hasFocusRef.current && focusLost && opener?.isConnected) {
          opener.focus({ preventScroll: true });
        }

        hasFocusRef.current = false;
      };
    }, [isMinimized]);

    if (isMinimized) {
      return null;
    }

    const previewGeometry = snapPreview ? getSnapGeometry(snapPreview) : null;
    const isDocked = isMaximized || Boolean(snapZone);

    return (
      <>
        <section
          ref={floatyRef}
          hidden={hidden || undefined}
          data-floaty-id={id}
          aria-label={titleText ?? 'Floaty widget'}
          data-active={isActive || undefined}
          data-maximized={isMaximized || undefined}
          data-snap-zone={snapZone ?? undefined}
          className={`floaty floaty--${mode} ${mode === 'window' ? `floaty--window-${windowStyle}` : ''} ${isActive ? 'active' : ''} ${isPinned ? 'pinned' : ''} ${isCollapsed ? 'collapsed' : ''} ${isMaximized ? 'maximized' : ''} ${snapZone ? 'snapped' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isArranging ? 'arranging' : ''} ${isChromeRevealed ? 'chrome-revealed' : ''} ${className ?? ''}`}
          onPointerDown={onFocus}
          {...chromeHandlers}
          onTransitionEnd={(event) => {
            if (
              isArranging &&
              event.target === event.currentTarget &&
              ARRANGE_PROPERTIES.has(event.propertyName)
            ) {
              if (arrangeTimeoutRef.current) {
                clearTimeout(arrangeTimeoutRef.current);
                arrangeTimeoutRef.current = null;
              }
              setIsArranging(false);
            }
          }}
          onFocus={() => {
            hasFocusRef.current = true;
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              hasFocusRef.current = false;
            }
          }}
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
          {mode === 'floating' && (
            <div
              className="floaty-frame"
              aria-hidden="true"
              onPointerDown={handlePointerDown}
              onDoubleClick={handleHeaderDoubleClick}
            />
          )}

          <div
            role="toolbar"
            className={`floaty-header ${isPinned ? 'pinned' : ''}`}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleHeaderDoubleClick}
            aria-label={`${titleText ?? 'Floaty widget'} controls`}
          >
            {mode === 'floating' && (
              <button
                type="button"
                className="floaty-move-handle floaty-header-grip"
                onKeyDown={handleMoveKeyDown}
                title={moveLabel}
                aria-label={moveLabel}
                aria-keyshortcuts={MOVE_KEY_SHORTCUTS}
              >
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </button>
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
              <button
                type="button"
                className="floaty-move-handle floaty-window-icon"
                onKeyDown={handleMoveKeyDown}
                title={moveLabel}
                aria-label={moveLabel}
                aria-keyshortcuts={MOVE_KEY_SHORTCUTS}
              >
                <span className="floaty-window-icon-graphic" aria-hidden="true">
                  {windowIcon ?? <span className="floaty-window-icon-default" />}
                </span>
              </button>
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

            {mode === 'window' && tabs && tabs.length > 1 ? (
              <FloatyTabs
                tabs={tabs}
                activeId={activeTabId ?? id ?? tabs[0].id}
                hidden={hidden}
                labels={labels}
                onSelect={onTabSelect}
                onClose={onTabClose}
                onDetach={onTabDetach}
              />
            ) : (
              <span className="floaty-title" title={titleText}>
                {title}
              </span>
            )}

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

            <button
              type="button"
              className="floaty-button floaty-button--minimize"
              onClick={() => setIsMinimized(true)}
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
