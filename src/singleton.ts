import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { FloatyWidgetManager } from './context/FloatyWidgetManager';
import type {
  FloatyWidgetManagerHandle,
  FloatyOpenWidget,
  FloatyOpenOptions,
  FloatyWidgetPatch,
} from './types';
import { FloatyViewport } from './components/Floaty/FloatyViewport';

let getExternalManager: (() => FloatyWidgetManagerHandle) | null = null;
const ownRef: { current: FloatyWidgetManagerHandle | null } = { current: null };

/**
 * Connects an external `FloatyWidgetManagerHandle` to the singleton so that
 * `openFloaty`, `closeFloaty`, etc. delegate to it instead of creating their own root.
 *
 * Call this inside a `useEffect` with the manager from `useFloatyWidgetManager()`,
 * or use the `useFloatySingleton` hook which does this automatically.
 *
 * Pass `null` to disconnect (e.g. on unmount).
 */
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

/**
 * Opens a widget without needing a React context.
 * If no `FloatyWidgetManager` is connected via `useFloatySingleton`, a new React root
 * is automatically created and appended to `document.body`.
 *
 * @returns The id of the opened widget.
 */
export function openFloaty<P>(widget: FloatyOpenWidget<P>, options?: FloatyOpenOptions): string {
  return getManager().open(widget, options);
}

/**
 * Closes a widget by id without needing a React context.
 * @param id - The id of the widget to close.
 */
export function closeFloaty(id: string): void {
  getManager().close(id);
}

/** Closes all open widgets without needing a React context. */
export function closeAllFloaty(): void {
  getManager().closeAll();
}

/**
 * Applies a partial update to an existing widget without needing a React context.
 * @param id - The id of the widget to update.
 * @param patch - Fields to update.
 */
export function updateFloaty<P>(id: string, patch: FloatyWidgetPatch<P>): void {
  getManager().update(id, patch);
}
