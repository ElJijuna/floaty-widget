import './preview.css';

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    layout: 'fullscreen',
    options: {
      storySort: {
        order: [
          'Floaty',
          [
            'Widget',
            'Desktop',
            ['Workspace', 'Layouts', 'Taskbar & preview'],
            'Manager',
            'Theming',
          ],
        ],
      },
    },
    viewport: {
      defaultViewport: 'responsive',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
