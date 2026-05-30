import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GhClientProvider, useGhRepo, useGhRepoCommits } from '@api-hooks/gh';
import { Badge, Button, Card, Separator, Spinner } from '@gnome-ui/react';
import { Floaty } from './Floaty';
import { FloatyViewport } from './FloatyViewport';
import { FloatyPreview } from './FloatyPreview';
import { FloatyWidgetManager } from '../../context/FloatyWidgetManager';
import { useFloatyWidgetManager } from '../../hooks/useFloatyWidgetManager';
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

const activityItems = [
  ['Sync completed', 'All customer records were refreshed from the remote source.'],
  ['Review needed', 'Three pending invoices need approval before the next billing run.'],
  ['Deploy queued', 'The preview environment is waiting for the current checks to finish.'],
  ['Backup created', 'A fresh snapshot is available for the workspace database.'],
  ['Usage spike', 'API traffic is 18% higher than the previous weekday average.'],
  ['Invite sent', 'A collaborator invitation is waiting for confirmation.'],
  ['Rule matched', 'Automation moved five leads into the follow-up segment.'],
  ['Export ready', 'The CSV package can be downloaded from the reports area.'],
  ['Alert muted', 'The duplicate notification was silenced for the next hour.'],
  ['Index rebuilt', 'Search results now include the latest content updates.'],
];

export const ScrollbarAndFade: Story = {
  render: () => (
    <Floaty
      title="Activity Feed"
      initialPosition={{ x: 96, y: 128 }}
      initialSize={{ width: 360, height: 260 }}
      isActive
    >
      <div
        style={{
          display: 'grid',
          gap: 10,
          padding: 12,
        }}
      >
        {activityItems.map(([title, detail], index) => (
          <div
            key={title}
            style={{
              display: 'grid',
              gap: 4,
              padding: '10px 12px',
              background: 'var(--gnome-card-bg-color, white)',
              border: '1px solid var(--gnome-card-shade-color, rgba(0, 0, 0, 0.08))',
              borderRadius: 8,
            }}
          >
            <strong style={{ fontSize: 13 }}>
              {index + 1}. {title}
            </strong>
            <span style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>
              {detail}
            </span>
          </div>
        ))}
      </div>
    </Floaty>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Forces vertical overflow so the themed native scrollbar and body edge fade are visible.',
      },
    },
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

