<p align="center">
  <img src="https://raw.githubusercontent.com/ElJijuna/floaty-widget/main/public/assets/floaty.png" alt="Floaty Widget" width="128" />
</p>

# Floaty Widget

[![npm version](https://img.shields.io/npm/v/floaty-widget.svg)](https://www.npmjs.com/package/floaty-widget)
[![npm downloads](https://img.shields.io/npm/dm/floaty-widget.svg)](https://www.npmjs.com/package/floaty-widget)
[![CI](https://github.com/ElJijuna/floaty-widget/actions/workflows/ci.yml/badge.svg)](https://github.com/ElJijuna/floaty-widget/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/ElJijuna/floaty-widget.svg)](./LICENSE)

Draggable, collapsible, resizable floating widgets for React 19.

## Installation

```bash
npm install floaty-widget
```

## Usage modes

There are three ways to use Floaty, from simplest to most powerful.

---

### 1. Singleton — zero setup

Call `openFloaty` from anywhere. No Provider or Viewport needed — Floaty mounts its own root on the first call.

```tsx
import { openFloaty, closeFloaty } from 'floaty-widget';

function MyComponent({ userId }: { userId: string }) {
  return <div>User: {userId}</div>;
}

// Open a floating widget
openFloaty({
  id: 'user-panel',
  title: 'User Info',
  component: MyComponent,
  props: { userId: '123' },
});

// Close it
closeFloaty('user-panel');
```

Other singleton functions:

```ts
updateFloaty('user-panel', { collapsed: true });
closeAllFloaty();
```

---

### 2. Provider + hook — full control

Wrap your app with `FloatyProvider` and place `FloatyViewport` where widgets should render. Use `useFloaty()` to open widgets from any component.

```tsx
// main.tsx
import { FloatyProvider, FloatyViewport } from 'floaty-widget';

export function App() {
  return (
    <FloatyProvider>
      <Toolbar />
      <FloatyViewport />
    </FloatyProvider>
  );
}
```

```tsx
// Toolbar.tsx
import { useFloaty } from 'floaty-widget';
import { CommitsPanel } from './CommitsPanel';

function Toolbar() {
  const floaty = useFloaty();

  return (
    <button
      onClick={() =>
        floaty.open({
          id: 'commits',
          title: 'Commits',
          component: CommitsPanel,
          props: { repo: 'floaty-widget' },
        })
      }
    >
      Open commits
    </button>
  );
}
```

The manager exposes a full API:

```ts
floaty.open({ id, component, props, title, position, collapsed, pinned })
floaty.open({ id, loader: () => import('./HeavyPanel'), props })
floaty.close('commits')
floaty.closeAll()
floaty.update('commits', { collapsed: true, props: { repo: 'other' } })
floaty.updateProps('commits', { repo: 'other' })
floaty.bringToFront('commits')

// Bulk operations
floaty.collapseAll()
floaty.expandAll()
floaty.minimizeAll()
floaty.restoreAll()
floaty.pinAll()
floaty.unpinAll()

// Per-widget
floaty.collapseWidget('commits')
floaty.minimizeWidget('commits')
floaty.pinWidget('commits')
```

---

### 3. Singleton + Provider together

If you already use `FloatyProvider` but also want `openFloaty` to work in the same widget tree, add `useFloatySingleton()` once inside the Provider. The singleton will use your Provider's manager instead of creating its own.

```tsx
import { FloatyProvider, FloatyViewport, useFloatySingleton } from 'floaty-widget';

function FloatyBridge() {
  useFloatySingleton(); // connects openFloaty() to this Provider
  return null;
}

export function App() {
  return (
    <FloatyProvider>
      <FloatyBridge />
      <MyApp />
      <FloatyViewport />
    </FloatyProvider>
  );
}
```

```tsx
// Now openFloaty opens widgets inside your FloatyViewport
import { openFloaty } from 'floaty-widget';

openFloaty({ id: 'panel', component: MyPanel, props: {} });
```

---

### 4. Standalone `<Floaty>` component

Drop a `<Floaty>` directly anywhere for a self-contained floating panel with no manager. Double-clicking the header toggles collapse. The resize handle is opt-in from the header resize button, keeping the widget clean until the user wants to resize it.

```tsx
import { Floaty } from 'floaty-widget';

function App() {
  return (
    <>
      <MyApp />
      <Floaty title="Debug" initialPosition={{ x: 100, y: 100 }}>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </Floaty>
    </>
  );
}
```

### Lazy widget content

Use `loader` when a widget contains heavy code that should not be included in
the initial app bundle. The import starts only when the widget is rendered.

```tsx
floaty.open({
  id: 'heavy-panel',
  title: 'Heavy panel',
  loader: () => import('./HeavyPanel'),
  props: { repo: 'floaty-widget' },
  fallback: <span>Loading...</span>, // optional — a spinner is shown by default
});
```

If the loader rejects, Floaty shows an error state with a **Retry** button that
re-triggers the loader. No extra setup needed.

The loaded module can export the component as `default`. You can also return a
component directly from the loader.

```tsx
floaty.open({
  id: 'named-panel',
  loader: () => import('./panels').then((module) => module.NamedPanel),
  props: {},
});
```

---

## Widget preview

`FloatyPreview` renders a scaled-down live thumbnail of any widget registered in a
`FloatyWidgetManager`. Use it to build dock bars, widget pickers, thumbnail grids,
or any UI that needs a miniaturized view of a widget's content.

```tsx
import { FloatyProvider, FloatyViewport, FloatyPreview } from 'floaty-widget';

<FloatyProvider>
  <App />
  <FloatyViewport />

  {/* Renders a 40%-scale thumbnail of the widget with id "my-widget" */}
  <FloatyPreview
    id="my-widget"
    scale={0.4}
    style={{ width: 200, height: 120, borderRadius: 8, overflow: 'hidden' }}
    fallback={<span>Widget not open</span>}
  />
</FloatyProvider>
```

The component mounts a **separate instance** of the widget's component — external
state (context, stores) is reflected live, but internal `useState` is independent
from the real widget. Clicks and keyboard events on the thumbnail are suppressed
(`pointerEvents: none`).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | — | ID of the widget to preview |
| `scale` | `number` | `0.4` | Scale factor (e.g. `0.4` renders content at 40% of its natural size) |
| `fallback` | `ReactNode` | `null` | Rendered when the widget is not open or has no component |
| `className` | `string` | — | CSS class on the preview container |
| `style` | `CSSProperties` | — | Inline styles on the preview container (use this to set width/height) |

The preview container uses `overflow: hidden` automatically. Size it via `style`
so that `naturalWidth × scale` and `naturalHeight × scale` fit within the box.

---

## Floaty props

All props are optional.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `ReactNode` | `'Floaty'` | Header title |
| `children` | `ReactNode` | `'Content'` | Body content |
| `id` | `string` | — | Registers with `FloatyProvider` when provided |
| `initialPosition` | `{ x, y }` | `{ x: 100, y: 100 }` | Starting position — automatically clamped to viewport bounds |
| `initialSize` | `{ width?, height? }` | — | Starting size |
| `defaultCollapsed` | `boolean` | `false` | Start collapsed |
| `defaultMinimized` | `boolean` | `false` | Start hidden |
| `defaultPinned` | `boolean` | `false` | Start pinned (no drag) |
| `zIndex` | `number` | — | CSS z-index |
| `isActive` | `boolean` | `false` | Marks this widget as the front-most; reveals the header without requiring hover |
| `labels` | `Partial<FloatyTexts>` | — | Override button, resize, loading, and error labels |
| `icons` | `FloatyIcons` | — | Override button icons |
| `style` | `CSSProperties` | — | Root element styles |
| `className` | `string` | — | Root element class |
| `onClose` | `() => void` | — | Shows close button when provided |
| `onFocus` | `() => void` | — | Called on pointer down |

### Imperative ref

```tsx
import { useRef } from 'react';
import { Floaty, FloatyHandle } from 'floaty-widget';

const ref = useRef<FloatyHandle>(null);

<Floaty ref={ref}>content</Floaty>

ref.current.collapse()
ref.current.expand()
ref.current.toggle()
ref.current.minimize()
ref.current.restore()
ref.current.pin()
ref.current.unpin()
```

### Keyboard and viewport behavior

Floaty can be operated without a pointer:

- Focus the header and press `Enter` or `Space` to collapse/expand.
- Focus the header and use arrow keys to move the widget. Hold `Shift` for larger steps or `Alt` for 1px steps.
- Press the resize button in the header to reveal the resize handle.
- Focus the resize handle and use arrow keys to resize. Hold `Shift` for larger steps or `Alt` for 1px steps.

Widget positions are clamped into the visible viewport on initial render, during drag, and after viewport resize/orientation changes.

---

## Duplicate strategy

Control what happens when `open` is called with an existing id:

```ts
// Default: replace the widget
floaty.open({ id: 'panel', ... })

// Focus the existing one (restores if minimized)
floaty.open({ id: 'panel', ... }, { duplicateStrategy: 'focus' })

// Create a second instance with a unique id (panel-2, panel-3, ...)
floaty.open({ id: 'panel', ... }, { duplicateStrategy: 'duplicate' })
```

---

## Theming

Pass a `theme` object to `FloatyProvider` (or `FloatyWidgetManager`) to customize colors, spacing, and radius:

```tsx
<FloatyProvider
  theme={{
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    headerBackground: '#181825',
    headerForeground: '#cdd6f4',
    pinnedHeaderBackground: '#89b4fa',
    pinnedHeaderForeground: '#1e1e2e',
    border: '#313244',
    radius: '8px',
    shadow: '0 4px 24px rgba(0,0,0,0.4)',
  }}
>
  <FloatyViewport />
</FloatyProvider>
```

Or use CSS variables directly:

```css
:root {
  --floaty-bg: #1e1e2e;
  --floaty-fg: #cdd6f4;
  --floaty-header-bg: #181825;
  --floaty-header-fg: #cdd6f4;
  --floaty-pinned-header-bg: #89b4fa;
  --floaty-pinned-header-fg: #1e1e2e;
  --floaty-body-bg: #1e1e2e;
  --floaty-border: #313244;
  --floaty-pinned-border: #89b4fa;
  --floaty-radius: 8px;
  --floaty-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  --floaty-scrollbar-thumb: rgba(205, 214, 244, 0.34);
  --floaty-scrollbar-thumb-hover: rgba(205, 214, 244, 0.52);
  --floaty-scrollbar-track: rgba(30, 30, 46, 0.62);
  --floaty-drag-blur: 0.6px;
  --floaty-drag-opacity: 0.95;
  --floaty-font-family: inherit;
  --floaty-header-padding-block: 8px;
  --floaty-header-padding-inline: 12px;
  --floaty-body-padding: 12px;
  --floaty-button-radius: 4px;
  --floaty-button-hover-bg: rgba(255, 255, 255, 0.1);
}
```

When widget content overflows, `.floaty-body` uses a themed thin native scrollbar. Override `--floaty-scrollbar-thumb`, `--floaty-scrollbar-thumb-hover`, or `--floaty-scrollbar-track` to tune that overflow treatment.

### Custom icons

```tsx
import { Pin, PinFilled } from './icons';

<FloatyProvider
  icons={{
    pin: Pin,
    unpin: PinFilled,
    collapse: ChevronUp,
    expand: ChevronDown,
    minimize: Minus,
    resize: Maximize,
    close: X,
  }}
>
  <FloatyViewport />
</FloatyProvider>
```

### Custom labels

```tsx
<FloatyProvider
  labels={{
    pin: 'Fijar',
    unpin: 'Desfijar',
    collapse: 'Colapsar',
    expand: 'Expandir',
    minimize: 'Minimizar',
    restore: 'Restaurar',
    close: 'Cerrar',
    resize: 'Cambiar tamano',
    loading: 'Cargando panel...',
    loadError: 'No se pudo cargar el panel',
    retry: 'Reintentar',
  }}
>
  <FloatyViewport />
</FloatyProvider>
```

---

## Development

```bash
npm install
npm run dev          # dev server
npm run storybook    # component stories at localhost:6006
npm test             # run tests
npm run bench        # benchmarks
npm run build        # build library
```

## Releases

This project uses [Semantic Release](https://semantic-release.gitbook.io) with [Conventional Commits](https://www.conventionalcommits.org). Push to `main` to trigger an automatic release:

| Commit prefix | Version bump |
| --- | --- |
| `fix: ...` | patch — `0.1.0 → 0.1.1` |
| `feat: ...` | minor — `0.1.0 → 0.2.0` |
| `feat!: ...` or `fix!: ...` | major — `0.1.0 → 1.0.0` |

## License

MIT © [ElJijuna](https://github.com/ElJijuna)
