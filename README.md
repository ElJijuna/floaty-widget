# Floaty Widget

A beautiful, draggable, and collapsible floating widget library built with React 19, TypeScript, and Vite.

## Features

✨ **Draggable Header** - Click and drag the header to move the component anywhere on the screen
📍 **Pin/Unpin** - Lock the component in place with the pin button to prevent dragging
🔽 **Expand/Collapse** - Smooth animations when toggling content visibility
🎨 **Customizable** - Flexible styling with CSS variables and inline styles
📱 **Responsive** - Works seamlessly on different screen sizes
♿ **Accessible** - Built with ARIA labels and semantic HTML
🚀 **Optimized** - Tree-shaking enabled, minimal bundle size

## Installation

```bash
npm install floaty-widget
```

## Usage

```tsx
import { FloatyProvider, FloatyViewport, useFloaty } from 'floaty-widget';
import 'floaty-widget/dist/style.css';

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

You can still use `Floaty` directly for a standalone draggable panel:

```tsx
import { Floaty } from 'floaty-widget';

<Floaty title="My Panel">
  <p>Your content here</p>
</Floaty>
```

## Floaty Props

All props are optional.

```tsx
interface FloatyProps {
  children?: ReactNode;
  title?: ReactNode;
  style?: CSSProperties;
  className?: string;
  id?: string;
  labels?: Partial<FloatyTexts>;
  icons?: FloatyIcons;
  defaultCollapsed?: boolean;
  defaultPinned?: boolean;
  initialPosition?: { x: number; y: number };
  zIndex?: number;
  onClose?: () => void;
}
```

### Default Values

- `children`: `'Content'`
- `title`: `'Floaty'`
- `style`: `{}`

## Examples

### Basic Usage

```tsx
<Floaty title="Dashboard">
  <div>
    <h3>Welcome!</h3>
    <p>This is a floating panel.</p>
  </div>
</Floaty>
```

### With Custom Styling

```tsx
<Floaty
  title="Settings"
  style={{ width: '400px' }}
>
  <form>
    {/* Your form content */}
  </form>
</Floaty>
```

### With Complex Content

```tsx
<Floaty title="User Info">
  <div>
    <img src="avatar.jpg" alt="User" />
    <h4>John Doe</h4>
    <p>john@example.com</p>
    <button>View Profile</button>
  </div>
</Floaty>
```

## Features in Detail

### 🖱️ Dragging

Click and hold the header to drag the component around. The component will stay within viewport boundaries automatically.

### 📍 Pin/Unpin

Click the pin icon (📍) in the header to lock the component. When pinned (📌), the component cannot be dragged but can still be collapsed/expanded.

### ➖ Expand/Collapse

Click the chevron icon in the top-right to toggle content visibility. The animation is smooth with spring easing.

## Widget Store

Manage floating widgets from a single provider. The store keeps the component type and the props captured when `open` is called.

```tsx
import { FloatyProvider, FloatyViewport, useFloaty } from 'floaty-widget';

function ControlPanel() {
  const floaty = useFloaty();

  return (
    <div>
      <button onClick={() => floaty.expandAll()}>Expand All</button>
      <button onClick={() => floaty.collapseAll()}>Collapse All</button>
      <button onClick={() => floaty.pinAll()}>Pin All</button>
      <button onClick={() => floaty.unpinAll()}>Unpin All</button>
    </div>
  );
}

export function App() {
  return (
    <FloatyProvider>
      <ControlPanel />
      <FloatyViewport />
    </FloatyProvider>
  );
}
```

**Features:**
- Open app components as independent floating widgets
- Capture props at the moment the widget is opened
- Update props later with `updateProps(id, props)`
- Control expand/collapse, pin/unpin, close and z-order
- Customize tokens, labels and icons

See [WIDGET_MANAGER.md](./WIDGET_MANAGER.md) for detailed documentation.

## Styling

Floaty uses `@gnome-ui/react` / `@gnome-ui/core` tokens by default when they are present, then exposes `--floaty-*` aliases for local overrides.

```tsx
import '@gnome-ui/core/src/tokens.css';
import { GnomeProvider } from '@gnome-ui/react';
import { FloatyProvider, FloatyViewport } from 'floaty-widget';

<GnomeProvider colorScheme="system" accentColor="purple">
  <FloatyProvider>
    <FloatyViewport />
  </FloatyProvider>
</GnomeProvider>
```

You can also map provider theme values to GNOME tokens:

```tsx
<FloatyProvider
  theme={{
    background: 'var(--gnome-card-bg-color)',
    foreground: 'var(--gnome-card-fg-color)',
    bodyBackground: 'var(--gnome-view-bg-color)',
    headerBackground: 'var(--gnome-headerbar-bg-color)',
    headerForeground: 'var(--gnome-headerbar-fg-color)',
    pinnedHeaderBackground: 'var(--gnome-accent-bg-color)',
    pinnedHeaderForeground: 'var(--gnome-accent-fg-color)',
    border: 'var(--gnome-headerbar-border-color)',
    radius: 'var(--gnome-radius-lg)',
    shadow: 'var(--gnome-shadow-md)',
    fontFamily: 'var(--gnome-font-family)',
  }}
>
  <FloatyViewport />
</FloatyProvider>
```

The component uses CSS variables that you can customize directly:

```css
:root {
  --floaty-bg: var(--gnome-card-bg-color);
  --floaty-fg: var(--gnome-card-fg-color);
  --floaty-header-bg: var(--gnome-headerbar-bg-color);
  --floaty-header-fg: var(--gnome-headerbar-fg-color);
  --floaty-pinned-header-bg: var(--gnome-accent-bg-color);
  --floaty-pinned-header-fg: var(--gnome-accent-fg-color);
  --floaty-border: var(--gnome-headerbar-border-color);
  --floaty-radius: var(--gnome-radius-lg);
  --floaty-shadow: var(--gnome-shadow-md);
}
```

## Development

### Setup

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Storybook

```bash
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006) to view the component stories.

### Build

```bash
npm run build
```

Generates:
- ES module: `dist/index.es.js`
- UMD bundle: `dist/index.umd.cjs`
- CSS: `dist/style.css`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- **Optimized dragging** with global event listeners to prevent jank
- **Tree-shaking enabled** for smaller bundle sizes
- **CSS animations** for smooth expand/collapse transitions
- **Viewport constraints** to prevent layout shifts

## Accessibility

- ♿ ARIA labels on interactive elements
- ⌨️ Keyboard accessible buttons
- 📱 Touch-friendly hit targets
- 🎯 Semantic HTML structure

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import { Floaty, FloatyProps } from 'floaty-widget';

const MyComponent: React.FC<FloatyProps> = (props) => {
  return <Floaty {...props} />;
};
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Publishing & Releases

This project uses **Semantic Versioning** and **Changesets** for automated releases:

- **Storybook** is automatically deployed to GitHub Pages on each release
- **npm** publication is automated with semantic version bumping

### How to Create a Release

1. Create a changeset:
   ```bash
   npm exec changeset
   ```

2. Commit and push:
   ```bash
   git add .
   git commit -m "chore: add changeset"
   git push
   ```

3. A release PR will be created automatically
4. Merge the release PR to trigger:
   - npm publish with new version
   - Storybook deployment to GitHub Pages

See [GITHUB_SECRETS.md](./GITHUB_SECRETS.md) for configuration details.

## License

MIT © 2024

---

**Built with** ❤️ using React 19, TypeScript, and Vite
