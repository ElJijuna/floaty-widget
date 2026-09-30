import type { KeyboardEvent as ReactKeyboardEvent, SetStateAction } from 'react';

/**
 * Finds the window whose title bar is the topmost thing under the pointer, ignoring `self`.
 * A title bar covered by another window's body is not a target.
 */
export const findMergeTarget = (
  x: number,
  y: number,
  self: HTMLElement | null,
): HTMLElement | null => {
  if (typeof document.elementsFromPoint !== 'function') {
    return null;
  }

  for (const element of document.elementsFromPoint(x, y)) {
    if (self?.contains(element)) {
      continue;
    }

    const root = element.closest<HTMLElement>('.floaty--window[data-floaty-id]');

    if (root && !root.hidden && element.closest('.floaty-header')) {
      return root;
    }

    if (element.closest('.floaty')) {
      return null;
    }
  }

  return null;
};

export const resolveStateAction = <T>(action: SetStateAction<T>, previous: T): T =>
  typeof action === 'function' ? (action as (value: T) => T)(previous) : action;

export const getKeyboardStep = (
  e: ReactKeyboardEvent<HTMLElement>,
  baseStep: number,
  largeStep: number,
) => {
  if (e.altKey) {
    return 1;
  }

  if (e.shiftKey) {
    return largeStep;
  }

  return baseStep;
};
