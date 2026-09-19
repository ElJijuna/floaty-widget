import type { ReactNode } from 'react';
import type { FloatyMode } from './FloatyMode';
import type { FloatyPosition, FloatySize } from './FloatyPosition';
import type { FloatySnapZone, FloatyWindowStyle } from './FloatyWindow';

/** Runtime state of a widget tracked by `FloatyWidgetManager`. */
export interface FloatyWidgetState {
  /** Unique identifier for the widget. */
  id: string;
  /** Content displayed in the widget header. */
  title?: ReactNode;
  /** Visual layout used by the widget. */
  mode?: FloatyMode;
  /** Window chrome style. */
  windowStyle?: FloatyWindowStyle;
  /** Application icon displayed in the window title bar. */
  windowIcon?: ReactNode;
  /** Whether the widget body is hidden (header still visible). */
  isCollapsed: boolean;
  /** Whether the widget is fully hidden from the screen. */
  isMinimized: boolean;
  /** Whether the widget is locked in place and cannot be dragged. */
  isPinned: boolean;
  /** Whether the widget currently fills the viewport. */
  isMaximized: boolean;
  /** Current snap zone, or `null` for free positioning. */
  snapZone: FloatySnapZone | null;
  /** Current position on screen. */
  position?: FloatyPosition;
  /** Current dimensions. */
  size?: FloatySize;
  /** CSS `z-index` used to layer widgets on top of each other. */
  zIndex: number;
  /** Optional localStorage key used to persist this widget layout. */
  persistenceKey?: string;
}
