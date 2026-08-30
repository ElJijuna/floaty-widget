import type { FloatyPosition, FloatySize } from './FloatyPosition';

/** Imperative handle exposed via `ref` on a `<Floaty>` component. */
export interface FloatyHandle {
  /** Expands the widget body if it is collapsed. */
  expand: () => void;
  /** Collapses the widget body, keeping the header visible. */
  collapse: () => void;
  /** Hides the widget completely (removed from the DOM). */
  minimize: () => void;
  /** Makes the widget visible again after it was minimized. */
  restore: () => void;
  /** Locks the widget in place so it cannot be dragged. */
  pin: () => void;
  /** Unlocks the widget so it can be dragged again. */
  unpin: () => void;
  /** Toggles the collapsed state of the widget body. */
  toggle: () => void;
  /** Toggles the minimized state of the widget. */
  toggleMinimized: () => void;
  /** Moves the widget to a screen position, clamped to the visible viewport. */
  moveTo: (position: FloatyPosition) => void;
  /** Resizes the widget and keeps it inside the visible viewport. */
  resizeTo: (size: FloatySize) => void;
}
