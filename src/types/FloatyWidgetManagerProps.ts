import type { ReactNode } from 'react';
import type { FloatyIcons } from './FloatyIcons';
import type { FloatyTexts } from './FloatyTexts';
import type { FloatyTheme } from './FloatyTheme';

/** Props for the `FloatyWidgetManager` provider component. */
export interface FloatyWidgetManagerProps {
  children?: ReactNode;
  /** Override the default action button labels for all widgets inside this provider. */
  labels?: Partial<FloatyTexts>;
  /** Custom icon components for action buttons, applied to all widgets inside this provider. */
  icons?: FloatyIcons;
  /** Theme tokens applied via CSS custom properties to all widgets inside this provider. */
  theme?: FloatyTheme;
  /**
   * Lets users merge window-mode widgets into tabs by dropping one window on another window's
   * title bar, and detach them again by dragging a tab out. @default false
   */
  windowGrouping?: boolean;
}
