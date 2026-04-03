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
import { Floaty } from 'floaty-widget';
import 'floaty-widget/dist/style.css';

export function App() {
  return (
    <Floaty title="My Panel">
      <p>Your content here</p>
    </Floaty>
  );
}
```

## Props

All props are optional.

```tsx
interface FloatyProps {
  /** Content to display inside the floaty body */
  children?: ReactNode;

  /** Header title text */
  title?: string;

  /** Additional inline styles */
  style?: CSSProperties;
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

## Styling

The component uses CSS variables that you can customize:

```css
:root {
  --primary-color: #4f46e5;
  --primary-hover: #4338ca;
  --border-color: #e5e7eb;
  --shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
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
- ES module: `dist/floaty-widget.js`
- UMD bundle: `dist/floaty-widget.umd.cjs`
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
