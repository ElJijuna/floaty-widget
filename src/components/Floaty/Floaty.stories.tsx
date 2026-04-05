import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Floaty } from './Floaty';
import { FloatyWidgetManager, FloatyWidgetManagerHandle } from '../../context/FloatyWidgetManager';

const meta: Meta<typeof Floaty> = {
  title: 'Components/FloatyWidget',
  component: Floaty,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A floating widget component that can be dragged, collapsed/expanded, and pinned to prevent dragging.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title displayed in the header',
    },
    children: {
      control: 'text',
      description: 'The content displayed in the body',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Floaty',
    children: 'Drag me around! Click the icons to pin or collapse.',
  },
};

export const WithLongContent: Story = {
  args: {
    title: 'Long Content Example',
    children: (
      <div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua.
        </p>
        <p>
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
          commodo consequat.
        </p>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
          nulla pariatur.
        </p>
      </div>
    ),
  },
};

export const WithCustomContent: Story = {
  args: {
    title: 'Notifications',
    children: (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li style={{ padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
          ✅ Task completed successfully
        </li>
        <li style={{ padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
          ⚠️ Warning: Update available
        </li>
        <li style={{ padding: '8px 0' }}>ℹ️ New message received</li>
      </ul>
    ),
  },
};

// Widget Manager Story
const ManagerDemoContent = () => {
  const managerRef = useRef<FloatyWidgetManagerHandle>(null);

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 999,
          minWidth: '250px',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600 }}>
          Widget Manager Controls
        </h3>

        <div style={{ display: 'grid', gap: '8px' }}>
          <button
            onClick={() => managerRef.current?.expandAll()}
            style={{
              padding: '8px 12px',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            📖 Expand All
          </button>
          <button
            onClick={() => managerRef.current?.collapseAll()}
            style={{
              padding: '8px 12px',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            📕 Collapse All
          </button>
          <button
            onClick={() => managerRef.current?.pinAll()}
            style={{
              padding: '8px 12px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            📌 Pin All
          </button>
          <button
            onClick={() => managerRef.current?.unpinAll()}
            style={{
              padding: '8px 12px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            📍 Unpin All
          </button>
        </div>

        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 500 }}>
            Active Widgets: {managerRef.current?.getWidgetCount() ?? 0}
          </p>
        </div>
      </div>

      <FloatyWidgetManager ref={managerRef}>
        <div>otro elemento</div>
        <Floaty id="widget-1" title="Widget 1">
          <p>First floating widget. Try dragging me!</p>
        </Floaty>

        <Floaty id="widget-2" title="Widget 2" style={{ top: '250px', left: '100px' }}>
          <p>Second floating widget.</p>
        </Floaty>

        <Floaty id="widget-3" title="Widget 3" style={{ top: '400px', right: '100px' }}>
          <p>Third floating widget. Use the control panel to manage all!</p>
        </Floaty>
      </FloatyWidgetManager>
    </div>
  );
};

export const WithManager: Story = {
  render: () => <ManagerDemoContent />,
  parameters: {
    docs: {
      description: {
        story: 'Use FloatyWidgetManager to control multiple widgets imperative via refs. Expand/collapse and pin/unpin all widgets from the control panel.',
      },
    },
  },
};
