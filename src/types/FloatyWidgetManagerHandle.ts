import type { ComponentType, RefObject } from 'react';
import type { FloatyHandle } from './FloatyHandle';
import type { FloatyWidget } from './FloatyWidget';
import type { FloatyWidgetState } from './FloatyWidgetState';
import type { FloatyOpenWidget, FloatyOpenWidgetBase, FloatyOpenOptions } from './FloatyOpenWidget';
import type { FloatyWidgetPatch } from './FloatyWidgetPatch';
import type { FloatyTexts } from './FloatyTexts';
import type { FloatyIcons } from './FloatyIcons';
import type { FloatyTheme } from './FloatyTheme';

/** Full API surface returned by `useFloatyWidgetManager()` and exposed via the `FloatyWidgetManager` ref. */
export interface FloatyWidgetManagerHandle {
  /**
   * Opens a new widget (or applies `duplicateStrategy` if the id already exists).
   * @returns The id of the opened widget.
   */
  open: <P>(widget: FloatyOpenWidget<P>, options?: FloatyOpenOptions) => string;
  /**
   * Shorthand for `open` — pass the component separately from the rest of the config.
   * @returns The id of the opened widget.
   */
  openComponent: <P>(
    component: ComponentType<P>,
    config: FloatyOpenWidgetBase<P>
  ) => string;
  /** Removes a widget by id. */
  close: (id: string) => void;
  /** Removes all widgets. */
  closeAll: () => void;
  /** Applies a partial update to a widget. */
  update: <P = unknown>(id: string, patch: FloatyWidgetPatch<P>) => void;
  /** Updates only the props of a widget's component without touching its state. */
  updateProps: <P>(id: string, props: P) => void;
  /** Raises a widget above all others by increasing its `z-index`. */
  bringToFront: (id: string) => void;
  /**
   * Internal — called by `<Floaty id="…">` on mount to synchronise with the manager.
   * @returns A cleanup function that unregisters the widget on unmount.
   */
  registerFloaty: (
    id: string,
    ref: RefObject<FloatyHandle | null>,
    initialState?: Partial<Omit<FloatyWidgetState, 'id'>>
  ) => () => void;
  /** Internal — removes the imperative ref from the registry without destroying the widget entry. */
  unregisterFloaty: (id: string) => void;
  /** Internal — syncs state changes from `<Floaty>` back into the manager's widget map. */
  updateWidgetState: (
    id: string,
    state: Partial<Omit<FloatyWidgetState, 'id'>>
  ) => void;
  /** Expands all widgets. */
  expandAll: () => void;
  /** Collapses all widgets. */
  collapseAll: () => void;
  /** Minimizes all widgets. */
  minimizeAll: () => void;
  /** Restores all minimized widgets. */
  restoreAll: () => void;
  /** Pins all widgets. */
  pinAll: () => void;
  /** Unpins all widgets. */
  unpinAll: () => void;
  /** Expands a single widget by id. */
  expandWidget: (id: string) => void;
  /** Collapses a single widget by id. */
  collapseWidget: (id: string) => void;
  /** Minimizes a single widget by id. */
  minimizeWidget: (id: string) => void;
  /** Restores a single minimized widget by id. */
  restoreWidget: (id: string) => void;
  /** Pins a single widget by id. */
  pinWidget: (id: string) => void;
  /** Unpins a single widget by id. */
  unpinWidget: (id: string) => void;
  /** Returns the total number of registered widgets. */
  getWidgetCount: () => number;
  /** Returns the current state of a widget, or `undefined` if it does not exist. */
  getWidget: (id: string) => FloatyWidget | undefined;
  /** Live map of all registered widgets, keyed by id. */
  widgets: Map<string, FloatyWidget>;
  /** Resolved labels used for action buttons across all widgets. */
  labels: FloatyTexts;
  /** Custom icon components used across all widgets. */
  icons: FloatyIcons;
  /** Active theme tokens applied via CSS custom properties. */
  theme?: FloatyTheme;
}
