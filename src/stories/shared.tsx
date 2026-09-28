import { Badge, Button, Card, ProgressBar, Separator } from '@gnome-ui/react';
import { type ComponentType, type CSSProperties, type ReactNode, useState } from 'react';
import '@gnome-ui/core/styles';
import '@gnome-ui/react/styles';

const muted: CSSProperties = { margin: 0, color: '#6b7280', fontSize: 13, lineHeight: 1.5 };

/** Floating instructions card shown in the corner of interactive stories. */
export const StoryHint = ({
  title,
  description,
  tips,
  children,
  placement = 'top-left',
}: {
  title: string;
  description?: ReactNode;
  tips?: ReactNode[];
  children?: ReactNode;
  placement?: 'top-left' | 'top-right';
}) => (
  <Card
    padding="md"
    style={{
      position: 'fixed',
      top: 16,
      [placement === 'top-left' ? 'left' : 'right']: 16,
      zIndex: 1,
      display: 'grid',
      gap: 10,
      width: 'min(340px, calc(100vw - 32px))',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto',
    }}
  >
    <strong style={{ fontSize: 15 }}>{title}</strong>
    {description && <p style={muted}>{description}</p>}
    {tips && tips.length > 0 && (
      <ul style={{ ...muted, display: 'grid', gap: 4, paddingLeft: 18 }}>
        {tips.map((tip, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static list
          <li key={index}>{tip}</li>
        ))}
      </ul>
    )}
    {children}
  </Card>
);

/** Small key/value grid used to display live state. */
export const StateGrid = ({ items }: { items: [label: string, value: ReactNode][] }) => (
  <dl
    style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gap: '4px 12px',
      margin: 0,
      fontSize: 12,
    }}
  >
    {items.map(([label, value]) => (
      <div key={label} style={{ display: 'contents' }}>
        <dt style={{ color: '#6b7280' }}>{label}</dt>
        <dd style={{ margin: 0, fontFamily: 'var(--font-family-mono)', wordBreak: 'break-all' }}>
          {value}
        </dd>
      </div>
    ))}
  </dl>
);

export const ButtonRow = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
);

/**
 * Floating-mode widgets have a transparent body: the content provides its own surface.
 * This one reads the Floaty tokens so it follows the active theme.
 */
export const Surface = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      padding: 14,
      background: 'var(--floaty-body-bg)',
      color: 'var(--floaty-fg)',
      border: '1px solid var(--floaty-border)',
      borderRadius: 'var(--floaty-radius)',
      boxShadow: 'var(--floaty-shadow)',
    }}
  >
    {children}
  </div>
);

const surfacedCache = new WeakMap<ComponentType<object>, ComponentType<object>>();

/** Wraps a widget body in `Surface` (stable identity per component). */
export const surfaced = <P extends object>(Component: ComponentType<P>): ComponentType<P> => {
  const key = Component as ComponentType<object>;
  let wrapped = surfacedCache.get(key);

  if (!wrapped) {
    wrapped = (props: object) => (
      <Surface>
        <Component {...(props as P)} />
      </Surface>
    );
    surfacedCache.set(key, wrapped);
  }

  return wrapped as ComponentType<P>;
};

// ─── Sample widget bodies ────────────────────────────────────────────────────

export const NotesContent = ({ label = 'Notes' }: { label?: string }) => (
  <div style={{ display: 'grid', gap: 10 }}>
    <strong>{label}</strong>
    <textarea
      aria-label={`${label} text`}
      defaultValue={'- Review the release checklist\n- Update the changelog\n- Ship it'}
      style={{
        minHeight: 90,
        padding: 8,
        border: '1px solid #d0d5dd',
        borderRadius: 6,
        font: 'inherit',
        resize: 'vertical',
      }}
    />
  </div>
);

export const MetricsContent = ({ label = 'Metrics' }: { label?: string }) => (
  <div style={{ display: 'grid', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <strong>{label}</strong>
      <Badge variant="success">Live</Badge>
    </div>
    {[
      ['CPU', 0.42],
      ['Memory', 0.68],
      ['Network', 0.23],
    ].map(([name, value]) => (
      <div key={name} style={{ display: 'grid', gap: 4, fontSize: 12 }}>
        <span>
          {name} · {Math.round(Number(value) * 100)}%
        </span>
        <ProgressBar value={Number(value)} />
      </div>
    ))}
  </div>
);

export const ChatContent = ({ label = 'Chat' }: { label?: string }) => {
  const [messages, setMessages] = useState(['Hey! Is the build green?', 'Yes, all checks passed.']);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <strong>{label}</strong>
      <div style={{ display: 'grid', gap: 6 }}>
        {messages.map((message, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: append-only demo list
            key={index}
            style={{
              justifySelf: index % 2 ? 'end' : 'start',
              padding: '6px 10px',
              borderRadius: 12,
              background: index % 2 ? '#3584e4' : '#eef0f3',
              color: index % 2 ? 'white' : '#1f2937',
              fontSize: 13,
            }}
          >
            {message}
          </span>
        ))}
      </div>
      <Button size="sm" onClick={() => setMessages((current) => [...current, 'Great 🎉'])}>
        Send reply
      </Button>
    </div>
  );
};

export const SettingsContent = ({ label = 'Settings' }: { label?: string }) => (
  <div style={{ display: 'grid', gap: 12, fontSize: 13 }}>
    <strong>{label}</strong>
    <label style={{ display: 'grid', gap: 4 }}>
      Workspace name
      <input
        defaultValue="Product team"
        style={{ padding: '6px 8px', border: '1px solid #d0d5dd', borderRadius: 6 }}
      />
    </label>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="checkbox" defaultChecked />
      Desktop notifications
    </label>
    <Separator />
    <span style={{ color: '#6b7280', fontSize: 12 }}>
      Drag the title bar, or resize from any edge or corner.
    </span>
  </div>
);

export const ActivityContent = () => (
  <div style={{ display: 'grid', gap: 8 }}>
    {[
      ['Sync completed', 'All customer records were refreshed from the remote source.'],
      ['Review needed', 'Three pending invoices need approval before the next billing run.'],
      ['Deploy queued', 'The preview environment is waiting for the current checks to finish.'],
      ['Backup created', 'A fresh snapshot is available for the workspace database.'],
      ['Usage spike', 'API traffic is 18% higher than the previous weekday average.'],
      ['Invite sent', 'A collaborator invitation is waiting for confirmation.'],
      ['Rule matched', 'Automation moved five leads into the follow-up segment.'],
      ['Export ready', 'The CSV package can be downloaded from the reports area.'],
    ].map(([title, detail]) => (
      <div
        key={title}
        style={{
          display: 'grid',
          gap: 2,
          padding: '8px 10px',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 8,
        }}
      >
        <strong style={{ fontSize: 13 }}>{title}</strong>
        <span style={{ color: '#6b7280', fontSize: 12 }}>{detail}</span>
      </div>
    ))}
  </div>
);

/** Rotating set of sample windows used by multi-window stories. */
export const SAMPLE_WINDOWS = [
  { title: 'Notes', component: NotesContent },
  { title: 'Metrics', component: MetricsContent },
  { title: 'Chat', component: ChatContent },
  { title: 'Settings', component: SettingsContent },
] as const;

export const getSampleWindow = (index: number) => {
  const sample = SAMPLE_WINDOWS[index % SAMPLE_WINDOWS.length];
  const round = Math.floor(index / SAMPLE_WINDOWS.length);

  return { ...sample, title: round ? `${sample.title} ${round + 1}` : sample.title };
};
