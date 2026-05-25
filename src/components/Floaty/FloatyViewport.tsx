import { ComponentType, CSSProperties, createElement } from 'react';
import { Floaty } from './Floaty';
import { useFloatyWidgetManager } from '../../context/FloatyWidgetManager';

export interface FloatyViewportProps {
  className?: string;
  style?: CSSProperties;
}

export const FloatyViewport = ({ className, style }: FloatyViewportProps) => {
  const manager = useFloatyWidgetManager();

  const themeStyle = {
    '--floaty-bg': manager.theme?.background,
    '--floaty-fg': manager.theme?.foreground,
    '--floaty-header-bg': manager.theme?.headerBackground,
    '--floaty-header-bg-hover': manager.theme?.headerBackground,
    '--floaty-header-fg': manager.theme?.headerForeground,
    '--floaty-pinned-header-bg': manager.theme?.pinnedHeaderBackground,
    '--floaty-pinned-header-bg-hover': manager.theme?.pinnedHeaderBackground,
    '--floaty-border': manager.theme?.border,
    '--floaty-radius': manager.theme?.radius,
    '--floaty-shadow': manager.theme?.shadow,
    '--floaty-font-family': manager.theme?.fontFamily,
  } as CSSProperties;

  return (
    <>
      {Array.from(manager.widgets.values()).map((widget) => {
        if (!widget.component) return null;

        const WidgetComponent = widget.component;
        const widgetStyle: CSSProperties = {
          ...themeStyle,
          ...style,
          width: widget.size?.width,
          height: widget.size?.height,
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
            defaultPinned={widget.isPinned}
            initialPosition={widget.position}
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
