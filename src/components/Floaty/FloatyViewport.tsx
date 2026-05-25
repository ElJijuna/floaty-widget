import { ComponentType, CSSProperties, createElement } from 'react';
import { Floaty } from './Floaty';
import { useFloatyWidgetManager } from '../../context/FloatyWidgetManager';

/** Props for the `<FloatyViewport>` component. */
export interface FloatyViewportProps {
  /** Additional CSS class applied to every widget rendered by this viewport. */
  className?: string;
  /** Inline styles applied to every widget rendered by this viewport. */
  style?: CSSProperties;
}

/**
 * Renders all widgets currently registered in the nearest `FloatyWidgetManager`.
 *
 * Place this once in your app — typically at the root level, outside your main layout —
 * so widgets float above all other content.
 *
 * @example
 * ```tsx
 * <FloatyWidgetManager>
 *   <App />
 *   <FloatyViewport />
 * </FloatyWidgetManager>
 * ```
 */
export const FloatyViewport = ({ className, style }: FloatyViewportProps) => {
  const manager = useFloatyWidgetManager();

  const themeStyle = {
    '--floaty-bg': manager.theme?.background,
    '--floaty-fg': manager.theme?.foreground,
    '--floaty-header-bg': manager.theme?.headerBackground,
    '--floaty-header-bg-hover':
      manager.theme?.headerBackgroundHover ?? manager.theme?.headerBackground,
    '--floaty-header-fg': manager.theme?.headerForeground,
    '--floaty-pinned-header-bg': manager.theme?.pinnedHeaderBackground,
    '--floaty-pinned-header-bg-hover':
      manager.theme?.pinnedHeaderBackgroundHover ??
      manager.theme?.pinnedHeaderBackground,
    '--floaty-pinned-header-fg': manager.theme?.pinnedHeaderForeground,
    '--floaty-body-bg': manager.theme?.bodyBackground,
    '--floaty-border': manager.theme?.border,
    '--floaty-pinned-border': manager.theme?.pinnedBorder,
    '--floaty-radius': manager.theme?.radius,
    '--floaty-shadow': manager.theme?.shadow,
    '--floaty-font-family': manager.theme?.fontFamily,
    '--floaty-header-padding-block': manager.theme?.headerPaddingBlock,
    '--floaty-header-padding-inline': manager.theme?.headerPaddingInline,
    '--floaty-body-padding': manager.theme?.bodyPadding,
    '--floaty-button-radius': manager.theme?.buttonRadius,
    '--floaty-button-hover-bg': manager.theme?.buttonHoverBackground,
  } as CSSProperties;

  return (
    <>
      {Array.from(manager.widgets.values()).map((widget) => {
        if (!widget.component) return null;

        const WidgetComponent = widget.component;
        if (widget.isMinimized) return null;

        const widgetStyle: CSSProperties = {
          ...themeStyle,
          ...style,
        };

        return (
          <Floaty
            key={widget.id}
            id={widget.id}
            title={widget.title}
            className={[className, widget.className].filter(Boolean).join(' ')}
            style={widgetStyle}
            labels={manager.labels}
            icons={manager.icons}
            defaultCollapsed={widget.isCollapsed}
            defaultMinimized={widget.isMinimized}
            defaultPinned={widget.isPinned}
            initialPosition={widget.position}
            initialSize={widget.size}
            zIndex={widget.zIndex}
            onClose={() => manager.close(widget.id)}
            onFocus={() => manager.bringToFront(widget.id)}
          >
            {createElement(
              WidgetComponent as ComponentType<any>,
              widget.props as any
            )}
          </Floaty>
        );
      })}
    </>
  );
};
