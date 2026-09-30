import { Button, Card } from '@gnome-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef } from 'react';
import { useArgs } from 'storybook/preview-api';
import { FloatyTaskbar } from '../components/Floaty/FloatyTaskbar';
import { FloatyViewport } from '../components/Floaty/FloatyViewport';
import { FloatyWidgetManager } from '../context/FloatyWidgetManager';
import { useFloatyWidgetManager } from '../hooks/useFloatyWidgetManager';
import type { FloatyArrangeOptions, FloatyWindowArrangement } from '../types';
import { getSampleWindow } from './shared';

type Arrangement = FloatyWindowArrangement | 'none';

interface LayoutArgs {
  arrangement: Arrangement;
  keepLayout: boolean;
  windowCount: number;
  gap: number;
  margin: number;
  insetTop: number;
  insetRight: number;
  insetBottom: number;
  insetLeft: number;
  size: number;
  animate: boolean;
  resizable: boolean;
  showUsableArea: boolean;
}

const ARRANGEMENTS: Arrangement[] = [
  'none',
  'grid',
  'columns',
  'rows',
  'left',
  'right',
  'top',
  'bottom',
];
const LABELS: Record<Arrangement, string> = {
  none: 'Free',
  grid: 'Grid',
  columns: 'Columns',
  rows: 'Rows',
  left: 'Left',
  right: 'Right',
  top: 'Top',
  bottom: 'Bottom',
};
const DOCKS: Arrangement[] = ['left', 'right', 'top', 'bottom'];
const MAX_WINDOWS = 8;
const TOOLBAR_HEIGHT = 64;

const windowId = (index: number) => `layout-${index}`;

const LayoutWorkspace = ({
  updateArgs,
  ...args
}: LayoutArgs & { updateArgs: (next: Partial<LayoutArgs>) => void }) => {
  const manager = useFloatyWidgetManager();
  const { open, close, getWidget, setLayout, arrangeWindows } = manager;
  const {
    arrangement,
    keepLayout,
    windowCount,
    gap,
    margin,
    insetTop,
    insetRight,
    insetBottom,
    insetLeft,
    size,
    animate,
    resizable,
  } = args;
  const layoutRef = useRef(manager.layout);
  layoutRef.current = manager.layout;
  const draggedSize = manager.layout?.options.size;

  // Only a drag should sync the control, so the current args are read, not depended on.
  const dockArgsRef = useRef({ arrangement, size });
  dockArgsRef.current = { arrangement, size };

  // Dragging the inner edge of a dock changes its thickness; mirror it into the `size` control.
  useEffect(() => {
    const { current } = dockArgsRef;

    if (
      draggedSize !== undefined &&
      DOCKS.includes(current.arrangement) &&
      draggedSize !== current.size
    ) {
      updateArgs({ size: draggedSize });
    }
  }, [draggedSize, updateArgs]);

  useEffect(() => {
    for (let index = 0; index < MAX_WINDOWS; index += 1) {
      const id = windowId(index);

      if (index >= windowCount) {
        close(id);
      } else if (!getWidget(id)) {
        const sample = getSampleWindow(index);

        open({
          id,
          mode: 'window',
          title: sample.title,
          component: sample.component,
          props: {},
          position: { x: 80 + index * 48, y: TOOLBAR_HEIGHT + 40 + index * 36 },
          size: { width: 340, height: 220 },
        });
      }
    }
  }, [windowCount, open, close, getWidget]);

  // Re-runs the one-shot arrangeWindows() after windows are added or removed.
  useEffect(() => {
    if (arrangement === 'none') {
      setLayout(null);
      return;
    }

    if (windowCount === 0) {
      return;
    }

    // Keep the splits made by dragging dividers while the arrangement stays the same.
    const previous = layoutRef.current;
    const sameArrangement = previous?.arrangement === arrangement;
    const options: FloatyArrangeOptions = {
      gap,
      margin,
      animate,
      resizable,
      insets: { top: insetTop, right: insetRight, bottom: insetBottom, left: insetLeft },
      size: DOCKS.includes(arrangement) ? size : undefined,
      columnWeights: sameArrangement ? previous.options.columnWeights : undefined,
      rowWeights: sameArrangement ? previous.options.rowWeights : undefined,
    };

    if (keepLayout) {
      setLayout(arrangement, options);
    } else {
      setLayout(null);
      arrangeWindows(arrangement, options);
    }
  }, [
    arrangement,
    keepLayout,
    windowCount,
    gap,
    margin,
    insetTop,
    insetRight,
    insetBottom,
    insetLeft,
    size,
    animate,
    resizable,
    setLayout,
    arrangeWindows,
  ]);

  return (
    <>
      {args.showUsableArea && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: margin + insetTop,
            right: margin + insetRight,
            bottom: margin + insetBottom,
            left: margin + insetLeft,
            // Drawn above the windows (outline only) so the reserved space stays visible.
            zIndex: 2500,
            outline: '9999px solid rgba(53, 132, 228, 0.18)',
            border: '2px dashed #3584e4',
            borderRadius: 8,
            pointerEvents: 'none',
          }}
        />
      )}
      <Card
        padding="sm"
        style={{
          position: 'fixed',
          top: 12,
          right: 16,
          left: 16,
          width: 'fit-content',
          margin: '0 auto',
          zIndex: 3000,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        <strong style={{ fontSize: 12, paddingInline: 4 }}>Arrange</strong>
        {ARRANGEMENTS.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={arrangement === value ? 'suggested' : 'flat'}
            aria-pressed={arrangement === value}
            onClick={() => updateArgs({ arrangement: value })}
          >
            {LABELS[value]}
          </Button>
        ))}
        <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(0,0,0,0.12)' }} />
        <Button
          size="sm"
          disabled={windowCount >= MAX_WINDOWS}
          onClick={() => updateArgs({ windowCount: windowCount + 1 })}
        >
          Open window
        </Button>
        <Button
          size="sm"
          variant="flat"
          disabled={windowCount <= 1}
          onClick={() => updateArgs({ windowCount: windowCount - 1 })}
        >
          Close window
        </Button>
      </Card>
      <FloatyViewport />
      <FloatyTaskbar style={{ position: 'fixed', right: 20, bottom: 20, left: 20, zIndex: 3000 }} />
    </>
  );
};

