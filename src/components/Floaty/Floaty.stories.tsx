import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GhClientProvider, useGhRepo, useGhRepoCommits } from '@api-hooks/gh';
import { Badge, Button, Card, Separator, Spinner } from '@gnome-ui/react';
import { Floaty } from './Floaty';
import { FloatyViewport } from './FloatyViewport';
import {
  FloatyWidgetManager,
  useFloatyWidgetManager,
} from '../../context/FloatyWidgetManager';
import '@gnome-ui/core/styles';
import '@gnome-ui/react/styles';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 60_000,
    },
  },
});

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

interface GitHubRepoCardProps {
  owner: string;
  repo: string;
  showAddButton?: boolean;
}

const StatusCard = ({ label, value }: { label: string; value: string }) => (
  <div>
    <strong>{label}</strong>
    <p style={{ margin: '6px 0 0' }}>{value}</p>
  </div>
);

const shortSha = (sha: string) => sha.slice(0, 7);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));

const GitHubRepoCard = ({
  owner,
  repo,
  showAddButton = true,
}: GitHubRepoCardProps) => {
  const manager = useFloatyWidgetManager();
  const repository = useGhRepo(owner, repo);
  const commits = useGhRepoCommits(owner, repo, { per_page: 4 });

  const addToWidget = () => {
    manager.open(
      {
        id: `github-${owner}-${repo}`,
        title: `${owner}/${repo}`,
        component: GitHubRepoCard,
        props: { owner, repo, showAddButton: false },
        position: { x: 90, y: 90 },
        size: { width: 420 },
      },
      { duplicateStrategy: 'focus' }
    );
  };

  return (
    <Card
      padding="lg"
      style={{
        display: 'grid',
        gap: 14,
        width: 'min(100%, 700px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Badge variant="accent">GitHub</Badge>
            {repository.data?.language && (
              <Badge variant="neutral">{repository.data.language}</Badge>
            )}
          </div>
          <h3 style={{ margin: '10px 0 4px', fontSize: 18 }}>
            {owner}/{repo}
          </h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
            {repository.isLoading
              ? 'Loading repository details...'
              : repository.data?.description ?? 'No description available.'}
          </p>
        </div>

        {showAddButton && (
          <Button variant="suggested" size="sm" onClick={addToWidget}>
            Add to widget
          </Button>
        )}
      </div>

      {repository.isError && (
        <p style={{ margin: 0, color: '#b91c1c', fontSize: 13 }}>
          {repository.error.message}
        </p>
      )}

      {repository.data && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <Card padding="sm">
            <strong>{repository.data.stargazers_count}</strong>
            <div style={{ color: '#6b7280', fontSize: 12 }}>Stars</div>
          </Card>
          <Card padding="sm">
            <strong>{repository.data.forks_count}</strong>
            <div style={{ color: '#6b7280', fontSize: 12 }}>Forks</div>
          </Card>
          <Card padding="sm">
            <strong>{repository.data.open_issues_count}</strong>
            <div style={{ color: '#6b7280', fontSize: 12 }}>Issues</div>
          </Card>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ fontSize: 13 }}>Latest commits</strong>
          {commits.isFetching && <Spinner size="sm" />}
        </div>

        {commits.isError && (
          <p style={{ margin: '8px 0 0', color: '#b91c1c', fontSize: 13 }}>
            {commits.error.message}
          </p>
        )}

        {commits.data && (
          <ul
            style={{
              display: 'grid',
              gap: 8,
              listStyle: 'none',
              margin: '10px 0 0',
              padding: 0,
            }}
          >
            {commits.data.values.map((commit) => (
              <li
                key={commit.sha}
              >
                <a
                  href={commit.html_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#2563eb',
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textDecoration: 'none',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {commit.commit.message.split('\n')[0]}
                </a>
                <span style={{ color: '#6b7280', fontSize: 12 }}>
                  {shortSha(commit.sha)} by {commit.commit.author.name} on{' '}
                  {formatDate(commit.commit.author.date)}
                </span>

                <Separator />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

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
              component: GitHubRepoCard,
              props: { owner: 'eljijuna', repo: 'gnome-ui', showAddButton: false },
              position: { x: 80, y: 80 },
              size: { width: 420 },
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
        <button onClick={() => manager.minimizeAll()} style={buttonStyle}>
          Minimize All
        </button>
        <button onClick={() => manager.restoreAll()} style={buttonStyle}>
          Restore All
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

const WidgetStatusBar = () => {
  const manager = useFloatyWidgetManager();
  const widgets = Array.from(manager.widgets.values());
  const minimizedWidgets = widgets.filter((widget) => widget.isMinimized);
  const visibleWidgets = widgets.filter((widget) => !widget.isMinimized);

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        left: 20,
        zIndex: 4000,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 48,
        padding: '8px 12px',
        background: 'var(--gnome-card-bg-color)',
        border: '1px solid var(--gnome-card-shade-color)',
        borderRadius: 'var(--gnome-radius-lg)',
        boxShadow: 'var(--gnome-shadow-md)',
        color: 'var(--gnome-card-fg-color)',
        fontSize: 13,
      }}
    >
      <strong style={{ whiteSpace: 'nowrap' }}>
        Widgets {widgets.length}
      </strong>
      <span style={{ color: 'var(--gnome-view-fg-color)', whiteSpace: 'nowrap' }}>
        {visibleWidgets.length} visible / {minimizedWidgets.length} minimized
      </span>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginLeft: 'auto',
          overflowX: 'auto',
          paddingBottom: 2,
        }}
      >
        {widgets.map((widget) => (
          <Button
            key={widget.id}
            size="sm"
            variant={widget.isMinimized ? 'suggested' : 'flat'}
            onClick={() =>
              widget.isMinimized
                ? manager.restoreWidget(widget.id)
                : manager.minimizeWidget(widget.id)
            }
          >
            {widget.isMinimized ? 'Restore' : 'Minimize'} {widget.title ?? widget.id}
          </Button>
        ))}
      </div>
    </div>
  );
};

const ManagerDemoContent = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <GhClientProvider>
        <FloatyWidgetManager
          labels={{
            pin: 'Pin widget',
            unpin: 'Unpin widget',
            collapse: 'Collapse widget',
            expand: 'Expand widget',
            minimize: 'Minimize widget',
            restore: 'Restore widget',
            close: 'Close widget',
          }}
          theme={{
            headerBackground: '#0f766e',
            headerForeground: '#ffffff',
            pinnedHeaderBackground: 'var(--gnome-accent-bg-color)',
            pinnedHeaderForeground: 'var(--gnome-accent-fg-color)',
            border: 'var(--gnome-card-shade-color)',
          }}
        >
          <div style={{ display: 'grid', gap: 20, padding: '20px' }}>
            <ManagerControls />
            <GitHubRepoCard owner="eljijuna" repo="gnome-ui" />
          </div>
          <FloatyViewport />
          <WidgetStatusBar />
        </FloatyWidgetManager>
      </GhClientProvider>
    </QueryClientProvider>
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

const LazyWidgetControls = () => {
  const manager = useFloatyWidgetManager();
  const [loadRequests, setLoadRequests] = useState(0);
  const lazyWidget = manager.getWidget('lazy-performance');
  const isOpen = Boolean(lazyWidget);
  const isMinimized = lazyWidget?.isMinimized ?? false;

  const loadPanel = () => {
    window.setTimeout(() => {
      setLoadRequests((count) => count + 1);
    }, 0);

    return new Promise<typeof import('./LazyFloatyPanel')>((resolve) => {
      window.setTimeout(() => {
        void import('./LazyFloatyPanel').then(resolve);
      }, 900);
    });
  };

  const openLazyWidget = () => {
    manager.open(
      {
        id: 'lazy-performance',
        title: 'Lazy Performance',
        loader: loadPanel,
        props: { metric: 'Bundle saved up front', value: '1 chunk' },
        fallback: (
          <div
            style={{
              display: 'grid',
              gap: 12,
              padding: 16,
              minWidth: 280,
              background: 'var(--gnome-card-bg-color, white)',
              border: '1px solid var(--gnome-card-shade-color, rgba(0, 0, 0, 0.08))',
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Spinner size="sm" />
              <strong style={{ fontSize: 13 }}>Loading widget module</strong>
            </div>
            <div
              style={{
                height: 8,
                overflow: 'hidden',
                borderRadius: 999,
                background: '#e5e7eb',
              }}
            >
              <div
                style={{
                  width: '68%',
                  height: '100%',
                  borderRadius: 999,
                  background: '#3584e4',
                }}
              />
            </div>
          </div>
        ),
        position: { x: 96, y: 220 },
        size: { width: 360 },
      },
      { duplicateStrategy: 'focus' }
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        background: 'var(--gnome-view-bg-color, #f6f7f8)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 560px) minmax(240px, 360px)',
          gap: 16,
          alignItems: 'start',
          maxWidth: 980,
        }}
      >
        <Card
          padding="lg"
          style={{
            display: 'grid',
            gap: 16,
          }}
        >
          <div>
            <Badge variant="accent">Lazy import</Badge>
            <h3 style={{ margin: '12px 0 4px', fontSize: 18 }}>
              Code-split widget body
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
              The shell opens at once; the body resolves from a delayed dynamic
              import so the Suspense fallback is visible.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <Card padding="sm">
              <strong>{isOpen ? 'Open' : 'Closed'}</strong>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Widget</div>
            </Card>
            <Card padding="sm">
              <strong>{isMinimized ? 'Hidden' : 'Visible'}</strong>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Viewport</div>
            </Card>
            <Card padding="sm">
              <strong>{loadRequests}</strong>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Loads</div>
            </Card>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Button variant="suggested" onClick={openLazyWidget}>
              {isOpen ? 'Focus lazy widget' : 'Open lazy widget'}
            </Button>
            <Button
              variant="flat"
              disabled={!isOpen}
              onClick={() =>
                isMinimized
                  ? manager.restoreWidget('lazy-performance')
                  : manager.minimizeWidget('lazy-performance')
              }
            >
              {isMinimized ? 'Restore' : 'Minimize'}
            </Button>
            <Button
              variant="destructive"
              disabled={!isOpen}
              onClick={() => manager.close('lazy-performance')}
            >
              Close
            </Button>
          </div>
        </Card>

        <Card
          padding="lg"
          style={{
            display: 'grid',
            gap: 12,
          }}
        >
          <strong style={{ fontSize: 13 }}>Loader shape</strong>
          <pre
            style={{
              margin: 0,
              padding: 12,
              overflowX: 'auto',
              background: '#111827',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
{`manager.open({
  id: 'lazy-performance',
  loader: () => import('./LazyFloatyPanel'),
  fallback: <Spinner />,
  props,
})`}
          </pre>
        </Card>
      </div>

      <FloatyViewport />
    </div>
  );
};

const LazyWidgetDemoContent = () => (
  <FloatyWidgetManager>
    <LazyWidgetControls />
  </FloatyWidgetManager>
);

export const WithLazyWidget: Story = {
  render: () => <LazyWidgetDemoContent />,
  parameters: {
    docs: {
      description: {
        story:
          'Open a widget with loader: () => import("./LazyFloatyPanel"). The body is wrapped in Suspense and uses the provided fallback while the module loads.',
      },
    },
  },
};
