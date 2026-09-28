import { GhClientProvider, useGhRepo, useGhRepoCommits } from '@api-hooks/gh';
import { Badge, Button, Spinner } from '@gnome-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useRef } from 'react';
import { FloatyViewport } from '../components/Floaty/FloatyViewport';
import { FloatyWidgetManager } from '../context/FloatyWidgetManager';
import { useFloatyWidgetManager } from '../hooks/useFloatyWidgetManager';
import type { FloatyDuplicateStrategy, FloatyMode, FloatyWidget } from '../types';
import { ButtonRow, getSampleWindow, StateGrid, StoryHint, surfaced } from './shared';

interface ManagerArgs {
  mode: FloatyMode;
  duplicateStrategy: FloatyDuplicateStrategy;
  openCollapsed: boolean;
  openPinned: boolean;
  lazyDelay: number;
  lazyFails: boolean;
  customFallback: boolean;
  owner: string;
  repo: string;
}

const Code = ({ children }: { children: ReactNode }) => (
  <pre
    style={{
      margin: 0,
      padding: 10,
      overflowX: 'auto',
      background: '#111827',
      borderRadius: 6,
      color: '#e5e7eb',
      fontSize: 11,
      lineHeight: 1.5,
    }}
  >
    {children}
  </pre>
);

const describeWidget = (widget: FloatyWidget) =>
  [
    widget.isMinimized ? 'minimized' : 'visible',
    widget.isCollapsed && 'collapsed',
    widget.isPinned && 'pinned',
    widget.isMaximized && 'maximized',
  ]
    .filter(Boolean)
    .join(' · ');

