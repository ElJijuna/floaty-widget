import { createEslintConfig } from 'super-configs/eslint';

export default createEslintConfig({
  react: true,
  testFramework: 'vitest',
  ignores: ['dist/**', 'coverage/**', 'storybook-static/**', 'node_modules/**'],
});
