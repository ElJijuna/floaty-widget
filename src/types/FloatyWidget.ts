import type { ComponentType, ReactNode } from 'react';
import type { FloatyWidgetState } from './FloatyWidgetState';

/** Module shape accepted by lazy widget loaders. */
export type FloatyLazyModule<P = unknown> =
  | { default: ComponentType<P> }
  | ComponentType<P>;

/** Dynamic import callback used to load widget content only when it is rendered. */
export type FloatyComponentLoader<P = unknown> = () => Promise<FloatyLazyModule<P>>;

/** Full descriptor of a widget registered in `FloatyWidgetManager`, including its component and props. */
export interface FloatyWidget<P = unknown> extends FloatyWidgetState {
  /** React component rendered inside the widget body. */
  component?: ComponentType<P>;
  /** Dynamic import callback used to lazy-load the widget body. */
  loader?: FloatyComponentLoader<P>;
  /** Props forwarded to `component`. */
  props?: P;
  /** Content rendered while a lazy widget body is loading. */
  fallback?: ReactNode;
  /** Additional CSS class applied to the widget root element. */
  className?: string;
}