const UxPanel = ({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) => (
  <div
    style={{
      display: 'grid',
      gap: 10,
      minWidth: 260,
      padding: 16,
      background: 'var(--gnome-card-bg-color, white)',
      border: '1px solid var(--gnome-card-shade-color, rgba(0, 0, 0, 0.08))',
      borderRadius: 8,
      color: 'var(--gnome-card-fg-color, #111827)',
    }}
  >
    <Badge variant="neutral">{label}</Badge>
    <strong style={{ fontSize: 24 }}>{value}</strong>
    <p style={{ margin: 0, color: '#6b7280', fontSize: 13, lineHeight: 1.5 }}>
      {detail}
    </p>
  </div>
);

const UxWidgetList = () => {
  const manager = useFloatyWidgetManager();
  const widgets = Array.from(manager.widgets.values());

  if (widgets.length === 0) {
    return (
      <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
        Open a workspace to inspect widget states here.
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {widgets.map((widget) => (
        <div
          key={widget.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 8,
            alignItems: 'center',
            padding: '8px 10px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <strong
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 13,
              }}
            >
              {widget.title ?? widget.id}
            </strong>
            <span style={{ color: '#6b7280', fontSize: 12 }}>
              {widget.isMinimized ? 'Minimized' : 'Visible'}
              {widget.isCollapsed ? ' / Collapsed' : ''}
              {widget.isPinned ? ' / Pinned' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <Button
              size="sm"
              variant="flat"
              onClick={() =>
                widget.isMinimized
                  ? manager.restoreWidget(widget.id)
                  : manager.minimizeWidget(widget.id)
              }
            >
              {widget.isMinimized ? 'Restore' : 'Hide'}
            </Button>
            <Button
              size="sm"
              variant="flat"
              onClick={() => manager.bringToFront(widget.id)}
            >
              Focus
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const StoryUxControls = () => {
  const manager = useFloatyWidgetManager();
  const [lazyLoads, setLazyLoads] = useState(0);
  const widgets = Array.from(manager.widgets.values());
  const visible = widgets.filter((widget) => !widget.isMinimized);
  const minimized = widgets.filter((widget) => widget.isMinimized);
  const collapsed = widgets.filter((widget) => widget.isCollapsed);

  const openWorkspace = () => {
    manager.open({
      id: 'ux-insights',
      title: 'Insights',
      component: UxPanel,
      props: {
        label: 'Active',
        value: '3 signals',
        detail: 'A normal widget for focus, collapse, resize, and drag checks.',
      },
      position: { x: 72, y: 210 },
      size: { width: 330 },
    });

    manager.open({
      id: 'ux-activity',
      title: 'Activity',
      component: UxPanel,
      props: {
        label: 'Queue',
        value: '12 events',
        detail: 'Use this one to test bring-to-front and active header state.',
      },
      position: { x: 430, y: 260 },
      size: { width: 330 },
    });

    manager.open({
      id: 'ux-clamped',
      title: 'Clamped',
      component: UxPanel,
      props: {
        label: 'Viewport',
        value: 'Safe',
        detail: 'This opens with an intentionally large position and is clamped into view.',
      },
      position: { x: 4000, y: -200 },
      size: { width: 320 },
    });
  };

  const openLazySuccess = () => {
    manager.open(
      {
        id: 'ux-lazy-success',
        title: 'Lazy Success',
        loader: () =>
          new Promise<typeof import('./LazyFloatyPanel')>((resolve) => {
            window.setTimeout(() => {
              setLazyLoads((count) => count + 1);
              void import('./LazyFloatyPanel').then(resolve);
            }, 750);
          }),
        props: { metric: 'Deferred body', value: 'Loaded' },
        position: { x: 180, y: 420 },
        size: { width: 360 },
      },
      { duplicateStrategy: 'focus' }
    );
  };

  const openLazyError = () => {
    manager.open(
      {
        id: 'ux-lazy-error',
        title: 'Lazy Error',
        loader: () =>
          new Promise<typeof import('./LazyFloatyPanel')>((_, reject) => {
            window.setTimeout(() => {
              setLazyLoads((count) => count + 1);
              reject(new Error('Simulated chunk failure'));
            }, 650);
          }),
        props: { metric: 'Deferred body', value: 'Failed' },
        position: { x: 560, y: 420 },
        size: { width: 360 },
      },
      { duplicateStrategy: 'replace' }
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        background: '#f3f4f6',
        color: '#111827',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 560px) minmax(280px, 420px)',
          gap: 16,
          alignItems: 'start',
          maxWidth: 1040,
        }}
      >
        <Card padding="lg" style={{ display: 'grid', gap: 16 }}>
          <div>
            <Badge variant="accent">Story UX</Badge>
            <h3 style={{ margin: '12px 0 4px', fontSize: 18 }}>
              Floaty workspace test bench
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
              Exercise the current UX states from one place: focus, minimize,
              restore, collapse, viewport clamping, lazy loading, and lazy error.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <Card padding="sm">
              <strong>{widgets.length}</strong>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Total</div>
            </Card>
            <Card padding="sm">
              <strong>{visible.length}</strong>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Visible</div>
            </Card>
            <Card padding="sm">
              <strong>{minimized.length}</strong>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Hidden</div>
            </Card>
            <Card padding="sm">
              <strong>{collapsed.length}</strong>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Collapsed</div>
            </Card>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Button variant="suggested" onClick={openWorkspace}>
              Open workspace
            </Button>
            <Button variant="flat" onClick={openLazySuccess}>
              Open lazy success
            </Button>
            <Button variant="flat" onClick={openLazyError}>
              Open lazy error
            </Button>
            <Button variant="flat" onClick={() => manager.collapseAll()}>
              Collapse all
            </Button>
            <Button variant="flat" onClick={() => manager.restoreAll()}>
              Restore hidden
            </Button>
            <Button variant="destructive" onClick={() => manager.closeAll()}>
              Close all
            </Button>
          </div>
        </Card>

        <Card padding="lg" style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontSize: 13 }}>Widget state inspector</strong>
            {lazyLoads > 0 && <Badge variant="neutral">{lazyLoads} lazy loads</Badge>}
          </div>
          <UxWidgetList />
        </Card>
      </div>

      <FloatyViewport />
    </div>
  );
};

const StoryUxDemoContent = () => (
  <FloatyWidgetManager>
    <StoryUxControls />
  </FloatyWidgetManager>
);

export const StoryUxPlayground: Story = {
  render: () => <StoryUxDemoContent />,
  parameters: {
    docs: {
      description: {
        story:
          'A focused UX test bench for the existing Floaty states: multiple widgets, minimization, restore, collapse, active focus, viewport clamping, lazy loading, and lazy error handling.',
      },
    },
  },
};

// ─── WithPreview ─────────────────────────────────────────────────────────────

const PREVIEW_WIDGETS = [
  { id: 'preview-a', label: 'Analytics', color: '#3584e4' },
  { id: 'preview-b', label: 'Notifications', color: '#e84393' },
  { id: 'preview-c', label: 'Activity', color: '#33d17a' },
];

const PreviewWidgetContent = ({ label, color }: { label: string; color: string }) => {
  const [count, setCount] = useState(0);
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 240 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: 13 }}>{label} panel</span>
      </div>
      <Separator />
      <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
        Internal counter: <strong>{count}</strong>
      </p>
      <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
        The preview below has its own independent counter — internal state diverges between the real widget and its thumbnail.
      </p>
      <Button size="sm" onClick={() => setCount((c) => c + 1)}>
        Increment
      </Button>
    </div>
  );
};

