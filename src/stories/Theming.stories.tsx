import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { FloatyViewport } from '../components/Floaty/FloatyViewport';
import { FloatyWidgetManager } from '../context/FloatyWidgetManager';
import { useFloatyWidgetManager } from '../hooks/useFloatyWidgetManager';
import type { FloatyTheme } from '../types';
import { ChatContent, MetricsContent, StoryHint, surfaced } from './shared';

const FloatingMetrics = surfaced(MetricsContent);

type ThemeArgs = Required<{ [K in keyof FloatyTheme]: string }>;

const toTheme = (args: ThemeArgs): FloatyTheme =>
  Object.fromEntries(Object.entries(args).filter(([, value]) => value !== '')) as FloatyTheme;

const ThemedWidgets = () => {
  const { open } = useFloatyWidgetManager();

  useEffect(() => {
    open({
      id: 'theme-floating',
      title: 'Floating widget',
      component: FloatingMetrics,
      props: {},
      position: { x: 400, y: 80 },
      size: { width: 320 },
    });
    open({
      id: 'theme-window',
      mode: 'window',
      windowStyle: 'custom',
      title: 'Custom window',
      component: ChatContent,
      props: {},
      position: { x: 760, y: 140 },
      size: { width: 360, height: 300 },
    });
    open({
      id: 'theme-pinned',
      title: 'Pinned widget',
      component: FloatingMetrics,
      props: { label: 'Pinned' },
      position: { x: 400, y: 360 },
      size: { width: 320 },
      pinned: true,
    });
  }, [open]);

  return null;
};

const toSnippet = (theme: FloatyTheme) =>
  `<FloatyWidgetManager theme={${JSON.stringify(theme, null, 2)}}>`;

const meta = {
  title: 'Floaty/Theming',
  tags: ['autodocs'],
  render: (args) => {
    const theme = toTheme(args);

    return (
      <FloatyWidgetManager theme={theme}>
        <StoryHint
          title="Theming"
          description="Every token in the Controls panel maps to a CSS custom property. Hover the floating widgets to see the header colors; the window uses windowStyle='custom'."
        >
          <pre
            style={{
              margin: 0,
              padding: 10,
              overflowX: 'auto',
              background: '#111827',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 11,
            }}
          >
            {toSnippet(theme)}
          </pre>
        </StoryHint>
        <ThemedWidgets />
        <FloatyViewport />
      </FloatyWidgetManager>
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Pass `theme` to `FloatyWidgetManager` to restyle every widget it renders, or set the `--floaty-*` CSS variables directly.',
      },
    },
  },
  args: {
    background: '',
    foreground: '',
    bodyBackground: '',
    headerBackground: '',
    headerBackgroundHover: '',
    headerForeground: '',
    pinnedHeaderBackground: '',
    pinnedHeaderBackgroundHover: '',
    pinnedHeaderForeground: '',
    border: '',
    pinnedBorder: '',
    radius: '',
    shadow: '',
    fontFamily: '',
    headerPaddingBlock: '',
    headerPaddingInline: '',
    bodyPadding: '',
    buttonRadius: '',
    buttonHoverBackground: '',
  },
  argTypes: {
    background: { control: 'color', table: { category: 'Colors' } },
    foreground: { control: 'color', table: { category: 'Colors' } },
    bodyBackground: { control: 'color', table: { category: 'Colors' } },
    headerBackground: { control: 'color', table: { category: 'Header' } },
    headerBackgroundHover: { control: 'color', table: { category: 'Header' } },
    headerForeground: { control: 'color', table: { category: 'Header' } },
    pinnedHeaderBackground: { control: 'color', table: { category: 'Pinned' } },
    pinnedHeaderBackgroundHover: { control: 'color', table: { category: 'Pinned' } },
    pinnedHeaderForeground: { control: 'color', table: { category: 'Pinned' } },
    pinnedBorder: { control: 'color', table: { category: 'Pinned' } },
    border: { control: 'color', table: { category: 'Colors' } },
    radius: { control: 'text', table: { category: 'Shape' } },
    shadow: { control: 'text', table: { category: 'Shape' } },
    buttonRadius: { control: 'text', table: { category: 'Shape' } },
    buttonHoverBackground: { control: 'color', table: { category: 'Shape' } },
    fontFamily: { control: 'text', table: { category: 'Typography & spacing' } },
    headerPaddingBlock: { control: 'text', table: { category: 'Typography & spacing' } },
    headerPaddingInline: { control: 'text', table: { category: 'Typography & spacing' } },
    bodyPadding: { control: 'text', table: { category: 'Typography & spacing' } },
  },
} satisfies Meta<ThemeArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = {
  args: {
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    bodyBackground: '#1e1e2e',
    headerBackground: '#181825',
    headerForeground: '#cdd6f4',
    pinnedHeaderBackground: '#89b4fa',
    pinnedHeaderForeground: '#1e1e2e',
    border: '#313244',
    pinnedBorder: '#89b4fa',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    buttonHoverBackground: 'rgba(255, 255, 255, 0.1)',
  },
};

export const Brand: Story = {
  args: {
    headerBackground: '#0f766e',
    headerBackgroundHover: '#115e59',
    headerForeground: '#ffffff',
    pinnedHeaderBackground: '#f59e0b',
    pinnedHeaderForeground: '#1f2937',
    border: '#0f766e',
    pinnedBorder: '#f59e0b',
    radius: '16px',
    buttonRadius: '999px',
    fontFamily: 'Georgia, serif',
  },
};

export const Compact: Story = {
  args: {
    radius: '4px',
    headerPaddingBlock: '4px',
    headerPaddingInline: '8px',
    bodyPadding: '6px',
    buttonRadius: '2px',
    shadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
  },
};
