import { Button } from '@gnome-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Floaty, type FloatyProps } from '../components/Floaty/Floaty';
import type { FloatyControlledState } from '../types';
import {
  ActivityContent,
  ButtonRow,
  SettingsContent,
  StateGrid,
  StoryHint,
  Surface,
} from './shared';

/** Flattened geometry args so position and size are editable as plain number controls. */
type WidgetArgs = FloatyProps & {
  x: number;
  y: number;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  closable: boolean;
};

/**
 * Props that only apply on mount. Changing them from the Controls panel remounts the widget
 * so the new value is visible immediately.
 */
const mountKey = (args: WidgetArgs) =>
  JSON.stringify([
    args.mode,
    args.x,
    args.y,
    args.width,
    args.height,
    args.defaultCollapsed,
    args.defaultPinned,
    args.defaultMaximized,
    args.persistenceKey,
  ]);

const WidgetRender = ({
  x,
  y,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  closable,
  onClose,
  ...props
}: WidgetArgs) => {
  const [closed, setClosed] = useState(false);

  if (closed) {
    return (
      <div style={{ position: 'fixed', top: 16, left: 16 }}>
        <Button variant="suggested" onClick={() => setClosed(false)}>
          Reopen widget
        </Button>
      </div>
    );
  }

  return (
    <Floaty
      key={mountKey({ x, y, width, height, closable, ...props })}
      {...props}
      initialPosition={{ x, y }}
      initialSize={width || height ? { width, height } : undefined}
      sizeConstraints={{ minWidth, minHeight, maxWidth, maxHeight }}
      onClose={
        closable
          ? () => {
              onClose?.();
              setClosed(true);
            }
          : undefined
      }
    >
      {props.mode === 'window' ? props.children : <Surface>{props.children}</Surface>}
    </Floaty>
  );
};

