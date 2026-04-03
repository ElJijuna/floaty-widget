import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Floaty } from './Floaty';

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

export const Pinned: Story = {
  args: {
    title: 'Pinned Floaty',
    children: 'This floaty is pinned by default. Try pinning with the icon.',
  },
  render: (args) => {
    const [isPinned] = useState(true);
    return <Floaty {...args} />;
  },
};

