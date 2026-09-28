import { Button } from '@gnome-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useEffect } from 'react';
import { FloatyPreview } from '../components/Floaty/FloatyPreview';
import { FloatyTaskbar } from '../components/Floaty/FloatyTaskbar';
import { FloatyViewport } from '../components/Floaty/FloatyViewport';
import { FloatyWidgetManager } from '../context/FloatyWidgetManager';
import { useFloatyWidgetManager } from '../hooks/useFloatyWidgetManager';
import { getSampleWindow, StoryHint } from './shared';

interface TaskbarPreviewArgs {
  windowCount: number;
  showTaskbar: boolean;
  showClose: boolean;
  emptyState: string;
  showPreviewDock: boolean;
  previewScale: number;
}

const windowId = (index: number) => `task-${index}`;

const PreviewDock = ({ scale }: { scale: number }) => {
  const manager = useFloatyWidgetManager();
  const widgets = Array.from(manager.widgets.values());

  if (widgets.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 88,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3000,
        display: 'flex',
        gap: 10,
        maxWidth: 'calc(100vw - 32px)',
        overflowX: 'auto',
        padding: '10px 12px',
        background: 'rgba(15, 15, 15, 0.8)',
        borderRadius: 14,
        backdropFilter: 'blur(12px)',
      }}
    >
      {widgets.map((widget) => (
        // The preview renders the widget body (which may contain buttons), so the click target
        // is an overlay sibling instead of a wrapping <button>.
        <div
          key={widget.id}
          style={{
            position: 'relative',
            display: 'grid',
            justifyItems: 'center',
            gap: 6,
            opacity: widget.isMinimized ? 0.55 : 1,
          }}
        >
          <FloatyPreview
            id={widget.id}
            scale={scale}
            style={{
              width: 150,
              height: 96,
              overflow: 'hidden',
              borderRadius: 8,
              background: 'white',
            }}
          />
          <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 11 }}>
            {String(widget.title)}
            {widget.isMinimized ? ' (minimized)' : ''}
          </span>
          <button
            type="button"
            aria-label={`Bring ${String(widget.title)} to front`}
            title={`Bring ${String(widget.title)} to front`}
            onClick={() => {
              manager.restoreWidget(widget.id);
              manager.bringToFront(widget.id);
            }}
            style={{
              position: 'absolute',
              inset: 0,
              padding: 0,
              background: 'transparent',
              border: 0,
              borderRadius: 8,
              cursor: 'pointer',
            }}
          />
        </div>
      ))}
    </div>
  );
};

const TaskbarPreviewWorkspace = ({
  windowCount,
  showTaskbar,
  showClose,
  emptyState,
  showPreviewDock,
  previewScale,
}: TaskbarPreviewArgs) => {
  const manager = useFloatyWidgetManager();
  const { open, close } = manager;

  const openWindow = useCallback(
    (index: number) => {
      const sample = getSampleWindow(index);

      open(
        {
          id: windowId(index),
          mode: 'window',
          title: sample.title,
          component: sample.component,
          props: {},
          position: { x: 400 + index * 56, y: 60 + index * 48 },
          size: { width: 340, height: 240 },
        },
        { duplicateStrategy: 'focus' },
      );
    },
    [open],
  );

  useEffect(() => {
    for (let index = 0; index < 6; index += 1) {
      if (index < windowCount) {
        openWindow(index);
      } else {
        close(windowId(index));
      }
    }
  }, [windowCount, openWindow, close]);

  return (
    <>
      <StoryHint
        title="Taskbar & live previews"
        description={
          <>
            <code>FloatyTaskbar</code> lists every managed widget. <code>FloatyPreview</code>{' '}
            renders a scaled, live copy of a widget — its internal state is independent, so the chat
            preview does not receive replies sent in the real window.
          </>
        }
        tips={[
          'Minimize a window and restore it from the taskbar or the dock.',
          'Close everything to see the taskbar empty state.',
        ]}
      >
        <Button
          variant="suggested"
          onClick={() => Array.from({ length: windowCount }, (_, index) => openWindow(index))}
        >
          Reopen windows
        </Button>
      </StoryHint>
      <FloatyViewport />
      {showPreviewDock && <PreviewDock scale={previewScale} />}
      {showTaskbar && (
        <FloatyTaskbar
          showClose={showClose}
          emptyState={emptyState ? <span style={{ padding: '0 8px' }}>{emptyState}</span> : null}
          style={{ position: 'fixed', right: 20, bottom: 20, left: 20, zIndex: 3000 }}
        />
      )}
    </>
  );
};

const meta = {
  title: 'Floaty/Desktop/Taskbar & preview',
  tags: ['autodocs'],
  render: (args) => (
    <FloatyWidgetManager>
      <TaskbarPreviewWorkspace {...args} />
    </FloatyWidgetManager>
  ),
  args: {
    windowCount: 3,
    showTaskbar: true,
    showClose: true,
    emptyState: 'No open windows',
    showPreviewDock: true,
    previewScale: 0.38,
  },
  argTypes: {
    windowCount: { control: { type: 'range', min: 0, max: 6, step: 1 } },
    showTaskbar: { control: 'boolean', table: { category: 'FloatyTaskbar' } },
    showClose: {
      control: 'boolean',
      description: 'Maps to `<FloatyTaskbar showClose>`.',
      if: { arg: 'showTaskbar' },
      table: { category: 'FloatyTaskbar' },
    },
    emptyState: {
      control: 'text',
      description: 'Maps to `<FloatyTaskbar emptyState>`. Leave empty to hide the bar.',
      if: { arg: 'showTaskbar' },
      table: { category: 'FloatyTaskbar' },
    },
    showPreviewDock: { control: 'boolean', table: { category: 'FloatyPreview' } },
    previewScale: {
      control: { type: 'range', min: 0.2, max: 0.7, step: 0.02 },
      description: 'Maps to `<FloatyPreview scale>`.',
      if: { arg: 'showPreviewDock' },
      table: { category: 'FloatyPreview' },
    },
  },
} satisfies Meta<TaskbarPreviewArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TaskbarAndDock: Story = {};

export const TaskbarOnly: Story = {
  args: { showPreviewDock: false },
};

export const EmptyState: Story = {
  args: { windowCount: 0, showPreviewDock: false },
};
