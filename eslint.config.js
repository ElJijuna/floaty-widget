import { createEslintConfig } from 'super-configs/eslint';

export default createEslintConfig({
  react: true,
  testFramework: 'vitest',
  ignores: ['dist/**', 'coverage/**', 'storybook-static/**', 'node_modules/**'],
  overrides: [
    {
      rules: {
        // Biome handles import sorting and formatting — disable conflicting ESLint rules
        'import/order': 'off',
        '@stylistic/indent': 'off',
        '@stylistic/brace-style': 'off',
        '@stylistic/padding-line-between-statements': 'off',
      },
    },
  ],
});
