import { useState, useRef, useEffect, ReactNode, CSSProperties } from 'react';
import './Floaty.css';

interface Position {
  x: number;
  y: number;
}

export interface FloatyProps {
  children?: ReactNode;
  title?: string;
  style?: CSSProperties;
}

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

/**
 * Floaty - A draggable, collapsible floating component
 * @param props - Component props
 * @param props.children - Content to display in the floaty body
 * @param props.title - Header title
 * @param props.style - Additional inline styles
 */
export const Floaty = ({
  children = 'Content',
  title = 'Floaty',
  style = {},
}: FloatyProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 100, y: 100 });
  const floatyRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if (isPinned) return;

    const rect = floatyRef.current?.getBoundingClientRect();
    if (rect) {
      dragStateRef.current = {
        isDragging: true,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging) return;

      const rect = floatyRef.current?.getBoundingClientRect();
      if (!rect) return;

      let newX = e.clientX - dragStateRef.current.offsetX;
      let newY = e.clientY - dragStateRef.current.offsetY;

      // Constrain to viewport
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({
        x: newX,
        y: newY,
      });
    };

    const handleMouseUp = () => {
      dragStateRef.current.isDragging = false;
    };

    globalThis.addEventListener('mousemove', handleMouseMove);
    globalThis.addEventListener('mouseup', handleMouseUp);

    return () => {
      globalThis.removeEventListener('mousemove', handleMouseMove);
      globalThis.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={floatyRef}
      className={`floaty ${isPinned ? 'pinned' : ''} ${isCollapsed ? 'collapsed' : ''} ${dragStateRef.current.isDragging ? 'dragging' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        ...style,
      }}
    >
      <header
        className={`floaty-header ${isPinned ? 'pinned' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <button
          className="floaty-button floaty-button--pin"
          onClick={() => setIsPinned(!isPinned)}
          title={isPinned ? 'Unpin' : 'Pin'}
          aria-label={isPinned ? 'Unpin floaty' : 'Pin floaty'}
        >
          <PinIcon pinned={isPinned} />
        </button>

        <span className="floaty-title">{title}</span>

        <button
          className="floaty-button floaty-button--expand"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand' : 'Collapse'}
          aria-label={isCollapsed ? 'Expand floaty' : 'Collapse floaty'}
        >
          <ChevronIcon collapsed={isCollapsed} />
        </button>
      </header>

      {!isCollapsed && (
        <div className="floaty-body">
          {children}
        </div>
      )}
    </div>
  );
};