const meta = {
  title: 'Floaty/Widget',
  component: Floaty,
  tags: ['autodocs'],
  render: (args) => <WidgetRender {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          'A draggable, collapsible and pinnable widget. `mode="floating"` shows the header on hover; `mode="window"` renders a desktop-style window with an integrated title bar, eight resize zones, maximize and edge snapping. Every prop below is editable from the **Controls** panel and every callback is logged in **Actions**.',
      },
    },
  },
  args: {
    title: 'Floaty',
    children: 'Drag me around! Click the icons to pin or collapse.',
    mode: 'floating',
    windowStyle: 'windows',
    x: 100,
    y: 100,
    closable: true,
    defaultCollapsed: false,
    defaultPinned: false,
    defaultMaximized: false,
    snap: true,
    snapThreshold: 28,
    isActive: true,
    autoFocus: false,
    restoreFocus: true,
    onClose: fn(),
    onFocus: fn(),
    onFocusChange: fn(),
    onResizeStart: fn(),
    onResize: fn(),
    onResizeEnd: fn(),
    onPositionChange: fn(),
    onMaximizeChange: fn(),
  },
  argTypes: {
    title: { control: 'text', table: { category: 'Content' } },
    children: { control: 'text', table: { category: 'Content' } },
    mode: {
      control: 'inline-radio',
      options: ['floating', 'window'],
      table: { category: 'Appearance' },
    },
    windowStyle: {
      control: 'inline-radio',
      options: ['windows', 'mac', 'custom'],
      description: 'Title bar chrome. Only applies when `mode` is `window`.',
      if: { arg: 'mode', eq: 'window' },
      table: { category: 'Appearance' },
    },
    isActive: { control: 'boolean', table: { category: 'Appearance' } },
    className: { control: 'text', table: { category: 'Appearance' } },
    x: {
      control: { type: 'number', step: 10 },
      description: 'Maps to `initialPosition.x`.',
      table: { category: 'Geometry' },
    },
    y: {
      control: { type: 'number', step: 10 },
      description: 'Maps to `initialPosition.y`.',
      table: { category: 'Geometry' },
    },
    width: {
      control: { type: 'number', step: 10 },
      description: 'Maps to `initialSize.width`.',
      table: { category: 'Geometry' },
    },
    height: {
      control: { type: 'number', step: 10 },
      description: 'Maps to `initialSize.height`.',
      table: { category: 'Geometry' },
    },
    minWidth: {
      control: { type: 'number', step: 10 },
      description: 'Maps to `sizeConstraints.minWidth`.',
      table: { category: 'Geometry' },
    },
    minHeight: {
      control: { type: 'number', step: 10 },
      description: 'Maps to `sizeConstraints.minHeight`.',
      table: { category: 'Geometry' },
    },
    maxWidth: {
      control: { type: 'number', step: 10 },
      description: 'Maps to `sizeConstraints.maxWidth`.',
      table: { category: 'Geometry' },
    },
    maxHeight: {
      control: { type: 'number', step: 10 },
      description: 'Maps to `sizeConstraints.maxHeight`.',
      table: { category: 'Geometry' },
    },
    defaultCollapsed: { control: 'boolean', table: { category: 'Initial state' } },
    defaultPinned: { control: 'boolean', table: { category: 'Initial state' } },
    defaultMaximized: {
      control: 'boolean',
      if: { arg: 'mode', eq: 'window' },
      table: { category: 'Initial state' },
    },
    defaultMinimized: { control: false, table: { category: 'Initial state' } },
    persistenceKey: {
      control: 'text',
      description: 'Set a key, move the widget, then reload the story: geometry is restored.',
      table: { category: 'Initial state' },
    },
    snap: {
      control: 'boolean',
      if: { arg: 'mode', eq: 'window' },
      table: { category: 'Behavior' },
    },
    snapThreshold: {
      control: { type: 'range', min: 4, max: 120, step: 4 },
      if: { arg: 'mode', eq: 'window' },
      table: { category: 'Behavior' },
    },
    closable: {
      control: 'boolean',
      description: 'Story helper: passes `onClose`, which renders the close button.',
      table: { category: 'Behavior' },
    },
    autoFocus: { control: 'boolean', table: { category: 'Accessibility' } },
    restoreFocus: { control: 'boolean', table: { category: 'Accessibility' } },
    labels: { control: 'object', table: { category: 'Accessibility' } },
    initialPosition: { table: { disable: true } },
    initialSize: { table: { disable: true } },
    sizeConstraints: { table: { disable: true } },
    value: { table: { disable: true } },
    onValueChange: { table: { disable: true } },
    style: { table: { disable: true } },
    icons: { table: { disable: true } },
    windowIcon: { table: { disable: true } },
    zIndex: { table: { disable: true } },
    id: { table: { disable: true } },
  },
} satisfies Meta<WidgetArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Floating mode: the header appears on hover or focus. Use the arrow keys on the focused header to move it, and the resize button to resize from the keyboard.',
      },
    },
  },
};

export const WindowMode: Story = {
  args: {
    mode: 'window',
    title: 'Settings',
    children: <SettingsContent />,
    x: 120,
    y: 90,
    width: 460,
    height: 300,
  },
  render: (args) => (
    <>
      <StoryHint
        placement="top-right"
        title="Window mode"
        tips={[
          'Drag the title bar to an edge or corner to snap.',
          'Double-click the title bar to maximize.',
          'Resize from any of the eight edges or corners.',
          'Switch `windowStyle` between Windows, macOS and custom in Controls.',
        ]}
      />
      <WidgetRender {...args} />
    </>
  ),
};

export const SizeConstraints: Story = {
  args: {
    mode: 'window',
    title: 'Constrained window',
    children: <SettingsContent label="Limits" />,
    x: 120,
    y: 90,
    width: 380,
    height: 260,
    minWidth: 300,
    minHeight: 200,
    maxWidth: 560,
    maxHeight: 420,
  },
  render: (args) => (
    <>
      <StoryHint
        placement="top-right"
        title="Size constraints"
        description="Pointer, keyboard, pinch and imperative resizing all respect the limits."
      >
        <StateGrid
          items={[
            ['min', `${args.minWidth ?? '—'} × ${args.minHeight ?? '—'}`],
            ['max', `${args.maxWidth ?? '—'} × ${args.maxHeight ?? '—'}`],
          ]}
        />
      </StoryHint>
      <WidgetRender {...args} />
    </>
  ),
};