const meta = {
  title: 'Floaty/Desktop/Layouts',
  tags: ['autodocs'],
  render: function Render(args) {
    // Storybook hooks must be called in the story function itself, not in a nested component.
    const [, updateArgs] = useArgs<LayoutArgs>();

    return (
      <FloatyWidgetManager>
        <LayoutWorkspace {...args} updateArgs={updateArgs} />
      </FloatyWidgetManager>
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          '`manager.arrangeWindows()` arranges visible windows once; `manager.setLayout()` keeps the arrangement and re-applies it when windows open, close, minimize, maximize or the viewport resizes. Drag the gap between two windows (or the inner edge of a dock) to resize them together; double-click it to even the split. Every option is a control — enable **showUsableArea** to see the space left by `margin` and `insets`.',
      },
    },
  },
  args: {
    arrangement: 'grid',
    keepLayout: true,
    windowCount: 4,
    gap: 12,
    margin: 16,
    insetTop: TOOLBAR_HEIGHT,
    insetRight: 0,
    insetBottom: 72,
    insetLeft: 0,
    size: 360,
    animate: true,
    resizable: true,
    showUsableArea: false,
  },
  argTypes: {
    arrangement: {
      control: 'select',
      options: ARRANGEMENTS,
      description:
        '`left`/`right` stack windows vertically against that edge; `top`/`bottom` place them side by side. `none` releases the layout.',
      table: { category: 'Layout' },
    },
    keepLayout: {
      control: 'boolean',
      description: '`true` uses `setLayout()` (kept on changes); `false` uses `arrangeWindows()`.',
      table: { category: 'Layout' },
    },
    windowCount: {
      control: { type: 'range', min: 1, max: MAX_WINDOWS, step: 1 },
      table: { category: 'Layout' },
    },
    size: {
      control: { type: 'range', min: 240, max: 720, step: 20 },
      description: 'Dock thickness: width for `left`/`right`, height for `top`/`bottom`.',
      if: { arg: 'arrangement', neq: 'none' },
      table: { category: 'Layout' },
    },
    animate: { control: 'boolean', table: { category: 'Layout' } },
    resizable: {
      control: 'boolean',
      description:
        'Draggable dividers between windows (only with `keepLayout`). Double-click one to even the split again.',
      if: { arg: 'keepLayout' },
      table: { category: 'Layout' },
    },
    gap: { control: { type: 'range', min: 0, max: 48, step: 2 }, table: { category: 'Spacing' } },
    margin: {
      control: { type: 'range', min: 0, max: 64, step: 2 },
      table: { category: 'Spacing' },
    },
    insetTop: {
      control: { type: 'range', min: 0, max: 240, step: 4 },
      description: 'Maps to `insets.top` (space for the toolbar above).',
      table: { category: 'Spacing' },
    },
    insetRight: {
      control: { type: 'range', min: 0, max: 400, step: 4 },
      description: 'Maps to `insets.right`.',
      table: { category: 'Spacing' },
    },
    insetBottom: {
      control: { type: 'range', min: 0, max: 240, step: 4 },
      description: 'Maps to `insets.bottom` (space for the taskbar).',
      table: { category: 'Spacing' },
    },
    insetLeft: {
      control: { type: 'range', min: 0, max: 400, step: 4 },
      description: 'Maps to `insets.left` (e.g. an app sidebar).',
      table: { category: 'Spacing' },
    },
    showUsableArea: {
      control: 'boolean',
      description: 'Story helper: outlines the area left after margin and insets.',
      table: { category: 'Debug' },
    },
  },
} satisfies Meta<LayoutArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {};

export const DockRight: Story = {
  args: { arrangement: 'right', windowCount: 3, size: 380 },
  parameters: {
    docs: {
      description: {
        story: 'Windows stacked one below the other against the right edge.',
      },
    },
  },
};

export const DockBottom: Story = {
  args: { arrangement: 'bottom', windowCount: 3, size: 260 },
  parameters: {
    docs: {
      description: {
        story: 'Windows side by side along the bottom edge, above the taskbar inset.',
      },
    },
  },
};

export const WithSidebarInset: Story = {
  args: { arrangement: 'columns', windowCount: 3, insetLeft: 240, showUsableArea: true },
  parameters: {
    docs: {
      description: {
        story: 'Insets keep windows clear of fixed app chrome such as a 240px sidebar.',
      },
    },
  },
};

export const FreeWindows: Story = {
  args: { arrangement: 'none' },
  parameters: {
    docs: {
      description: { story: 'No layout: windows keep the position they were opened at.' },
    },
  },
};
