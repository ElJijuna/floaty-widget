import { useContext } from 'react';
import { FloatyManagerContext } from '../context/FloatyWidgetManager';

/**
 * Returns the `FloatyWidgetManagerHandle` from context, or `null` if used outside a provider.
 * Prefer `useFloatyWidgetManager` in most cases — this variant is useful when the provider is optional.
 */
export const useFloatyManager = () => {
  return useContext(FloatyManagerContext);
};

/**
 * Returns the `FloatyWidgetManagerHandle` from the nearest `FloatyWidgetManager` provider.
 * @throws If called outside of a `FloatyWidgetManager`.
 */
export const useFloatyWidgetManager = () => {
  const manager = useContext(FloatyManagerContext);

  if (!manager) {
    throw new Error(
      'useFloatyWidgetManager must be used within FloatyWidgetManager'
    );
  }

  return manager;
};

/**
 * Returns the current state of a single widget by id, or `undefined` if it does not exist.
 * Re-renders whenever the widget state changes.
 *
 * @param id - The widget id to observe.
 */
export const useFloatyWidget = (id: string) => {
  const manager = useFloatyWidgetManager();
  return manager.getWidget(id);
};

/** Alias for `useFloatyWidgetManager`. */
export const useFloaty = useFloatyWidgetManager;
