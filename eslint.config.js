import eslintReactTsx from 'super-configs/eslint/react/tsx';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'storybook-static/**', 'node_modules/**'],
  },
  ...eslintReactTsx,
  {
    rules: {
      // Biome handles import sorting and formatting — disable conflicting ESLint rules
      'import/order': 'off',
      '@stylistic/indent': 'off',
      '@stylistic/brace-style': 'off',
      '@stylistic/padding-line-between-statements': 'off',
    },
  },
];
