import type { ComponentType } from 'react';
import type { FloatyActionTexts } from './FloatyTexts';

/** Key matching one of the action buttons in the widget header. */
export type FloatyIconName = keyof FloatyActionTexts;
/** A React component used as a custom icon. Receives `active` when the action is currently active. */
export type FloatyIconComponent = ComponentType<{ active?: boolean }>;
/** Map of custom icon components, keyed by action name. Unset keys fall back to the built-in SVG icons. */
export type FloatyIcons = Partial<
  Record<Exclude<FloatyIconName, 'resize'>, FloatyIconComponent>
> & {
  /**
   * @deprecated Floating mode no longer has a resize button: every edge and corner resizes, as in
   * window mode. This icon is ignored.
   */
  resize?: FloatyIconComponent;
};
