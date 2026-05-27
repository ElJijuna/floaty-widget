import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  CSSProperties,
  forwardRef,
  useImperativeHandle,
} from 'react';
import './Floaty.css';
import {
  useFloatyManager,
  type FloatyIcons,
  type FloatyHandle,
  type FloatyPosition,
  type FloatySize,
  type FloatyTexts,
} from '../../context/FloatyWidgetManager';

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
  /** Whether the widget body is collapsed on first render. @default false */
  defaultCollapsed?: boolean;
  /** Whether the widget is minimized (hidden) on first render. @default false */
  defaultMinimized?: boolean;
  /** Whether the widget is pinned (non-draggable) on first render. @default false */
  defaultPinned?: boolean;
  /** Initial screen position. @default \{ x: 100, y: 100 \} */
  initialPosition?: FloatyPosition;
  /** Initial dimensions. */
  initialSize?: FloatySize;
  /** CSS `z-index` for this widget. */
  zIndex?: number;
  /** Called when the user clicks the close button. If omitted, the close button is not rendered. */
  onClose?: () => void;
  /** Called when the user clicks or starts dragging the widget (used to bring it to front). */
  onFocus?: () => void;
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
  >
    <path d="M5 12h14" />
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
      defaultCollapsed = false,
      defaultMinimized = false,
      defaultPinned = false,
      initialPosition = { x: 100, y: 100 },
      initialSize,
      zIndex,
      onClose,
      onFocus,
    }: FloatyProps,
    ref
  ) => {
    const manager = useFloatyManager();
    const registerFloaty = manager?.registerFloaty;
    const updateWidgetState = manager?.updateWidgetState;
    const labels = useMemo(
      () => ({ ...defaultLabels, ...manager?.labels, ...labelsProp }),
      [manager?.labels, labelsProp]
    );
    const mergedIcons = useMemo(
      () => ({ ...manager?.icons, ...icons }),
      [manager?.icons, icons]
    );
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [isMinimized, setIsMinimized] = useState(defaultMinimized);
    const [isPinned, setIsPinned] = useState(defaultPinned);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [position, setPosition] = useState<FloatyPosition>(initialPosition);
    const [size, setSize] = useState<FloatySize>(initialSize ?? {});
    const floatyRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef({
      isDragging: false,
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
      startPointerX: 0,
      startPointerY: 0,
      startWidth: 0,
      startHeight: 0,
      baseLeft: 0,
      baseTop: 0,
    });
    const positionRef = useRef(position);
    const sizeRef = useRef(size);
    const frameRef = useRef<number | null>(null);
    const pendingPositionRef = useRef<FloatyPosition | null>(null);
    const pendingSizeRef = useRef<FloatySize | null>(null);
    const internalHandleRef = useRef<FloatyHandle | null>(null);
    const Pin = mergedIcons.pin;
    const Unpin = mergedIcons.unpin;
    const Collapse = mergedIcons.collapse;
    const Expand = mergedIcons.expand;
    const Minimize = mergedIcons.minimize;
    const Close = mergedIcons.close;

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
      }),
      []
    );

    // Keep internal ref always updated
    internalHandleRef.current = handleMethods;
    positionRef.current = position;
    sizeRef.current = size;

    // Expose imperative methods via forward ref
    useImperativeHandle(ref, () => handleMethods, [handleMethods]);

    // Register with manager using internal ref that always has methods
    useEffect(() => {
      if (id && registerFloaty) {
        return registerFloaty(id, internalHandleRef, {
          isCollapsed,
          isMinimized,
          isPinned,
          position,
          size,
          zIndex,
        });
      }
    }, [id, registerFloaty]);

    useEffect(() => {
      if (id) {
        updateWidgetState?.(id, {
          isCollapsed,
          isMinimized,
          isPinned,
          position,
          size,
          zIndex,
        });
      }
    }, [
      id,
      isCollapsed,
      isMinimized,
      isPinned,
      position,
      size,
      zIndex,
      updateWidgetState,
    ]);

    const flushPendingFrame = useCallback(() => {
      frameRef.current = null;

      const element = floatyRef.current;
      if (!element) return;

      const nextPosition = pendingPositionRef.current;
      if (nextPosition) {
        element.style.transform = `translate(${nextPosition.x}px, ${nextPosition.y}px)`;
      }

      const nextSize = pendingSizeRef.current;
      if (nextSize) {
        if (nextSize.width !== undefined) {
          element.style.width =
            typeof nextSize.width === 'number'
              ? `${nextSize.width}px`
              : nextSize.width;
        }

        if (nextSize.height !== undefined) {
          element.style.height =
            typeof nextSize.height === 'number'
              ? `${nextSize.height}px`
              : nextSize.height;
        }
      }
    }, []);

    const scheduleVisualUpdate = useCallback(() => {
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(flushPendingFrame);
    }, [flushPendingFrame]);

    const handlePointerMove = useCallback((e: PointerEvent) => {
      if (dragStateRef.current.isDragging) {
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
      }

      if (resizeStateRef.current.isResizing) {
        const resizeState = resizeStateRef.current;
        const minWidth = 240;
        const minHeight = 96;
        const maxWidth = window.innerWidth - resizeState.baseLeft;
        const maxHeight = window.innerHeight - resizeState.baseTop;
        const nextWidth =
          resizeState.startWidth + e.clientX - resizeState.startPointerX;
        const nextHeight =
          resizeState.startHeight + e.clientY - resizeState.startPointerY;

        pendingSizeRef.current = {
          width: Math.max(minWidth, Math.min(nextWidth, maxWidth)),
          height: Math.max(minHeight, Math.min(nextHeight, maxHeight)),
        };
        scheduleVisualUpdate();
      }
    }, [scheduleVisualUpdate]);

    const handlePointerUp = useCallback(() => {
      const nextPosition = pendingPositionRef.current;
      const nextSize = pendingSizeRef.current;

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        flushPendingFrame();
      }

      dragStateRef.current.isDragging = false;
      resizeStateRef.current.isResizing = false;
      pendingPositionRef.current = null;
      pendingSizeRef.current = null;

      if (nextPosition) {
        positionRef.current = nextPosition;
        setPosition(nextPosition);
      }

      if (nextSize) {
        sizeRef.current = nextSize;
        setSize(nextSize);
      }

      setIsDragging(false);
      setIsResizing(false);
      globalThis.removeEventListener('pointermove', handlePointerMove);
      globalThis.removeEventListener('pointerup', handlePointerUp);
      globalThis.removeEventListener('pointercancel', handlePointerUp);
    }, [flushPendingFrame, handlePointerMove]);

    const startGlobalPointerListeners = useCallback(() => {
      globalThis.addEventListener('pointermove', handlePointerMove);
      globalThis.addEventListener('pointerup', handlePointerUp);
      globalThis.addEventListener('pointercancel', handlePointerUp);
    }, [handlePointerMove, handlePointerUp]);

    const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
      if (isPinned) return;
      if ((e.target as HTMLElement).closest('button')) return;

      const rect = floatyRef.current?.getBoundingClientRect();
      if (rect) {
        onFocus?.();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragStateRef.current = {
          isDragging: true,
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

    const handleResizePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (isCollapsed) return;

      const rect = floatyRef.current?.getBoundingClientRect();
      if (rect) {
        e.preventDefault();
        e.stopPropagation();
        onFocus?.();
        e.currentTarget.setPointerCapture(e.pointerId);
        resizeStateRef.current = {
          isResizing: true,
          startPointerX: e.clientX,
          startPointerY: e.clientY,
          startWidth: rect.width,
          startHeight: rect.height,
          baseLeft: rect.left,
          baseTop: rect.top,
        };
        startGlobalPointerListeners();
        setIsResizing(true);
      }
    };

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

    if (isMinimized) return null;

    return (
      <div
        ref={floatyRef}
        className={`floaty ${isPinned ? 'pinned' : ''} ${isCollapsed ? 'collapsed' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${className ?? ''}`}
        onPointerDown={onFocus}
        style={{
          ...style,
          left: 0,
          top: 0,
          width: size.width ?? style.width,
          height: size.height ?? style.height,
          transform: `translate(${position.x}px, ${position.y}px)`,
          zIndex,
        }}
      >
        <header
          className={`floaty-header ${isPinned ? 'pinned' : ''}`}
          onPointerDown={handlePointerDown}
        >
          <button
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

          <span className="floaty-title">{title}</span>

          <button
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

          <button
            className="floaty-button floaty-button--minimize"
            onClick={() => setIsMinimized(true)}
            title={labels.minimize}
            aria-label={labels.minimize}
          >
            {Minimize ? <Minimize /> : <MinusIcon />}
          </button>

          {onClose && (
            <button
              className="floaty-button floaty-button--close"
              onClick={onClose}
              title={labels.close}
              aria-label={labels.close}
            >
              {Close ? <Close /> : <CloseIcon />}
            </button>
          )}
        </header>

        {!isCollapsed && (
          <div className="floaty-body">
            {children}
          </div>
        )}

        {!isCollapsed && (
          <button
            className="floaty-resize-handle"
            onPointerDown={handleResizePointerDown}
            title="Resize"
            aria-label="Resize widget"
          />
        )}
      </div>
    );
  }
);

export default Floaty;
