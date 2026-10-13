import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import {
  FloatyMinimizedStack,
  type FloatyMinimizedStackProps,
} from '../components/Floaty/FloatyMinimizedStack';
import { FloatyTaskbar } from '../components/Floaty/FloatyTaskbar';
import { FloatyViewport } from '../components/Floaty/FloatyViewport';
import { FloatyWidgetManager } from '../context/FloatyWidgetManager';
import { useFloatyWidgetManager } from '../hooks/useFloatyWidgetManager';

const Content = ({ index }: { index: number }) => (
  <div style={{ padding: 20, background: `hsl(${index * 47} 65% 90%)`, minHeight: 220 }}>
    <h2>Window {index + 1}</h2>
    <p>A live preview of your workspace.</p>
    <input aria-label="Example input" defaultValue="Preview content" />
  </div>
);

const Workspace = ({
  windowCount,
  ...props
}: FloatyMinimizedStackProps & { windowCount: number }) => {
  const manager = useFloatyWidgetManager();
  const { open, close, minimizeWidget } = manager;
  useEffect(() => {
    const ids = Array.from({ length: windowCount }, (_, index) => {
      const id = `stack-${index}`;
      open({
        id,
        title: `Window ${index + 1}`,
        component: Content,
        props: { index },
        size: { width: 400, height: 300 },
      });
      minimizeWidget(id);
      return id;
    });
    return () => {
      ids.forEach((id) => {
        close(id);
      });
    };
  }, [open, close, minimizeWidget, windowCount]);
  return (
    <>
      <p style={{ textAlign: 'center' }}>
        Hover or focus a thumbnail to enlarge it while keeping its perspective. Activate it to
        restore the window.
      </p>
      <button type="button" onClick={() => manager.minimizeAll()}>
        Minimize all
      </button>
      <FloatyViewport />
      <FloatyTaskbar />
      <FloatyMinimizedStack {...props} />
    </>
  );
};

const meta = {
  title: 'Floaty/Minimized Stack',
  component: FloatyMinimizedStack,
  args: {
    position: 'left',
    thumbnailWidth: 160,
    thumbnailHeight: 100,
    previewScale: 0.4,
    rotation: 32,
    overlap: 24,
    hoverScale: 1.15,
    windowCount: 6,
  },
  argTypes: {
    position: { control: 'select', options: ['left', 'right', 'top', 'bottom'] },
    thumbnailWidth: { control: { type: 'range', min: 80, max: 300, step: 10 } },
    thumbnailHeight: { control: { type: 'range', min: 60, max: 200, step: 10 } },
    previewScale: { control: { type: 'range', min: 0.1, max: 1, step: 0.05 } },
    rotation: { control: { type: 'range', min: 0, max: 45, step: 1 } },
    overlap: { control: { type: 'range', min: 0, max: 80, step: 4 } },
    hoverScale: { control: { type: 'range', min: 1, max: 1.5, step: 0.05 } },
    windowCount: { control: { type: 'range', min: 0, max: 20, step: 1 } },
  },
  render: (args) => (
    <FloatyWidgetManager>
      <Workspace {...args} />
    </FloatyWidgetManager>
  ),
} satisfies Meta<FloatyMinimizedStackProps & { windowCount: number }>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
