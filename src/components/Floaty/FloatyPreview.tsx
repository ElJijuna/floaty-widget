import { createElement, ComponentType, CSSProperties, ReactNode, Suspense } from 'react';
import { useFloatyManager } from '../../context/FloatyWidgetManager';

/** Props for the `<FloatyPreview>` component. */
export interface FloatyPreviewProps {
  /** ID of the widget to preview — must be registered in the nearest `FloatyWidgetManager`. */
  id: string;
  /** Scale factor applied to the widget content. @default 0.4 */
  scale?: number;
  /** Rendered when the widget does not exist, has no component, or there is no manager. */
  fallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a scaled-down live thumbnail of a widget registered in `FloatyWidgetManager`.
 *
 * The widget component is mounted as an independent instance — it reflects external state
 * (context, stores) in real time, but internal `useState` is separate from the real widget.
 */
export const FloatyPreview = ({
  id,
  scale = 0.4,
  fallback = null,
  className,
  style,
}: FloatyPreviewProps) => {
  const manager = useFloatyManager();
  const widget = manager?.getWidget(id);

  if (!widget?.component) return <>{fallback}</>;

  const content = createElement(
    widget.component as ComponentType<unknown>,
    widget.props as Record<string, unknown>
  );

  return (
    <div className={className} style={{ overflow: 'hidden', ...style }}>
      <div
        aria-hidden="true"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {widget.loader ? <Suspense>{content}</Suspense> : content}
      </div>
    </div>
  );
};
