# Floaty Widget Store

`FloatyWidgetManager` is the provider behind the widget store. It is also exported as `FloatyProvider`.

The core idea is simple: call `open()` with a React component and the props it should receive. `FloatyViewport` renders every active widget as an independent floating window.

## Basic Usage

```tsx
import { FloatyProvider, FloatyViewport, useFloaty } from 'floaty-widget';

function Commits({ owner, repo }: { owner: string; repo: string }) {
  return <div>{owner}/{repo}</div>;
}

function Toolbar() {
  const floaty = useFloaty();

  return (
    <button
      onClick={() =>
        floaty.open({
          id: 'commits-gnome-ui',
          title: 'Commits',
          component: Commits,
          props: { owner: 'eljijuna', repo: 'gnome-ui' },
          position: { x: 80, y: 80 },
        })
      }
    >
      Open commits
    </button>
  );
}

export function App() {
  return (
    <FloatyProvider>
      <Toolbar />
      <FloatyViewport />
    </FloatyProvider>
  );
}
```

## API

```tsx
const floaty = useFloaty();

floaty.open({
  id: 'commits',
  title: 'Commits',
  component: Commits,
  props: { owner: 'eljijuna', repo: 'gnome-ui' },
});

floaty.updateProps('commits', {
  owner: 'eljijuna',
  repo: 'floaty-widget',
});

floaty.collapseWidget('commits');
floaty.expandWidget('commits');
floaty.pinWidget('commits');
floaty.unpinWidget('commits');
floaty.bringToFront('commits');
floaty.close('commits');
```

Global actions are also available:

```tsx
floaty.expandAll();
floaty.collapseAll();
floaty.pinAll();
floaty.unpinAll();
floaty.closeAll();
```

## Duplicate IDs

`open()` replaces an existing widget by default. You can change that behavior:

```tsx
floaty.open(widget, { duplicateStrategy: 'focus' });
floaty.open(widget, { duplicateStrategy: 'duplicate' });
floaty.open(widget, { duplicateStrategy: 'replace' });
```

## Custom Labels, Icons And Theme

```tsx
<FloatyProvider
  labels={{
    pin: 'Fijar',
    unpin: 'Desfijar',
    collapse: 'Colapsar',
    expand: 'Expandir',
    close: 'Cerrar',
  }}
  icons={{
    close: CloseIcon,
  }}
  theme={{
    background: 'var(--panel)',
    foreground: 'var(--panel-foreground)',
    headerBackground: 'var(--primary)',
    headerForeground: 'var(--primary-foreground)',
    border: 'var(--border)',
    radius: '10px',
  }}
>
  <FloatyViewport />
</FloatyProvider>
```

You can also override the CSS variables directly:

```css
:root {
  --floaty-bg: white;
  --floaty-fg: #374151;
  --floaty-header-bg: #4f46e5;
  --floaty-header-bg-hover: #4338ca;
  --floaty-header-fg: white;
  --floaty-border: #e5e7eb;
  --floaty-radius: 8px;
  --floaty-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
```

## Types

```tsx
import type {
  FloatyOpenWidget,
  FloatyWidget,
  FloatyWidgetManagerHandle,
  FloatyWidgetState,
} from 'floaty-widget';
```

The widget store keeps component references in memory. Persist layout state if needed, but do not try to serialize the component itself.
