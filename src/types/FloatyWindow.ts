import type { FloatyPosition, FloatySize } from './FloatyPosition';

/** Visual chrome for window mode. `custom` uses the consumer's CSS variables. */
export type FloatyWindowStyle = 'mac' | 'windows' | 'custom';

/** Arrangement applied to visible windows managed by Floaty. */
export type FloatyWindowArrangement = 'columns' | 'rows' | 'grid';

/** Spacing reserved while arranging windows, in pixels. */
export interface FloatyArrangeOptions {
  gap?: number;
  margin?: number;
  bottomInset?: number;
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