const PreviewDock = () => {
  const manager = useFloatyWidgetManager();
  const widgets = Array.from(manager.widgets.values()).filter((w) => w.component);

  if (widgets.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 8,
        padding: '8px 12px',
        background: 'rgba(15, 15, 15, 0.82)',
        borderRadius: 14,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        zIndex: 9000,
      }}
    >
      {widgets.map((widget) => (
        <button
          key={widget.id}
          type="button"
          onClick={() => {
            manager.restoreWidget(widget.id);
            manager.bringToFront(widget.id);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          title={`Bring ${String(widget.title)} to front`}
        >
          <FloatyPreview
            id={widget.id}
            scale={0.38}
            style={{
              width: 148,
              height: 90,
              borderRadius: 8,
              background: 'white',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
            fallback={
              <div
                style={{
                  width: 148,
                  height: 90,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 11,
                }}
              >
                Not open
              </div>
            }
          />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>
            {String(widget.title)}
          </span>
        </button>
      ))}
    </div>
  );
};

const PreviewStoryControls = () => {
  const manager = useFloatyWidgetManager();

  const toggle = (id: string, label: string, color: string) => {
    const widget = manager.getWidget(id);
    if (widget) {
      manager.close(id);
    } else {
      manager.open(
        {
          id,
          title: label,
          component: PreviewWidgetContent,
          props: { label, color },
          position: {
            x: 80 + PREVIEW_WIDGETS.findIndex((w) => w.id === id) * 120,
            y: 80,
          },
          size: { width: 280 },
        },
        { duplicateStrategy: 'focus' }
      );
    }
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 style={{ margin: '0 0 4px' }}>FloatyPreview — dock thumbnail</h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
          Open widgets to see live scaled thumbnails in the dock bar below. Internal
          state (counter) diverges between the real widget and its preview.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PREVIEW_WIDGETS.map(({ id, label, color }) => {
          const isOpen = Boolean(manager.getWidget(id));
          return (
            <Button
              key={id}
              size="sm"
              variant={isOpen ? 'destructive' : 'suggested'}
              onClick={() => toggle(id, label, color)}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                  display: 'inline-block',
                  marginRight: 6,
                }}
              />
              {isOpen ? `Close ${label}` : `Open ${label}`}
            </Button>
          );
        })}
      </div>

      <Badge variant="neutral" style={{ width: 'fit-content', fontSize: 11 }}>
        Tip — click a thumbnail in the dock to bring the widget to front
      </Badge>

      <FloatyViewport />
      <PreviewDock />
    </div>
  );
};

const PreviewStoryContent = () => (
  <FloatyWidgetManager>
    <PreviewStoryControls />
  </FloatyWidgetManager>
);

export const WithPreview: Story = {
  render: () => <PreviewStoryContent />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates `FloatyPreview` — a scaled-down live thumbnail of any registered widget. Each thumbnail in the dock bar is a `<FloatyPreview id={...} scale={0.38} />`. Clicking a thumbnail restores and focuses the widget. Internal state (the counter) is independent between the real widget and its preview.',
      },
    },
  },
};
