interface LazyFloatyPanelProps {
  metric: string;
  value: string;
}

const LazyFloatyPanel = ({ metric, value }: LazyFloatyPanelProps) => {
  return (
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
      <span
        style={{
          width: 'fit-content',
          padding: '3px 8px',
          borderRadius: 999,
          background: 'var(--gnome-accent-bg-color, #3584e4)',
          color: 'var(--gnome-accent-fg-color, white)',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        Lazy loaded
      </span>
      <div>
        <div style={{ color: '#6b7280', fontSize: 12 }}>{metric}</div>
        <strong style={{ display: 'block', marginTop: 4, fontSize: 28 }}>
          {value}
        </strong>
      </div>
      <p style={{ margin: 0, color: '#4b5563', fontSize: 13, lineHeight: 1.5 }}>
        This panel lives in its own module and is loaded only when the widget is
        rendered.
      </p>
    </div>
  );
};

export default LazyFloatyPanel;
