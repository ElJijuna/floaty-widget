import type { CSSProperties, ReactNode } from 'react';
import { useFloatyWidgetManager } from '../../hooks/useFloatyWidgetManager';
import './Floaty.css';

/** Props for the manager-connected desktop taskbar. */
export interface FloatyTaskbarProps {
  /** Accessible name announced for the taskbar toolbar. */
  ariaLabel?: string;
  /** Additional class applied to the taskbar root. */
  className?: string;
  /** Inline styles applied to the taskbar root. */
  style?: CSSProperties;
  /** Placeholder rendered when no managed widgets are open. */
  emptyState?: ReactNode;
  /** Whether each task includes a close action. @default true */
  showClose?: boolean;
}

/**
 * Lists every widget in the nearest manager and restores/focuses it like a desktop taskbar.
 */
export const FloatyTaskbar = ({
  ariaLabel = 'Open windows',
  className,
  style,
  emptyState = null,
  showClose = true,
}: FloatyTaskbarProps) => {
  const manager = useFloatyWidgetManager();
  const widgets = Array.from(manager.widgets.values());
  const activeZIndex = Math.max(
    0,
    ...widgets.filter((widget) => !widget.isMinimized).map((widget) => widget.zIndex),
  );

  if (widgets.length === 0 && emptyState === null) {
    return null;
  }

  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={`floaty-taskbar ${className ?? ''}`}
      style={style}
    >
      {widgets.length === 0
        ? emptyState
        : widgets.map((widget) => {
            const isActive = !widget.isMinimized && widget.zIndex === activeZIndex;
            const title = typeof widget.title === 'string' ? widget.title : widget.id;

            return (
              <div
                key={widget.id}
                className={`floaty-task ${isActive ? 'active' : ''} ${widget.isMinimized ? 'minimized' : ''}`}
              >
                <button
                  type="button"
                  className="floaty-task-button"
                  aria-pressed={isActive}
                  title={widget.isMinimized ? `${manager.labels.restore}: ${title}` : title}
                  onClick={() => {
                    if (widget.isMinimized) {
                      manager.restoreWidget(widget.id);
                    }
                    manager.bringToFront(widget.id);
                  }}
                >
                  <span className="floaty-task-status" aria-hidden="true" />
                  <span className="floaty-task-title">{title}</span>
                </button>

                {showClose && (
                  <button
                    type="button"
                    className="floaty-task-close"
                    aria-label={`${manager.labels.close}: ${title}`}
                    title={`${manager.labels.close}: ${title}`}
                    onClick={() => manager.close(widget.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
    </div>
  );
};
