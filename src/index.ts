export { openFloaty, closeFloaty, closeAllFloaty, updateFloaty, connectFloatySingleton } from './singleton';
export { useFloatySingleton } from './hooks/useFloatySingleton';

export { Floaty } from './components/Floaty/Floaty';
export type { FloatyProps } from './components/Floaty/Floaty';
export { FloatyViewport } from './components/Floaty/FloatyViewport';
export type { FloatyViewportProps } from './components/Floaty/FloatyViewport';

export {
  FloatyWidgetManager,
  FloatyWidgetManager as FloatyProvider,
  useFloatyWidgetManager,
  useFloatyWidgetManager as useFloaty,
  useFloatyWidget,
} from './context/FloatyWidgetManager';
export type {
  FloatyHandle,
  FloatyComponentLoader,
  FloatyIcons,
  FloatyIconComponent,
  FloatyLazyModule,
  FloatyOpenWidgetBase,
  FloatyOpenOptions,
  FloatyOpenWidget,
  FloatyPosition,
  FloatySize,
  FloatyTexts,
  FloatyTheme,
  FloatyWidget,
  FloatyWidgetManagerHandle,
  FloatyWidgetManagerProps,
  FloatyWidgetPatch,
  FloatyWidgetState,
} from './context/FloatyWidgetManager';
