/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: viteConfig.plugins?.filter((plugin) => plugin?.name !== 'unplugin-dts'),
  }),
};

export default config;