export const ScrollableContent: Story = {
  args: {
    title: 'Activity feed',
    children: <ActivityContent />,
    x: 96,
    y: 128,
    width: 360,
    height: 260,
  },
  parameters: {
    docs: {
      description: {
        story: 'Overflowing content uses the themed thin scrollbar and a fade on the body edges.',
      },
    },
  },
};

export const Localized: Story = {
  args: {
    title: 'Notas',
    children: 'Pasa el cursor por el encabezado para ver las etiquetas traducidas.',
    labels: {
      pin: 'Fijar',
      unpin: 'Soltar',
      collapse: 'Contraer',
      expand: 'Expandir',
      minimize: 'Minimizar',
      close: 'Cerrar',
      resize: 'Redimensionar',
      maximize: 'Maximizar',
      unmaximize: 'Restaurar ventana',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Every button label and accessible name can be overridden through `labels`.',
      },
    },
  },
};

const initialControlledState: FloatyControlledState = {
  position: { x: 120, y: 120 },
  size: { width: 400, height: 260 },
  isCollapsed: false,
  isMinimized: false,
  isPinned: false,
  isMaximized: false,
  snapZone: null,
};

const ControlledRender = (args: WidgetArgs) => {
  const [value, setValue] = useState(initialControlledState);
  const patch = (next: Partial<FloatyControlledState>) =>
    setValue((current) => ({ ...current, ...next }));

  return (
    <>
      <StoryHint
        placement="top-right"
        title="Controlled state"
        description={
          <>
            The parent owns the full state through <code>value</code> and <code>onValueChange</code>
            . Drag, resize or use the buttons below.
          </>
        }
      >
        <ButtonRow>
          <Button size="sm" onClick={() => patch({ position: { x: 40, y: 40 } })}>
            Move to 40,40
          </Button>
          <Button size="sm" onClick={() => patch({ isCollapsed: !value.isCollapsed })}>
            Toggle collapse
          </Button>
          <Button size="sm" onClick={() => patch({ isPinned: !value.isPinned })}>
            Toggle pin
          </Button>
          <Button size="sm" onClick={() => patch({ isMaximized: !value.isMaximized })}>
            Toggle maximize
          </Button>
          <Button size="sm" onClick={() => patch({ isMinimized: false })}>
            Restore
          </Button>
          <Button size="sm" variant="flat" onClick={() => setValue(initialControlledState)}>
            Reset
          </Button>
        </ButtonRow>
        <StateGrid
          items={[
            ['position', `${Math.round(value.position.x)}, ${Math.round(value.position.y)}`],
            ['size', `${value.size.width ?? 'auto'} × ${value.size.height ?? 'auto'}`],
            ['collapsed', String(value.isCollapsed)],
            ['minimized', String(value.isMinimized)],
            ['pinned', String(value.isPinned)],
            ['maximized', String(value.isMaximized)],
            ['snapZone', value.snapZone ?? 'null'],
          ]}
        />
      </StoryHint>
      <Floaty
        mode={args.mode}
        windowStyle={args.windowStyle}
        title={args.title}
        value={value}
        onValueChange={(next) => {
          args.onValueChange?.(next);
          setValue(next);
        }}
      >
        {args.mode === 'window' ? args.children : <Surface>{args.children}</Surface>}
      </Floaty>
    </>
  );
};

export const Controlled: Story = {
  args: {
    mode: 'window',
    title: 'Controlled window',
    children: <SettingsContent />,
    onValueChange: fn(),
  },
  render: (args) => <ControlledRender {...args} />,
};