const WidgetInspector = () => {
  const manager = useFloatyWidgetManager();
  const widgets = Array.from(manager.widgets.values());

  if (widgets.length === 0) {
    return <span style={{ color: '#6b7280', fontSize: 12 }}>No widgets open.</span>;
  }

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {widgets.map((widget) => (
        <div
          key={widget.id}
          style={{
            display: 'grid',
            gap: 4,
            padding: '6px 8px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
            <strong>{widget.id}</strong>
            <span style={{ color: '#6b7280' }}>{describeWidget(widget)}</span>
          </div>
          <ButtonRow>
            <Button size="sm" variant="flat" onClick={() => manager.bringToFront(widget.id)}>
              Focus
            </Button>
            <Button
              size="sm"
              variant="flat"
              onClick={() =>
                widget.isCollapsed
                  ? manager.expandWidget(widget.id)
                  : manager.collapseWidget(widget.id)
              }
            >
              {widget.isCollapsed ? 'Expand' : 'Collapse'}
            </Button>
            <Button
              size="sm"
              variant="flat"
              onClick={() =>
                widget.isMinimized
                  ? manager.restoreWidget(widget.id)
                  : manager.minimizeWidget(widget.id)
              }
            >
              {widget.isMinimized ? 'Restore' : 'Minimize'}
            </Button>
            <Button size="sm" variant="flat" onClick={() => manager.close(widget.id)}>
              Close
            </Button>
          </ButtonRow>
        </div>
      ))}
    </div>
  );
};

// ─── Manager API ─────────────────────────────────────────────────────────────

const ManagerApiDemo = ({ mode, duplicateStrategy, openCollapsed, openPinned }: ManagerArgs) => {
  const manager = useFloatyWidgetManager();
  const openedRef = useRef(0);
  const widgets = Array.from(manager.widgets.values());

  const openWidget = () => {
    const sample = getSampleWindow(openedRef.current);
    openedRef.current += 1;

    manager.open(
      {
        id: 'demo',
        mode,
        title: sample.title,
        component: mode === 'window' ? sample.component : surfaced(sample.component),
        props: {},
        position: { x: 400 + (openedRef.current % 5) * 40, y: 80 + (openedRef.current % 5) * 40 },
        size: { width: 340, height: mode === 'window' ? 240 : undefined },
        collapsed: openCollapsed,
        pinned: openPinned,
      },
      { duplicateStrategy },
    );
  };

  return (
    <StoryHint
      title="Widget manager API"
      description={
        <>
          Open the same id repeatedly and compare the <code>duplicateStrategy</code> control:{' '}
          <em>replace</em> swaps the widget, <em>focus</em> raises it, <em>duplicate</em> opens{' '}
          <code>demo-2</code>, <code>demo-3</code>…
        </>
      }
    >
      <Button variant="suggested" onClick={openWidget}>
        Open “demo”
      </Button>
      <Code>{`manager.open(
  {
    id: 'demo',
    mode: '${mode}',
    collapsed: ${openCollapsed},
    pinned: ${openPinned},
    component,
    props,
  },
  { duplicateStrategy: '${duplicateStrategy}' },
)`}</Code>
      <StateGrid
        items={[
          ['total', widgets.length],
          ['visible', widgets.filter((widget) => !widget.isMinimized).length],
          ['minimized', widgets.filter((widget) => widget.isMinimized).length],
        ]}
      />
      <strong style={{ fontSize: 12 }}>Bulk actions</strong>
      <ButtonRow>
        <Button size="sm" onClick={() => manager.collapseAll()}>
          collapseAll
        </Button>
        <Button size="sm" onClick={() => manager.expandAll()}>
          expandAll
        </Button>
        <Button size="sm" onClick={() => manager.minimizeAll()}>
          minimizeAll
        </Button>
        <Button size="sm" onClick={() => manager.restoreAll()}>
          restoreAll
        </Button>
        <Button size="sm" onClick={() => manager.pinAll()}>
          pinAll
        </Button>
        <Button size="sm" onClick={() => manager.unpinAll()}>
          unpinAll
        </Button>
        <Button size="sm" variant="destructive" onClick={() => manager.closeAll()}>
          closeAll
        </Button>
      </ButtonRow>
      <strong style={{ fontSize: 12 }}>Widgets</strong>
      <WidgetInspector />
    </StoryHint>
  );
};

// ─── Lazy loading ────────────────────────────────────────────────────────────

const LazyDemo = ({ mode, lazyDelay, lazyFails, customFallback }: ManagerArgs) => {
  const manager = useFloatyWidgetManager();
  const loadsRef = useRef(0);

  const openLazy = () => {
    manager.open({
      id: 'lazy',
      mode,
      title: lazyFails ? 'Failing module' : 'Lazy module',
      loader: async () => {
        loadsRef.current += 1;
        await new Promise((resolve) => window.setTimeout(resolve, lazyDelay));
        if (lazyFails) {
          throw new Error('Simulated chunk failure');
        }
        return import('../components/Floaty/LazyFloatyPanel');
      },
      props: { metric: 'Loaded after', value: `${lazyDelay} ms` },
      fallback: customFallback ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16 }}>
          <Spinner size="sm" />
          <strong style={{ fontSize: 13 }}>Fetching widget chunk…</strong>
        </div>
      ) : undefined,
      position: { x: 420, y: 120 },
      size: { width: 360, height: mode === 'window' ? 240 : undefined },
    });
  };

  return (
    <StoryHint
      title="Lazy-loaded widgets"
      description={
        <>
          The widget shell opens immediately and the body resolves from a dynamic import inside{' '}
          <code>Suspense</code>. Enable <code>lazyFails</code> to see the error state and its retry
          button.
        </>
      }
    >
      <Button variant="suggested" onClick={openLazy}>
        Open lazy widget
      </Button>
      <Code>{`manager.open({
  id: 'lazy',
  loader: () => import('./LazyFloatyPanel'),
  fallback: ${customFallback ? '<Spinner />' : 'undefined /* built-in */'},
  props,
})`}</Code>
    </StoryHint>
  );
};

// ─── Real data ───────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
});

