import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
} from 'react';
import { useFloatyWidgetManager } from '../../hooks/useFloatyWidgetManager';
import type { FloatyLayoutDivider } from '../../types';

const KEYBOARD_STEP = 16;
const KEYBOARD_LARGE_STEP = 64;

const center = (divider: FloatyLayoutDivider) =>
  divider.orientation === 'vertical'
    ? divider.rect.x + divider.rect.width / 2
    : divider.rect.y + divider.rect.height / 2;

/**
 * Draggable boundaries between the windows of a layout kept by `setLayout()`. Rendered by
 * `FloatyViewport`; each move resizes the windows on both sides of the divider.
 */
export const FloatyLayoutDividers = () => {
  const manager = useFloatyWidgetManager();
  const { layout, layoutDividers, moveLayoutDivider, setLayout, labels, widgets, groups } = manager;
  const dragRef = useRef<{ id: string; pointerId: number; offset: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<{ id: string; coordinate: number } | null>(null);

  const flush = () => {
    frameRef.current = null;
    const pending = pendingRef.current;
    pendingRef.current = null;

    if (pending) {
      moveLayoutDivider(pending.id, pending.coordinate);
    }
  };

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  if (!layout || layoutDividers.length === 0) {
    return null;
  }

  const visibleWindows = Array.from(widgets.values()).filter(
    (widget) =>
      widget.mode === 'window' &&
      !widget.isMinimized &&
      (!widget.groupId || groups.get(widget.groupId)?.activeId === widget.id),
  );

  // A maximized window covers the layout, so its dividers would float over it.
  if (visibleWindows.some((widget) => widget.isMaximized)) {
    return null;
  }

  const zIndex = Math.max(1000, ...visibleWindows.map((widget) => widget.zIndex)) + 1;

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    divider: FloatyLayoutDivider,
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.setAttribute('data-dragging', 'true');

    // Layout coordinates are relative to the viewport's containing block, which may not start at
    // the window origin (e.g. a padded or transformed container); pointer coordinates always do.
    const rect = event.currentTarget.getBoundingClientRect();
    const offset =
      divider.orientation === 'vertical' ? rect.left - divider.rect.x : rect.top - divider.rect.y;

    dragRef.current = { id: divider.id, pointerId: event.pointerId, offset };
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
    divider: FloatyLayoutDivider,
  ) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId || drag.id !== divider.id) {
      return;
    }

    pendingRef.current = {
      id: divider.id,
      coordinate:
        (divider.orientation === 'vertical' ? event.clientX : event.clientY) - drag.offset,
    };
    frameRef.current ??= requestAnimationFrame(flush);
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    event.currentTarget.removeAttribute('data-dragging');

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
    flush();
  };

  const handleKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    divider: FloatyLayoutDivider,
  ) => {
    const [decrease, increase] =
      divider.orientation === 'vertical' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];

    if (event.key !== decrease && event.key !== increase) {
      return;
    }

    event.preventDefault();
    const step = event.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
    moveLayoutDivider(divider.id, center(divider) + (event.key === increase ? step : -step));
  };

  /** Double-click evens out the tracks on that axis again. */
  const reset = (divider: FloatyLayoutDivider) => {
    const key = divider.id.startsWith('column:')
      ? 'columnWeights'
      : divider.id.startsWith('row:')
        ? 'rowWeights'
        : null;

    if (key) {
      setLayout(layout.arrangement, { ...layout.options, [key]: undefined });
    }
  };

  return (
    <>
      {layoutDividers.map((divider) => (
        // biome-ignore lint/a11y/useSemanticElements: <hr> cannot be focused and dragged
        <div
          key={divider.id}
          role="separator"
          tabIndex={0}
          aria-label={labels.layoutDivider}
          aria-orientation={divider.orientation}
          aria-valuenow={divider.value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-keyshortcuts={
            divider.orientation === 'vertical' ? 'ArrowLeft ArrowRight' : 'ArrowUp ArrowDown'
          }
          data-divider-id={divider.id}
          className={`floaty-layout-divider floaty-layout-divider--${divider.orientation}`}
          style={{
            left: divider.rect.x,
            top: divider.rect.y,
            width: divider.rect.width,
            height: divider.rect.height,
            zIndex,
          }}
          onPointerDown={(event) => handlePointerDown(event, divider)}
          onPointerMove={(event) => handlePointerMove(event, divider)}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onKeyDown={(event) => handleKeyDown(event, divider)}
          onDoubleClick={() => reset(divider)}
        />
      ))}
    </>
  );
};
