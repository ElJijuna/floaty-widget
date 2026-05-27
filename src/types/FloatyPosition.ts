/** X/Y coordinates for positioning a widget on screen. */
export interface FloatyPosition {
  x: number;
  y: number;
}

/** Explicit dimensions for a widget. Accepts pixel numbers or CSS strings (e.g. `'50%'`). */
export interface FloatySize {
  width?: number | string;
  height?: number | string;
}
