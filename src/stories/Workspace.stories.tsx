import { Button } from '@gnome-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useEffect } from 'react';
import { FloatyTaskbar } from '../components/Floaty/FloatyTaskbar';
import { FloatyViewport } from '../components/Floaty/FloatyViewport';
import { FloatyWidgetManager } from '../context/FloatyWidgetManager';
import { useFloatyWidgetManager } from '../hooks/useFloatyWidgetManager';
import type { FloatyWindowStyle } from '../types';
import { getSampleWindow, StoryHint } from './shared';

interface WorkspaceArgs {
  windowStyle: FloatyWindowStyle;
  windowCount: number;
  persist: boolean;
  autoFocus: boolean;
  showTaskbar: boolean;
  showTaskbarClose: boolean;
}

const windowId = (index: number) => `workspace-${index}`;

const Workspace = ({
  windowStyle,
  windowCount,
  persist,
  autoFocus,
  showTaskbar,
  showTaskbarClose,
}: WorkspaceArgs) => {
  const manager = useFloatyWidgetManager();
  const { open, close } = manager;

  const openWindow = useCallback(
    (index: number) => {
      const sample = getSampleWindow(index);

      open({
        id: windowId(index),
        mode: 'window',
        windowStyle,
        title: sample.title,
        component: sample.component,
        props: {},
        position: { x: 380 + index * 40, y: 60 + index * 40 },
        size: { width: 420, height: 280 },
        persistenceKey: persist ? `floaty-story:${windowId(index)}` : undefined,
        autoFocus,
      });
    },
    [open, windowStyle, persist, autoFocus],
  );

  // Re-open every window whenever a control changes so the new options apply.
  useEffect(() => {
    for (let index = 0; index < 8; index += 1) {
      if (index < windowCount) {
        openWindow(index);
      } else {
        close(windowId(index));
      }
    }
  }, [windowCount, openWindow, close]);

  const closedIndexes = Array.from({ length: windowCount }, (_, index) => index).filter(
    (index) => !manager.widgets.has(windowId(index)),
  );

  return (
    <>
      <StoryHint
        title="Desktop workspace"
        description="Window-mode widgets managed by FloatyWidgetManager, with a connected taskbar."
        tips={[
          'Drag a title bar to an edge or corner to snap; double-click to maximize.',
          'Minimize a window and restore it from the taskbar.',
          'Change the window chrome and count from Controls.',
          'Enable persist, move windows, then reload: the layout is restored.',
        ]}
      >
        <Button
          variant="suggested"
          disabled={closedIndexes.length === 0}
          onClick={() => closedIndexes.forEach(openWindow)}
        >
          Open window
        </Button>
      </StoryHint>
      <FloatyViewport />
      {showTaskbar && (
        <FloatyTaskbar
          showClose={showTaskbarClose}
          style={{ position: 'fixed', right: 20, bottom: 20, left: 20, zIndex: 3000 }}
        />
      )}
    </>
  );
};

const meta = {
  title: 'Floaty/Desktop/Workspace',
  tags: ['autodocs'],
  render: (args) => (
    <FloatyWidgetManager>
      <Workspace {...args} />
    </FloatyWidgetManager>
  ),
  parameters: {
    docs: {
      description: {
        component:
          'A desktop-style workspace: `FloatyWidgetManager` owns the windows, `FloatyViewport` renders them and `FloatyTaskbar` lists them for focus, restore and close.',
      },
    },
  },
  args: {
    windowStyle: 'windows',
    windowCount: 1,
    persist: false,
    autoFocus: false,
    showTaskbar: true,
    showTaskbarClose: true,
  },
  argTypes: {
    windowStyle: {
      control: 'inline-radio',
      options: ['windows', 'mac', 'custom'],
      description: 'Title bar chrome passed to `manager.open({ windowStyle })`.',
    },
    windowCount: {
      control: { type: 'range', min: 1, max: 8, step: 1 },
      description: 'Number of windows opened in the workspace.',
    },
    persist: {
      control: 'boolean',
      description: 'Passes a `persistenceKey` so geometry survives reloads.',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Moves keyboard focus into each window when it appears.',
    },
    showTaskbar: { control: 'boolean', table: { category: 'Taskbar' } },
    showTaskbarClose: {
      control: 'boolean',
      description: 'Maps to `<FloatyTaskbar showClose>`.',
      if: { arg: 'showTaskbar' },
      table: { category: 'Taskbar' },
    },
  },
} satisfies Meta<WorkspaceArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleWindow: Story = {};

export const MacOSWindows: Story = {
  args: { windowStyle: 'mac', windowCount: 3 },
};

export const PersistedLayout: Story = {
  args: { windowCount: 2, persist: true },
  parameters: {
    docs: {
      description: {
        story:
          'Move or resize the windows, then reload the page: position, size, maximize and snap state are restored from localStorage.',
      },
    },
  },
};
