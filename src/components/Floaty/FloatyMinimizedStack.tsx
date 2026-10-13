import type { CSSProperties } from 'react';
import { useFloatyWidgetManager } from '../../hooks/useFloatyWidgetManager';
import { FloatyPreview } from './FloatyPreview';
import './Floaty.css';

/** An optional, manager-connected stack of minimized widget thumbnails. */
export interface FloatyMinimizedStackProps {
  position?: 'left' | 'right' | 'top' | 'bottom';
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  previewScale?: number;
  /** Perspective rotation in degrees. @default 32 */
  rotation?: number;
  /** Overlap between adjacent cards in pixels. @default 24 */
  overlap?: number;
  hoverScale?: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

const positive = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

export const FloatyMinimizedStack = ({
  position = 'left',
  thumbnailWidth = 160,
  thumbnailHeight = 100,
  previewScale = 0.4,
  rotation = 32,
  overlap = 24,
  hoverScale = 1.15,
  className,
  style,
  ariaLabel = 'Minimized windows',
}: FloatyMinimizedStackProps) => {
  const manager = useFloatyWidgetManager();
  const widgets = Array.from(manager.widgets.values()).filter((widget) => widget.isMinimized);
  if (widgets.length === 0) {
    return null;
  }

  const width = positive(thumbnailWidth, 160);
  const height = positive(thumbnailHeight, 100);
  const scale = Math.max(1, positive(hoverScale, 1.15));
  const vertical = position === 'left' || position === 'right';
  const stackStyle = {
    '--floaty-stack-width': `${width}px`,
    '--floaty-stack-height': `${height}px`,
    '--floaty-stack-rotation': `${Number.isFinite(rotation) ? Math.min(60, Math.max(-60, rotation)) : 32}deg`,
    '--floaty-stack-overlap': `${Number.isFinite(overlap) ? Math.min(Math.max(0, overlap), (vertical ? height + 28 : width) - 32) : 24}px`,
    '--floaty-stack-scale': scale,
    // Reserve space on both axes for transformed cards, shadows and focus rings.
    '--floaty-stack-room': `${Math.ceil(Math.max(width, height + 28) * (scale - 1) + 20)}px`,
    ...style,
  } as CSSProperties;

  return (
    <div
      className={`floaty-minimized-stack ${className ?? ''}`}
      data-position={position}
      style={stackStyle}
    >
      <fieldset className="floaty-minimized-stack-list" aria-label={ariaLabel}>
        {widgets.map((widget) => {
          const title = typeof widget.title === 'string' ? widget.title : widget.id;
          return (
            <div className="floaty-minimized-card" key={widget.id}>
              <div
                className="floaty-minimized-preview"
                ref={(element) => {
                  element?.setAttribute('inert', '');
                }}
                aria-hidden="true"
              >
                <FloatyPreview
                  id={widget.id}
                  scale={positive(previewScale, 0.4)}
                  style={{ width, height }}
                  fallback={
                    <div className="floaty-minimized-fallback">{widget.title ?? widget.id}</div>
                  }
                />
              </div>
              <div className="floaty-minimized-title">{widget.title ?? widget.id}</div>
              <button
                type="button"
                className="floaty-minimized-restore"
                aria-label={`${manager.labels.restore}: ${title}`}
                title={`${manager.labels.restore}: ${title}`}
                onClick={() => {
                  manager.restoreWidget(widget.id);
                  manager.bringToFront(widget.id);
                }}
              />
            </div>
          );
        })}
      </fieldset>
    </div>
  );
};
