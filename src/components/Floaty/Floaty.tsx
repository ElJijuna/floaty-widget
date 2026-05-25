import {
  useState,
  useRef,
  useEffect,
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
  type FloatyTexts,
} from '../../context/FloatyWidgetManager';

export interface FloatyProps {
  children?: ReactNode;
  title?: ReactNode;
  style?: CSSProperties;
  className?: string;
  id?: string;
  labels?: Partial<FloatyTexts>;
  icons?: FloatyIcons;
  defaultCollapsed?: boolean;
  defaultPinned?: boolean;
  initialPosition?: FloatyPosition;
  zIndex?: number;
  onClose?: () => void;
  onFocus?: () => void;
}

const defaultLabels: FloatyTexts = {
  pin: 'Pin',
  unpin: 'Unpin',
  collapse: 'Collapse',
  expand: 'Expand',
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

/**
 * Floaty - A draggable, collapsible floating component
 * @param props - Component props
 * @param props.children - Content to display in the floaty body
 * @param props.title - Header title
 * @param props.style - Additional inline styles
 * @param props.id - Unique identifier for widget manager integration
 * @param ref - Forward ref to access imperative methods
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
      defaultPinned = false,
      initialPosition = { x: 100, y: 100 },
      zIndex,
      onClose,
      onFocus,
    }: FloatyProps,
    ref
  ) => {
    const manager = useFloatyManager();
    const registerFloaty = manager?.registerFloaty;
    const updateWidgetState = manager?.updateWidgetState;
    const labels = { ...defaultLabels, ...manager?.labels, ...labelsProp };
    const mergedIcons = { ...manager?.icons, ...icons };
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [isPinned, setIsPinned] = useState(defaultPinned);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState<FloatyPosition>(initialPosition);
    const floatyRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef({
      isDragging: false,
      startPointerX: 0,
      startPointerY: 0,
      startX: 0,
      startY: 0,
      baseLeft: 0,
      baseTop: 0,
    });
    const internalHandleRef = useRef<FloatyHandle | null>(null);
    const Pin = mergedIcons.pin;
    const Unpin = mergedIcons.unpin;
    const Collapse = mergedIcons.collapse;
    const Expand = mergedIcons.expand;
    const Close = mergedIcons.close;

    const handleMethods = useMemo<FloatyHandle>(
      () => ({
        expand: () => setIsCollapsed(false),
        collapse: () => setIsCollapsed(true),
        pin: () => setIsPinned(true),
        unpin: () => setIsPinned(false),
        toggle: () => setIsCollapsed((prev) => !prev),
      }),
      []
    );

    // Keep internal ref always updated
    internalHandleRef.current = handleMethods;

    // Expose imperative methods via forward ref
    useImperativeHandle(ref, () => handleMethods, [handleMethods]);

    // Register with manager using internal ref that always has methods
    useEffect(() => {
      if (id && registerFloaty) {
        return registerFloaty(id, internalHandleRef, {
          isCollapsed,
          isPinned,
          position,
          zIndex,
        });
      }
    }, [id, registerFloaty]);

    useEffect(() => {
      if (id) {
        updateWidgetState?.(id, { isCollapsed, isPinned, position, zIndex });
      }
    }, [id, isCollapsed, isPinned, position, zIndex, updateWidgetState]);

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
          startX: position.x,
          startY: position.y,
          baseLeft: rect.left - position.x,
          baseTop: rect.top - position.y,
        };
        setIsDragging(true);
      }
    };

    useEffect(() => {
      const handlePointerMove = (e: PointerEvent) => {
        if (!dragStateRef.current.isDragging) return;

        const rect = floatyRef.current?.getBoundingClientRect();
        if (!rect) return;

        const dragState = dragStateRef.current;
        let newX = dragState.startX + e.clientX - dragState.startPointerX;
        let newY = dragState.startY + e.clientY - dragState.startPointerY;

        // Constrain to viewport
        const minX = -dragState.baseLeft;
        const minY = -dragState.baseTop;
        const maxX = window.innerWidth - rect.width - dragState.baseLeft;
        const maxY = window.innerHeight - rect.height - dragState.baseTop;

        newX = Math.max(minX, Math.min(newX, maxX));
        newY = Math.max(minY, Math.min(newY, maxY));

        setPosition({
          x: newX,
          y: newY,
        });
      };

      const handlePointerUp = () => {
        dragStateRef.current.isDragging = false;
        setIsDragging(false);
      };

      globalThis.addEventListener('pointermove', handlePointerMove);
      globalThis.addEventListener('pointerup', handlePointerUp);
      globalThis.addEventListener('pointercancel', handlePointerUp);

      return () => {
        globalThis.removeEventListener('pointermove', handlePointerMove);
        globalThis.removeEventListener('pointerup', handlePointerUp);
        globalThis.removeEventListener('pointercancel', handlePointerUp);
      };
    }, []);

    return (
      <div
        ref={floatyRef}
        className={`floaty ${isPinned ? 'pinned' : ''} ${isCollapsed ? 'collapsed' : ''} ${isDragging ? 'dragging' : ''} ${className ?? ''}`}
        onPointerDown={onFocus}
        style={{
          ...style,
          left: 0,
          top: 0,
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
      </div>
    );
  }
);

export default Floaty;
