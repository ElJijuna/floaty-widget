import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import {
  FloatyWidgetManager,
  type FloatyWidgetManagerHandle,
  type FloatyOpenWidget,
  type FloatyOpenOptions,
  type FloatyWidgetPatch,
} from './context/FloatyWidgetManager';
import { FloatyViewport } from './components/Floaty/FloatyViewport';

let getExternalManager: (() => FloatyWidgetManagerHandle) | null = null;
const ownRef: { current: FloatyWidgetManagerHandle | null } = { current: null };

export function connectFloatySingleton(
  getter: (() => FloatyWidgetManagerHandle) | null
): void {
  getExternalManager = getter;
}

function getManager(): FloatyWidgetManagerHandle {
  if (getExternalManager) return getExternalManager();
  if (ownRef.current) return ownRef.current;

  const container = document.createElement('div');
  container.setAttribute('data-floaty-root', '');
  document.body.appendChild(container);

  flushSync(() => {
    createRoot(container).render(
      createElement(FloatyWidgetManager, { ref: ownRef, children: createElement(FloatyViewport) })
    );
  });

  return ownRef.current!;
}

export function openFloaty<P>(widget: FloatyOpenWidget<P>, options?: FloatyOpenOptions): string {
  return getManager().open(widget, options);
}

export function closeFloaty(id: string): void {
  getManager().close(id);
}

export function closeAllFloaty(): void {
  getManager().closeAll();
}

export function updateFloaty<P>(id: string, patch: FloatyWidgetPatch<P>): void {
  getManager().update(id, patch);
}
