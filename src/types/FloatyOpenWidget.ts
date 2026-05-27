import type { ComponentType, ReactNode } from 'react';
import type { FloatyPosition, FloatySize } from './FloatyPosition';
import type { FloatyComponentLoader } from './FloatyWidget';

/** Common payload fields used when opening a widget. */
export type FloatyOpenWidgetBase<P> = {
  /** Unique identifier. If a widget with this id already exists, `duplicateStrategy` controls the behaviour. */
  id: string;
  /** Props forwarded to `component`. */
  props: P;
  /** Content rendered while a lazy widget body is loading. */
  fallback?: ReactNode;
  /** Content displayed in the widget header. */
  title?: ReactNode;
  /** Initial position on screen. */
  position?: FloatyPosition;
  /** Initial dimensions. */
  size?: FloatySize;
  /** Open the widget already collapsed. */
  collapsed?: boolean;
  /** Open the widget already minimized. */
  minimized?: boolean;
  /** Open the widget already pinned. */
  pinned?: boolean;
  /** Additional CSS class applied to the widget root element. */
  className?: string;
};

/** Payload passed to `manager.open()` to create a new widget. */
export type FloatyOpenWidget<P> = FloatyOpenWidgetBase<P> &
  (
    | {
        /** React component to render inside the widget body. */
        component: ComponentType<P>;
        loader?: never;
      }
    | {
        /** Dynamic import callback used to lazy-load the widget body. */
        loader: FloatyComponentLoader<P>;
        component?: never;
      }
  );

/**
 * Controls what happens when `open()` is called with an id that already exists.
 *
 * - `'replace'` — replaces the existing widget (default).
 * - `'focus'`   — brings the existing widget to the front without replacing it.
 * - `'duplicate'` — opens a second widget with a suffixed id (e.g. `my-id-2`).
 */
export type FloatyDuplicateStrategy = 'replace' | 'focus' | 'duplicate';

/** Options accepted by `manager.open()`. */
export interface FloatyOpenOptions {
  /** @default 'replace' */
  duplicateStrategy?: FloatyDuplicateStrategy;
}
