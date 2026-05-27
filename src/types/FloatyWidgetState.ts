import type { ReactNode } from 'react';
import type { FloatyPosition, FloatySize } from './FloatyPosition';

/** Runtime state of a widget tracked by `FloatyWidgetManager`. */
export interface FloatyWidgetState {
  /** Unique identifier for the widget. */
  id: string;
  /** Content displayed in the widget header. */
  title?: ReactNode;
  /** Whether the widget body is hidden (header still visible). */
  isCollapsed: boolean;
  /** Whether the widget is fully hidden from the screen. */
  isMinimized: boolean;
  /** Whether the widget is locked in place and cannot be dragged. */
  isPinned: boolean;
  /** Current position on screen. */
  position?: FloatyPosition;
  /** Current dimensions. */
  size?: FloatySize;
  /** CSS `z-index` used to layer widgets on top of each other. */
  zIndex: number;
}
