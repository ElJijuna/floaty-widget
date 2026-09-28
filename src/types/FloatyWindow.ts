import type { FloatyPosition, FloatySize } from './FloatyPosition';

/** Visual chrome for window mode. `custom` uses the consumer's CSS variables. */
export type FloatyWindowStyle = 'mac' | 'windows' | 'custom';

/** Viewport edge used to dock a stack of windows. */
export type FloatyDockEdge = 'left' | 'right' | 'top' | 'bottom';

/**
 * Arrangement applied to visible windows managed by Floaty.
 * `left`/`right` stack windows vertically against that edge; `top`/`bottom` place them side by side.
 */
export type FloatyWindowArrangement = 'columns' | 'rows' | 'grid' | FloatyDockEdge;

/** Space reserved on each viewport edge (e.g. an app header, sidebar or taskbar), in pixels. */
export interface FloatyInsets {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/** Spacing reserved while arranging windows, in pixels. */
export interface FloatyArrangeOptions {
  gap?: number;
  margin?: number;
  /** Space reserved on each edge, added to `margin`. */
  insets?: FloatyInsets;
  /** @deprecated Use `insets.bottom`. Ignored when `insets.bottom` is set. */
  bottomInset?: number;
  /** Animate windows into their new geometry. Defaults to `true`. */
  animate?: boolean;
  /**
   * Thickness of a docked stack: width for `left`/`right`, height for `top`/`bottom`.
   * Defaults to the largest current window size along that axis.
   */
  size?: number;
}

/** Arrangement kept active by `setLayout()` and re-applied whenever the windows or viewport change. */
export interface FloatyActiveLayout {
  arrangement: FloatyWindowArrangement;
  options: FloatyArrangeOptions;
}

/** Viewport region occupied by a snapped window. */
export type FloatySnapZone =
  | 'top'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/** Edge or corner used during an interactive resize. */
export type FloatyResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

/** Pixel constraints applied while a widget is resized. */
export interface FloatySizeConstraints {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/** Geometry emitted by drag, resize, maximize and snap operations. */
export interface FloatyGeometry {
  position: FloatyPosition;
  size: FloatySize;
}

/** Options for `FloatyHandle.setGeometry()`. */
export interface FloatySetGeometryOptions {
  /** Transition position and size instead of jumping. Defaults to `false`. */
  animate?: boolean;
}

/** Complete state supplied to a controlled `<Floaty>`. */
export interface FloatyControlledState extends FloatyGeometry {
  isCollapsed: boolean;
  isMinimized: boolean;
  isPinned: boolean;
  isMaximized: boolean;
  snapZone: FloatySnapZone | null;
}

/** Serializable layout state stored by Floaty persistence. */
export interface FloatyPersistedState extends FloatyControlledState {
  version: 1;
  /** Free geometry restored after leaving maximize or snap. */
  restoreGeometry?: FloatyGeometry;
}
