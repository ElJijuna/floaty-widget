import type { Meta, StoryObj } from '@storybook/react';
import { Floaty } from './Floaty';
import { FloatyViewport } from './FloatyViewport';
import {
  FloatyWidgetManager,
  useFloatyWidgetManager,
} from '../../context/FloatyWidgetManager';

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
const buttonStyle = {
  padding: '8px 12px',
  background: '#4f46e5',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 500,
};

const Commits = ({ owner, repo }: { owner: string; repo: string }) => (
  <div>
    <h4 style={{ margin: '0 0 8px' }}>
      {owner}/{repo}
    </h4>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      <li>feat: add viewport widget store</li>
      <li>fix: keep props captured at open time</li>
      <li>docs: explain provider API</li>
    </ul>
  </div>
);

const StatusCard = ({ label, value }: { label: string; value: string }) => (
  <div>
    <strong>{label}</strong>
    <p style={{ margin: '6px 0 0' }}>{value}</p>
  </div>
);

const ManagerControls = () => {
  const manager = useFloatyWidgetManager();

  return (
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
          onClick={() =>
            manager.open({
              id: 'commits-gnome-ui',
              title: 'Commits',
              component: Commits,
              props: { owner: 'eljijuna', repo: 'gnome-ui' },
              position: { x: 80, y: 80 },
            })
          }
          style={buttonStyle}
        >
          Open Commits
        </button>
        <button
          onClick={() =>
            manager.open({
              id: 'build-status',
              title: 'Build Status',
              component: StatusCard,
              props: { label: 'Latest build', value: 'Typecheck and build passed.' },
              position: { x: 140, y: 220 },
              size: { width: 360 },
            })
          }
          style={buttonStyle}
        >
          Open Status
        </button>
        <button onClick={() => manager.expandAll()} style={buttonStyle}>
          Expand All
        </button>
        <button onClick={() => manager.collapseAll()} style={buttonStyle}>
          Collapse All
        </button>
        <button
          onClick={() => manager.pinAll()}
          style={{
            ...buttonStyle,
            background: '#10b981',
          }}
        >
          Pin All
        </button>
        <button
          onClick={() => manager.unpinAll()}
          style={{
            ...buttonStyle,
            background: '#f59e0b',
          }}
        >
          Unpin All
        </button>
        <button
          onClick={() => manager.closeAll()}
          style={{
            ...buttonStyle,
            background: '#ef4444',
          }}
        >
          Close All
        </button>
      </div>

      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 500 }}>
          Active Widgets: {manager.widgets.size}
        </p>
      </div>
    </div>
  );
};

const ManagerDemoContent = () => {
  return (
    <div style={{ padding: '20px' }}>
      <FloatyWidgetManager
        labels={{
          pin: 'Pin widget',
          unpin: 'Unpin widget',
          collapse: 'Collapse widget',
          expand: 'Expand widget',
          close: 'Close widget',
        }}
        theme={{
          headerBackground: '#0f766e',
          headerForeground: '#ffffff',
          pinnedHeaderBackground: '#7c3aed',
          border: '#99f6e4',
        }}
      >
        <ManagerControls />
        <FloatyViewport />

        <div>otro elemento</div>
      </FloatyWidgetManager>
    </div>
  );
};

export const WithManager: Story = {
  render: () => <ManagerDemoContent />,
  parameters: {
    docs: {
      description: {
        story: 'Use FloatyWidgetManager and FloatyViewport to open application components as floating widgets with captured props.',
      },
    },
  },
};
