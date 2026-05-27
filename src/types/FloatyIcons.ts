import type { ComponentType } from 'react';
import type { FloatyActionTexts } from './FloatyTexts';

/** Key matching one of the action buttons in the widget header. */
export type FloatyIconName = keyof FloatyActionTexts;
/** A React component used as a custom icon. Receives `active` when the action is currently active. */
export type FloatyIconComponent = ComponentType<{ active?: boolean }>;
/** Map of custom icon components, keyed by action name. Unset keys fall back to the built-in SVG icons. */
export type FloatyIcons = Partial<Record<FloatyIconName, FloatyIconComponent>>;
