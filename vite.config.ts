/// <reference types="node" />
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.bench.ts',
        'src/components/Floaty/LazyFloatyPanel.tsx',
        'src/test/**',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.test.tsx',
        'src/**/*.test.ts',
        'src/**/*.bench.ts',
        'src/components/Floaty/LazyFloatyPanel.tsx',
        'src/test/**',
      ],
      rollupTypes: true,
      tsconfigPath: './tsconfig.json',
    }),
  ],
  base: process.env.GITHUB_PAGES ? '/floaty/' : '/',
  build: {
    copyPublicDir: false,
    lib: {
      entry: 'src/index.ts',
      name: 'FloatyWidget',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.es.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: (id) => /^react(-dom)?(\/.*)?$/.test(id),
    },
  },
});
