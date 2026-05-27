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

floaty.open({
  id: 'heavy-commits',
  title: 'Heavy Commits',
  loader: () => import('./HeavyCommits'),
  props: { owner: 'eljijuna', repo: 'floaty-widget' },
  fallback: <span>Loading...</span>,
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

Floaty automatically falls back to GNOME UI tokens when `@gnome-ui/core` tokens are loaded.

```tsx
import '@gnome-ui/core/src/tokens.css';
import { GnomeProvider } from '@gnome-ui/react';
import { FloatyProvider, FloatyViewport } from 'floaty-widget';

<GnomeProvider colorScheme="system" accentColor="green">
  <FloatyProvider>
    <FloatyViewport />
  </FloatyProvider>
</GnomeProvider>
```

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
    background: 'var(--gnome-card-bg-color)',
    foreground: 'var(--gnome-card-fg-color)',
    bodyBackground: 'var(--gnome-view-bg-color)',
    headerBackground: 'var(--gnome-headerbar-bg-color)',
    headerForeground: 'var(--gnome-headerbar-fg-color)',
    pinnedHeaderBackground: 'var(--gnome-accent-bg-color)',
    pinnedHeaderForeground: 'var(--gnome-accent-fg-color)',
    border: 'var(--gnome-card-shade-color)',
    pinnedBorder: 'var(--gnome-card-shade-color)',
    radius: 'var(--gnome-radius-lg)',
    shadow: 'var(--gnome-shadow-md)',
    fontFamily: 'var(--gnome-font-family)',
  }}
>
  <FloatyViewport />
</FloatyProvider>
```

You can also override the CSS variables directly:

```css
:root {
  --floaty-bg: var(--gnome-card-bg-color);
  --floaty-fg: var(--gnome-card-fg-color);
  --floaty-header-bg: var(--gnome-headerbar-bg-color);
  --floaty-header-fg: var(--gnome-headerbar-fg-color);
  --floaty-pinned-header-bg: var(--gnome-accent-bg-color);
  --floaty-pinned-header-fg: var(--gnome-accent-fg-color);
  --floaty-border: var(--gnome-card-shade-color);
  --floaty-pinned-border: var(--gnome-card-shade-color);
  --floaty-radius: var(--gnome-radius-lg);
  --floaty-shadow: var(--gnome-shadow-md);
}
```

## Types

```tsx
import type {
  FloatyComponentLoader,
  FloatyOpenWidget,
  FloatyWidget,
  FloatyWidgetManagerHandle,
  FloatyWidgetState,
} from 'floaty-widget';
```

The widget store keeps component references in memory. Persist layout state if needed, but do not try to serialize the component itself.
