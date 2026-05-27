import {
  Component,
  ComponentType,
  CSSProperties,
  ReactNode,
  Suspense,
  createElement,
  memo,
  useMemo,
} from 'react';
import { Floaty } from './Floaty';
import {
  useFloatyWidgetManager,
  type FloatyIcons,
  type FloatyTexts,
  type FloatyWidget,
} from '../../context/FloatyWidgetManager';

/** Props for the `<FloatyViewport>` component. */
export interface FloatyViewportProps {
  /** Additional CSS class applied to every widget rendered by this viewport. */
  className?: string;
  /** Inline styles applied to every widget rendered by this viewport. */
  style?: CSSProperties;
}

interface FloatyViewportItemProps {
  widget: FloatyWidget;
  className?: string;
  style?: CSSProperties;
  themeStyle: CSSProperties;
  labels: FloatyTexts;
  icons: FloatyIcons;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  onRetry: (widget: FloatyWidget) => void;
  isActive: boolean;
}

const DefaultLazyFallback = ({ label }: { label: string }) => (
  <div className="floaty-loading" role="status" aria-live="polite">
    <span className="floaty-loading-spinner" />
    <span>{label}</span>
  </div>
);

interface LazyErrorBoundaryProps {
  children: ReactNode;
  onRetry: () => void;
  labels: FloatyTexts;
}

interface LazyErrorBoundaryState {
  error: Error | null;
}

class LazyErrorBoundary extends Component<
  LazyErrorBoundaryProps,
  LazyErrorBoundaryState
> {
  state: LazyErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  retry = () => {
    this.setState({ error: null });
    this.props.onRetry();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="floaty-error" role="alert">
          <strong>{this.props.labels.loadError}</strong>
          <span>{this.state.error.message}</span>
          <button type="button" onClick={this.retry}>
            {this.props.labels.retry}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const FloatyViewportItem = memo(
  ({
    widget,
    className,
    style,
    themeStyle,
    labels,
    icons,
    onClose,
    onFocus,
    onRetry,
    isActive,
  }: FloatyViewportItemProps) => {
    if (!widget.component || widget.isMinimized) return null;

    const WidgetComponent = widget.component;
    const content = createElement(
      WidgetComponent as ComponentType<any>,
      widget.props as any
    );
    const widgetStyle: CSSProperties = {
      ...themeStyle,
      ...style,
    };

    return (
      <Floaty
        id={widget.id}
        title={widget.title}
        className={[className, widget.className].filter(Boolean).join(' ')}
        style={widgetStyle}
        labels={labels}
        icons={icons}
        defaultCollapsed={widget.isCollapsed}
        defaultMinimized={widget.isMinimized}
        defaultPinned={widget.isPinned}
        initialPosition={widget.position}
        initialSize={widget.size}
        zIndex={widget.zIndex}
        isActive={isActive}
        onClose={() => onClose(widget.id)}
        onFocus={() => onFocus(widget.id)}
      >
        {widget.loader ? (
          <LazyErrorBoundary labels={labels} onRetry={() => onRetry(widget)}>
            <Suspense
              fallback={widget.fallback ?? <DefaultLazyFallback label={labels.loading} />}
            >
              {content}
            </Suspense>
          </LazyErrorBoundary>
        ) : (
          content
        )}
      </Floaty>
    );
  }
);

FloatyViewportItem.displayName = 'FloatyViewportItem';

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
  const widgets = Array.from(manager.widgets.values());
  const activeZIndex = Math.max(
    0,
    ...widgets
      .filter((widget) => !widget.isMinimized)
      .map((widget) => widget.zIndex)
  );

  const themeStyle = useMemo(
    () =>
      ({
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
      }) as CSSProperties,
    [manager.theme]
  );

  return (
    <>
      {widgets.map((widget) => {
        return (
          <FloatyViewportItem
            key={widget.id}
            widget={widget}
            className={className}
            style={style}
            themeStyle={themeStyle}
            labels={manager.labels}
            icons={manager.icons}
            onClose={manager.close}
            onFocus={manager.bringToFront}
            onRetry={(retryWidget) => {
              if (retryWidget.loader) {
                manager.update(retryWidget.id, { loader: retryWidget.loader });
              }
            }}
            isActive={widget.zIndex === activeZIndex}
          />
        );
      })}
    </>
  );
};
