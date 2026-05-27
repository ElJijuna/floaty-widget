import type { ComponentType } from 'react';
import type { FloatyWidget, FloatyComponentLoader } from './FloatyWidget';

/**
 * Partial update applied to an existing widget via `manager.update()`.
 * Supports both the camelCase state flags (`isCollapsed`) and their shorthand aliases (`collapsed`).
 */
export type FloatyWidgetPatch<P = unknown> = Partial<
  Omit<FloatyWidget<P>, 'id' | 'component' | 'loader' | 'props'>
> & {
  component?: ComponentType<P>;
  loader?: FloatyComponentLoader<P>;
  props?: P;
  collapsed?: boolean;
  minimized?: boolean;
  pinned?: boolean;
};
