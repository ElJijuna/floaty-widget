import { Button } from '@gnome-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useEffect } from 'react';
import { FloatyTaskbar } from '../components/Floaty/FloatyTaskbar';
import { FloatyViewport } from '../components/Floaty/FloatyViewport';
import { FloatyWidgetManager } from '../context/FloatyWidgetManager';
import { useFloatyWidgetManager } from '../hooks/useFloatyWidgetManager';
import type { FloatyWindowStyle } from '../types';
import { ButtonRow, getSampleWindow, StateGrid, StoryHint } from './shared';

interface TabsArgs {
  windowGrouping: boolean;
  windowStyle: FloatyWindowStyle;
  windowCount: number;
  startGrouped: boolean;
}

const windowId = (index: number) => `tabs-${index}`;

const TabsWorkspace = ({ windowStyle, windowCount, startGrouped }: TabsArgs) => {
  const manager = useFloatyWidgetManager();
  const { open, close, groupWindows } = manager;
  const groups = Array.from(manager.groups.values());

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
        position: { x: 400 + (index % 3) * 330, y: 60 + Math.floor(index / 3) * 300 },
        size: { width: 320, height: 260 },
      });
    },
    [open, windowStyle],
  );

  useEffect(() => {
    for (let index = 0; index < 6; index += 1) {
      if (index < windowCount) {
        openWindow(index);
      } else {
        close(windowId(index));
      }
    }

    if (startGrouped && windowCount > 1) {
      groupWindows(Array.from({ length: windowCount }, (_, index) => windowId(index)));
    }
  }, [windowCount, startGrouped, openWindow, close, groupWindows]);

  return (
    <>
      <StoryHint
        title="Tabbed windows"
        description={
          <>
            With <code>windowGrouping</code> enabled, drop a window on another window&apos;s title
            bar to merge them into tabs. Each tab keeps its state — type in Notes or send a Chat
            reply, then switch tabs.
          </>
        }
        tips={[
          'Drag a tab out of the strip to detach it into its own window.',
          'Arrow keys switch tabs, Delete closes one, Alt+↓ detaches it.',
          'Minimize, maximize and snap act on the whole tabbed window.',
        ]}
      >
        <ButtonRow>
          <Button
            size="sm"
            variant="suggested"
            onClick={() =>
              groupWindows(Array.from({ length: windowCount }, (_, index) => windowId(index)))
            }
          >
            Group all
          </Button>
          <Button
            size="sm"
            onClick={() =>
              groups.forEach((group) =>
                group.widgetIds
                  .slice(1)
                  .forEach((id, index) =>
                    manager.ungroupWindow(id, { x: 420 + index * 40, y: 80 + index * 40 }),
                  ),
              )
            }
          >
            Ungroup all
          </Button>
        </ButtonRow>
        <StateGrid
          items={
            groups.length === 0
              ? [['groups', 'none']]
              : groups.map((group) => [
                  group.id,
                  group.widgetIds.map((id) => (id === group.activeId ? `[${id}]` : id)).join(' · '),
                ])
          }
        />
      </StoryHint>
      <FloatyViewport />
      <FloatyTaskbar style={{ position: 'fixed', right: 20, bottom: 20, left: 20, zIndex: 3000 }} />
    </>
  );
};

const meta = {
  title: 'Floaty/Desktop/Tabs',
  tags: ['autodocs'],
  render: (args) => (
    // Remount when grouping toggles so the manager prop applies from a clean state.
    <FloatyWidgetManager key={String(args.windowGrouping)} windowGrouping={args.windowGrouping}>
      <TabsWorkspace {...args} />
    </FloatyWidgetManager>
  ),
  parameters: {
    docs: {
      description: {
        component:
          'Window-mode widgets can be merged into one tabbed window. Enable drag-and-drop with `<FloatyWidgetManager windowGrouping>`, or use `manager.groupWindows()`, `ungroupWindow()` and `setActiveTab()` directly. Inactive tabs stay mounted, so their content keeps its state.',
      },
    },
  },
  args: {
    windowGrouping: true,
    windowStyle: 'windows',
    windowCount: 3,
    startGrouped: false,
  },
  argTypes: {
    windowGrouping: {
      control: 'boolean',
      description: 'Maps to `<FloatyWidgetManager windowGrouping>` (drag-and-drop merging).',
    },
    windowStyle: { control: 'inline-radio', options: ['windows', 'mac', 'custom'] },
    windowCount: { control: { type: 'range', min: 2, max: 6, step: 1 } },
    startGrouped: {
      control: 'boolean',
      description: 'Calls `manager.groupWindows()` with every window on load.',
    },
  },
} satisfies Meta<TabsArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DragToMerge: Story = {};

export const Grouped: Story = {
  args: { startGrouped: true, windowCount: 4 },
};

export const MacOSTabs: Story = {
  args: { startGrouped: true, windowStyle: 'mac' },
};