const RepositoryWidget = ({ owner, repo }: { owner: string; repo: string }) => {
  const repository = useGhRepo(owner, repo);
  const commits = useGhRepoCommits(owner, repo, { per_page: 5 });

  if (repository.isLoading) {
    return <Spinner size="sm" />;
  }

  if (repository.isError) {
    return <span style={{ color: '#b91c1c', fontSize: 13 }}>{repository.error.message}</span>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {repository.data?.language && <Badge variant="accent">{repository.data.language}</Badge>}
        <Badge variant="neutral">★ {repository.data?.stargazers_count}</Badge>
        <Badge variant="neutral">Forks {repository.data?.forks_count}</Badge>
        <Badge variant="neutral">Issues {repository.data?.open_issues_count}</Badge>
      </div>
      <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
        {repository.data?.description ?? 'No description available.'}
      </p>
      <strong style={{ fontSize: 13 }}>Latest commits</strong>
      <ul style={{ display: 'grid', gap: 6, margin: 0, padding: 0, listStyle: 'none' }}>
        {commits.data?.values.map((commit) => (
          <li key={commit.sha} style={{ fontSize: 12 }}>
            <a
              href={commit.html_url}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#2563eb', fontWeight: 600 }}
            >
              {commit.commit.message.split('\n')[0]}
            </a>
            <div style={{ color: '#6b7280' }}>
              {commit.sha.slice(0, 7)} · {commit.commit.author.name}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const RepositoryDemo = ({ mode, owner, repo }: ManagerArgs) => {
  const manager = useFloatyWidgetManager();

  return (
    <StoryHint
      title="Real data: GitHub repository"
      description="Any component can become a widget. Props are captured on open, so each repository gets its own widget. Change owner/repo in Controls and open another one."
    >
      <Button
        variant="suggested"
        onClick={() =>
          manager.open(
            {
              id: `repo-${owner}-${repo}`,
              mode,
              title: `${owner}/${repo}`,
              component: mode === 'window' ? RepositoryWidget : surfaced(RepositoryWidget),
              props: { owner, repo },
              position: { x: 400 + manager.widgets.size * 40, y: 80 + manager.widgets.size * 40 },
              size: { width: 420, height: mode === 'window' ? 360 : undefined },
            },
            { duplicateStrategy: 'focus' },
          )
        }
      >
        Open {owner}/{repo}
      </Button>
    </StoryHint>
  );
};

const meta = {
  title: 'Floaty/Manager',
  tags: ['autodocs'],
  decorators: [
    // Data providers wrap the manager so widgets rendered by the viewport can use them.
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <GhClientProvider>
          <FloatyWidgetManager>
            <Story />
            <FloatyViewport />
          </FloatyWidgetManager>
        </GhClientProvider>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '`FloatyWidgetManager` stores every widget opened with `manager.open()` and `FloatyViewport` renders them. Use `useFloatyWidgetManager()` anywhere below the manager to open, update and control widgets.',
      },
    },
  },
  args: {
    mode: 'floating',
    duplicateStrategy: 'replace',
    openCollapsed: false,
    openPinned: false,
    lazyDelay: 1200,
    lazyFails: false,
    customFallback: false,
    owner: 'eljijuna',
    repo: 'gnome-ui',
  },
  argTypes: {
    mode: { control: 'inline-radio', options: ['floating', 'window'] },
    duplicateStrategy: {
      control: 'inline-radio',
      options: ['replace', 'focus', 'duplicate'],
      table: { category: 'open()' },
    },
    openCollapsed: {
      control: 'boolean',
      description: 'Maps to `open({ collapsed })`.',
      table: { category: 'open()' },
    },
    openPinned: {
      control: 'boolean',
      description: 'Maps to `open({ pinned })`.',
      table: { category: 'open()' },
    },
    lazyDelay: {
      control: { type: 'range', min: 0, max: 5000, step: 100 },
      description: 'Simulated network delay for the dynamic import, in ms.',
      table: { category: 'Lazy loading' },
    },
    lazyFails: { control: 'boolean', table: { category: 'Lazy loading' } },
    customFallback: {
      control: 'boolean',
      description: 'Pass a custom `fallback` instead of the built-in loading state.',
      table: { category: 'Lazy loading' },
    },
    owner: { control: 'text', table: { category: 'GitHub' } },
    repo: { control: 'text', table: { category: 'GitHub' } },
  },
} satisfies Meta<ManagerArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

const include = (...names: (keyof ManagerArgs)[]) => ({ controls: { include: names } });

export const ManagerApi: Story = {
  render: (args) => <ManagerApiDemo {...args} />,
  parameters: include('mode', 'duplicateStrategy', 'openCollapsed', 'openPinned'),
};

export const LazyLoading: Story = {
  render: (args) => <LazyDemo {...args} />,
  parameters: include('mode', 'lazyDelay', 'lazyFails', 'customFallback'),
};

export const GitHubRepository: Story = {
  render: (args) => <RepositoryDemo {...args} />,
  parameters: include('mode', 'owner', 'repo'),
};
