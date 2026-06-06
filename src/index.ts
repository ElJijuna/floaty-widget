export type { FloatyProps } from './components/Floaty/Floaty';
export { Floaty } from './components/Floaty/Floaty';
export type { FloatyPreviewProps } from './components/Floaty/FloatyPreview';
export { FloatyPreview } from './components/Floaty/FloatyPreview';
export type { FloatyViewportProps } from './components/Floaty/FloatyViewport';
export { FloatyViewport } from './components/Floaty/FloatyViewport';
export {
  FloatyWidgetManager,
  FloatyWidgetManager as FloatyProvider,
} from './context/FloatyWidgetManager';
export { useFloatySingleton } from './hooks/useFloatySingleton';
export {
  useFloatyWidget,
  useFloatyWidgetManager,
  useFloatyWidgetManager as useFloaty,
} from './hooks/useFloatyWidgetManager';
export {
  closeAllFloaty,
  closeFloaty,
  connectFloatySingleton,
  openFloaty,
  updateFloaty,
} from './singleton';
export type {
  FloatyComponentLoader,
  FloatyHandle,
  FloatyIconComponent,
  FloatyIcons,
  FloatyLazyModule,
  FloatyOpenOptions,
  FloatyOpenWidget,
  FloatyOpenWidgetBase,
  FloatyPosition,
  FloatySize,
  FloatyTexts,
  FloatyTheme,
  FloatyWidget,
  FloatyWidgetManagerHandle,
  FloatyWidgetManagerProps,
  FloatyWidgetPatch,
  FloatyWidgetState,
} from './types';
