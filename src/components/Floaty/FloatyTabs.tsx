import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useLayoutEffect,
  useRef,
} from 'react';
import type { FloatyPosition, FloatyTexts, FloatyWindowTab } from '../../types';

/** Distance a tab must be dragged away from the strip before it detaches. */
const DETACH_DISTANCE = 24;

/**
 * Selecting a tab hides this window and shows the tab's own window, which unmounts nothing but
 * moves focus out of view. The newly shown strip picks the focus back up from here.
 */
let pendingTabFocusId: string | null = null;

interface FloatyTabsProps {
  tabs: FloatyWindowTab[];
  activeId: string;
  hidden: boolean;
  labels: FloatyTexts;
  onSelect?: (id: string) => void;
  onClose?: (id: string) => void;
  onDetach?: (id: string, position?: FloatyPosition) => void;
}

const tabLabel = (tab: FloatyWindowTab) => (typeof tab.title === 'string' ? tab.title : tab.id);

/** Tab strip rendered in the title bar of a tabbed window group. */
export const FloatyTabs = ({
  tabs,
  activeId,
  hidden,
  labels,
  onSelect,
  onClose,
  onDetach,
}: FloatyTabsProps) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; pointerId: number; detaching: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  // `tabs.length` re-runs the scroll when tabs are added or removed.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional re-run trigger
  useLayoutEffect(() => {
    if (hidden) {
      return;
    }

    const activeTab = stripRef.current?.querySelector<HTMLElement>(
      '[role="tab"][aria-selected="true"]',
    );

    // Narrow windows scroll the strip; keep the selected tab in view.
    activeTab?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });

    if (pendingTabFocusId === activeId) {
      pendingTabFocusId = null;
      activeTab?.focus({ preventScroll: true });
    }
  }, [activeId, hidden, tabs.length]);

  const select = (id: string) => {
    if (id !== activeId) {
      pendingTabFocusId = id;
    }
    onSelect?.(id);
  };

  const isOutsideStrip = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = stripRef.current?.getBoundingClientRect();

    return Boolean(
      rect &&
        (event.clientY < rect.top - DETACH_DISTANCE ||
          event.clientY > rect.bottom + DETACH_DISTANCE ||
          event.clientX < rect.left - DETACH_DISTANCE ||
          event.clientX > rect.right + DETACH_DISTANCE),
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    if (event.button !== 0 || !onDetach) {
      return;
    }

    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { id, pointerId: event.pointerId, detaching: false };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const detaching = isOutsideStrip(event);

    if (detaching !== drag.detaching) {
      drag.detaching = detaching;
      event.currentTarget.toggleAttribute('data-detaching', detaching);
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    event.currentTarget.removeAttribute('data-detaching');

    if (drag.detaching || isOutsideStrip(event)) {
      suppressClickRef.current = true;
      onDetach?.(drag.id, { x: event.clientX - 60, y: event.clientY - 16 });
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const tab = tabs[index];
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    } else if (event.key === 'Delete' && onClose) {
      event.preventDefault();
      event.stopPropagation();
      onClose(tab.id);
      return;
    } else if (event.key === 'ArrowDown' && event.altKey && onDetach) {
      event.preventDefault();
      event.stopPropagation();
      onDetach(tab.id);
      return;
    }

    if (nextIndex !== null) {
      // Keep arrow keys from also moving the window through the header handler.
      event.preventDefault();
      event.stopPropagation();
      select(tabs[nextIndex].id);
    }
  };

  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-label={labels.tabs}
      aria-orientation="horizontal"
      className="floaty-tabs"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeId;
        const label = tabLabel(tab);

        return (
          <div
            key={tab.id}
            role="presentation"
            className={`floaty-tab ${isActive ? 'active' : ''}`}
          >
            <button
              type="button"
              role="tab"
              className="floaty-tab-button"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              title={label}
              aria-keyshortcuts={[
                'ArrowLeft ArrowRight Home End',
                onClose && 'Delete',
                onDetach && 'Alt+ArrowDown',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (suppressClickRef.current) {
                  suppressClickRef.current = false;
                  return;
                }
                select(tab.id);
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onPointerDown={(event) => handlePointerDown(event, tab.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => {
                dragRef.current = null;
              }}
            >
              <span className="floaty-tab-title">{tab.title ?? tab.id}</span>
            </button>
            {onClose && (
              <button
                type="button"
                className="floaty-tab-close"
                tabIndex={-1}
                aria-label={`${labels.close}: ${label}`}
                title={`${labels.close}: ${label}`}
                onClick={() => onClose(tab.id)}
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
